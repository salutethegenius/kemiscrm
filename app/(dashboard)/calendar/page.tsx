'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Calendar as CalendarIcon, Plus, Trash2, ExternalLink } from 'lucide-react'
import type { UserCalendar } from '@/lib/types'

const DEFAULT_ACCOUNT_CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=c_7397d2f92aac71560be3014233bdbec5b89c25a5ed2e14d39b5137bda882d830%40group.calendar.google.com&ctz=Europe%2FLondon'

export default function CalendarPage() {
  const [accountCalendarUrl, setAccountCalendarUrl] = useState<string | null>(null)
  const [userCalendars, setUserCalendars] = useState<UserCalendar[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newCalName, setNewCalName] = useState('My Calendar')
  const [newCalUrl, setNewCalUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const profileRes = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    const orgId = profileRes.data?.organization_id
    if (orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single()
      const url = (org?.settings as Record<string, unknown>)?.account_calendar_embed_url as string | undefined
      setAccountCalendarUrl(url || null)
    } else {
      setAccountCalendarUrl(null)
    }

    const { data: cals } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order')
    setUserCalendars(cals || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddCalendar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCalUrl.trim()) {
      toast({ title: 'Error', description: 'Enter an embed URL', variant: 'destructive' })
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }
    const { error } = await supabase.from('user_calendars').insert({
      user_id: user.id,
      name: newCalName.trim() || 'My Calendar',
      embed_url: newCalUrl.trim(),
      sort_order: userCalendars.length,
    })
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }
    toast({ title: 'Calendar added', description: 'Your calendar has been added.' })
    setAddDialogOpen(false)
    setNewCalName('My Calendar')
    setNewCalUrl('')
    fetchData()
    setSaving(false)
  }

  const handleRemoveCalendar = async (id: string) => {
    const { error } = await supabase.from('user_calendars').delete().eq('id', id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Calendar removed' })
    fetchData()
  }

  const displayAccountUrl = accountCalendarUrl || DEFAULT_ACCOUNT_CALENDAR_URL

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 mt-1">Account calendar and your Google Calendars</p>
      </div>

      <div className="space-y-8">
        {/* Account Calendar - all users see this */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Account Calendar
            </CardTitle>
            <CardDescription>
              Shared calendar for the whole team. Admins can change it in Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-white overflow-hidden" style={{ minHeight: 400 }}>
              <iframe
                src={displayAccountUrl}
                style={{ border: 0, width: '100%', height: 500 }}
                frameBorder="0"
                scrolling="no"
                title="Account Calendar"
              />
            </div>
          </CardContent>
        </Card>

        {/* My Calendars - personal Google Calendars */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                  My Calendars
                </CardTitle>
                <CardDescription>
                  Add your personal Google Calendar(s). These do not replace the account calendar.
                </CardDescription>
              </div>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Google Calendar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {userCalendars.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border rounded-lg border-dashed">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No personal calendars added yet.</p>
                <p className="text-sm mt-1">Click &quot;Add Google Calendar&quot; and paste your Google Calendar embed URL.</p>
                <Button className="mt-4" variant="outline" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Google Calendar
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {userCalendars.map((cal) => (
                  <div key={cal.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                      <span className="font-medium text-gray-700">{cal.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveCalendar(cal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <iframe
                      src={cal.embed_url}
                      style={{ border: 0, width: '100%', height: 400 }}
                      frameBorder="0"
                      scrolling="no"
                      title={cal.name}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cal.com link */}
        <Card>
          <CardContent className="pt-6">
            <Button variant="outline" asChild>
              <a href="https://cal.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Set up Cal.com for scheduling
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Google Calendar</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCalendar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cal_name">Name</Label>
              <Input
                id="cal_name"
                value={newCalName}
                onChange={(e) => setNewCalName(e.target.value)}
                placeholder="My Calendar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal_url">Embed URL *</Label>
              <Input
                id="cal_url"
                value={newCalUrl}
                onChange={(e) => setNewCalUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/embed?src=..."
                required
              />
              <p className="text-xs text-gray-500">
                In Google Calendar: Settings → your calendar → Integrate calendar → copy the embed code and use the src URL.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Calendar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
