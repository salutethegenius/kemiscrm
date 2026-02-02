'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [accountCalendarUrl, setAccountCalendarUrl] = useState('')
  const [accountCalendarSaving, setAccountCalendarSaving] = useState(false)
  const [canManageOrg, setCanManageOrg] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()
      const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
      setCanManageOrg(!!isAdmin)
      setOrgId(profile?.organization_id ?? null)
      if (profile?.organization_id && isAdmin) {
        const { data: org } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', profile.organization_id)
          .single()
        const url = (org?.settings as Record<string, unknown>)?.account_calendar_embed_url as string | undefined
        setAccountCalendarUrl(url ?? '')
      }
    }
    load()
  }, [])

  const handleSaveAccountCalendar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !canManageOrg) return
    setAccountCalendarSaving(true)
    const { data: org } = await supabase.from('organizations').select('settings').eq('id', orgId).single()
    const current = (org?.settings as Record<string, unknown>) || {}
    const { error } = await supabase
      .from('organizations')
      .update({
        settings: { ...current, account_calendar_embed_url: accountCalendarUrl.trim() || null },
      })
      .eq('id', orgId)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Saved', description: 'Account calendar URL has been updated.' })
    }
    setAccountCalendarSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }

    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Password updated', description: 'Your password has been changed.' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="space-y-6">
        {/* Account Calendar - admin/owner only */}
        {canManageOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Account Calendar</CardTitle>
              <CardDescription>
                Google Calendar embed URL shown to all users on the Calendar page. Leave empty to use the default.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAccountCalendar} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountCalendarUrl">Embed URL</Label>
                  <Input
                    id="accountCalendarUrl"
                    value={accountCalendarUrl}
                    onChange={(e) => setAccountCalendarUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/embed?src=..."
                  />
                </div>
                <Button type="submit" disabled={accountCalendarSaving}>
                  {accountCalendarSaving ? 'Saving...' : 'Save Account Calendar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
