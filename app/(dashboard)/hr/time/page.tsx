'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  Clock, 
  Play, 
  Square, 
  Plus, 
  Calendar,
  Timer,
  Coffee,
  CheckCircle,
  XCircle,
  ChevronRight,
  BarChart3,
  Pencil,
  Trash2
} from 'lucide-react'
import type { TimeEntry, Employee } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const statusColors: Record<string, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

// Common project labels
const PROJECT_SUGGESTIONS = [
  'General Work',
  'Client Meeting',
  'Internal Meeting',
  'Development',
  'Design',
  'Research',
  'Admin Tasks',
  'Training',
  'Support',
  'Other',
]

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<(TimeEntry & { employee?: Employee })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentProject, setCurrentProject] = useState('General Work')
  const [customProject, setCustomProject] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    clock_in: '09:00',
    clock_out: '17:00',
    project: 'General Work',
    notes: '',
    break_minutes: 0,
  })
  const [userRole, setUserRole] = useState<string>('user')
  const [recentProjects, setRecentProjects] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch entries and check for active timer
  const fetchEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role) {
      setUserRole(profile.role)
    }

    // Fetch entries - admins see all, users see their own
    let query = supabase
      .from('time_entries')
      .select('*, employee:employees(first_name, last_name)')
      .order('date', { ascending: false })
      .order('clock_in', { ascending: false })
      .limit(100)

    if (!['admin', 'owner', 'manager'].includes(profile?.role || '')) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (!error && data) {
      setEntries(data)
      
      // Find active entry (clocked in but not out, today)
      const today = new Date().toISOString().split('T')[0]
      const active = data.find(e => 
        e.date === today && 
        e.clock_in && 
        !e.clock_out && 
        e.user_id === user.id
      )
      setActiveEntry(active || null)

      // Get recent unique projects for quick selection
      const projects = Array.from(new Set(data.map(e => e.project).filter(Boolean)))
      setRecentProjects(projects.slice(0, 5) as string[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Timer effect
  useEffect(() => {
    if (!activeEntry?.clock_in) return

    const calculateElapsed = () => {
      const [hours, minutes] = activeEntry.clock_in!.split(':').map(Number)
      const clockInTime = new Date()
      clockInTime.setHours(hours, minutes, 0, 0)
      const now = new Date()
      return Math.floor((now.getTime() - clockInTime.getTime()) / 1000)
    }

    setElapsedTime(calculateElapsed())
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsed())
    }, 1000)

    return () => clearInterval(interval)
  }, [activeEntry])

  // Format elapsed time as HH:MM:SS
  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Clock in
  const handleClockIn = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const timeStr = now.toTimeString().slice(0, 5)
    const dateStr = now.toISOString().split('T')[0]
    const project = customProject || currentProject

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        date: dateStr,
        clock_in: timeStr,
        project: project,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Clocked in', description: `Started tracking: ${project}` })
      setActiveEntry(data)
      setCustomProject('')
      fetchEntries()
    }
  }

  // Clock out
  const handleClockOut = async () => {
    if (!activeEntry) return

    const now = new Date()
    const timeStr = now.toTimeString().slice(0, 5)
    
    // Calculate total hours
    const [inH, inM] = activeEntry.clock_in!.split(':').map(Number)
    const [outH, outM] = timeStr.split(':').map(Number)
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - (activeEntry.break_minutes || 0)
    const totalHours = Math.max(0, totalMinutes / 60)

    const { error } = await supabase
      .from('time_entries')
      .update({
        clock_out: timeStr,
        total_hours: Math.round(totalHours * 100) / 100,
      })
      .eq('id', activeEntry.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Clocked out', description: `Tracked ${totalHours.toFixed(1)} hours` })
      setActiveEntry(null)
      setElapsedTime(0)
      fetchEntries()
    }
  }

  // Add manual entry
  const handleManualEntry = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Calculate total hours
    const [inH, inM] = manualEntry.clock_in.split(':').map(Number)
    const [outH, outM] = manualEntry.clock_out.split(':').map(Number)
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - manualEntry.break_minutes
    const totalHours = Math.max(0, totalMinutes / 60)

    const { error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        date: manualEntry.date,
        clock_in: manualEntry.clock_in,
        clock_out: manualEntry.clock_out,
        project: manualEntry.project,
        notes: manualEntry.notes || null,
        break_minutes: manualEntry.break_minutes,
        total_hours: Math.round(totalHours * 100) / 100,
        status: 'pending',
      })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Entry added', description: `${totalHours.toFixed(1)} hours logged` })
      setShowManualEntry(false)
      setManualEntry({
        date: new Date().toISOString().split('T')[0],
        clock_in: '09:00',
        clock_out: '17:00',
        project: 'General Work',
        notes: '',
        break_minutes: 0,
      })
      fetchEntries()
    }
  }

  // Admin: approve/reject
  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('time_entries')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: `Entry ${status}` })
      fetchEntries()
    }
  }

  // Delete entry
  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Entry deleted' })
      fetchEntries()
    }
  }

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    
    const weekEntries = entries.filter(e => {
      const entryDate = new Date(e.date)
      return entryDate >= startOfWeek && e.total_hours
    })

    const totalHours = weekEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
    const daysWorked = new Set(weekEntries.map(e => e.date)).size

    return { totalHours, daysWorked, entries: weekEntries.length }
  }

  // Get today's entries
  const getTodayEntries = () => {
    const today = new Date().toISOString().split('T')[0]
    return entries.filter(e => e.date === today)
  }

  const weeklyStats = getWeeklyStats()
  const todayEntries = getTodayEntries()
  const todayHours = todayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
  const isAdmin = ['admin', 'owner', 'manager'].includes(userRole)
  const pendingApprovals = isAdmin ? entries.filter(e => e.status === 'pending') : []

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-500 mt-1">Track your work hours</p>
        </div>
        <Button onClick={() => setShowManualEntry(true)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Manual Entry
        </Button>
      </div>

      {/* Timer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Timer Card */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {activeEntry ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-600 font-medium">Timer Running</span>
                    </div>
                    <div className="text-5xl font-mono font-bold text-gray-900 mb-2">
                      {formatElapsed(elapsedTime)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Badge variant="outline">{activeEntry.project || 'No project'}</Badge>
                      <span className="text-sm">Started at {activeEntry.clock_in}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 mb-2">Ready to start?</div>
                    <div className="text-5xl font-mono font-bold text-gray-300 mb-4">
                      00:00:00
                    </div>
                    {/* Project Selection */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(recentProjects.length > 0 ? recentProjects : PROJECT_SUGGESTIONS.slice(0, 5)).map(proj => (
                        <button
                          key={proj}
                          onClick={() => { setCurrentProject(proj); setCustomProject(''); }}
                          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                            currentProject === proj && !customProject
                              ? 'bg-blue-100 text-blue-700 border-blue-300 border'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {proj}
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Or type a custom project/task..."
                      value={customProject}
                      onChange={(e) => setCustomProject(e.target.value)}
                      className="max-w-xs"
                    />
                  </>
                )}
              </div>
              
              {/* Clock In/Out Button */}
              <div className="ml-6">
                {activeEntry ? (
                  <button
                    onClick={handleClockOut}
                    className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex flex-col items-center justify-center transition-all hover:scale-105 shadow-lg"
                  >
                    <Square className="h-8 w-8 mb-1" />
                    <span className="text-xs font-medium">STOP</span>
                  </button>
                ) : (
                  <button
                    onClick={handleClockIn}
                    className="w-24 h-24 rounded-full bg-green-500 hover:bg-green-600 text-white flex flex-col items-center justify-center transition-all hover:scale-105 shadow-lg"
                  >
                    <Play className="h-8 w-8 mb-1 ml-1" />
                    <span className="text-xs font-medium">START</span>
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {todayHours.toFixed(1)} <span className="text-lg font-normal text-gray-500">hrs</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {todayEntries.length} {todayEntries.length === 1 ? 'entry' : 'entries'}
            </p>
            {todayEntries.length > 0 && (
              <div className="space-y-2">
                {todayEntries.slice(0, 3).map(entry => (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate max-w-[120px]">{entry.project || 'No project'}</span>
                    <span className="font-medium">{entry.total_hours?.toFixed(1) || '...'} hrs</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Timer className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold">{weeklyStats.totalHours.toFixed(1)} hrs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Days Worked</p>
              <p className="text-2xl font-bold">{weeklyStats.daysWorked}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Hours/Day</p>
              <p className="text-2xl font-bold">
                {weeklyStats.daysWorked > 0 
                  ? (weeklyStats.totalHours / weeklyStats.daysWorked).toFixed(1) 
                  : '0'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals (Admin Only) */}
      {isAdmin && pendingApprovals.length > 0 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium">
                      {entry.employee 
                        ? `${entry.employee.first_name} ${entry.employee.last_name}` 
                        : 'User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(entry.date)} • {entry.clock_in} - {entry.clock_out || '...'} • {entry.project || 'No project'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium mr-2">{entry.total_hours?.toFixed(1) || '-'} hrs</span>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, 'approved')}>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(entry.id, 'rejected')}>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No time entries yet.</p>
              <p className="text-sm text-gray-400">Click START to begin tracking your time.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 15).map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500 w-24">{formatDate(entry.date)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.project || 'No project'}</span>
                        <Badge variant={statusColors[entry.status]} className="text-xs">
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.clock_in || '-'} - {entry.clock_out || '...'} 
                        {entry.notes && <span className="ml-2 text-gray-400">• {entry.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">
                      {entry.total_hours?.toFixed(1) || '-'} hrs
                    </span>
                    {entry.status === 'pending' && !entry.clock_out && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Manual Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={manualEntry.date}
                onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clock In</Label>
                <Input
                  type="time"
                  value={manualEntry.clock_in}
                  onChange={(e) => setManualEntry({ ...manualEntry, clock_in: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Clock Out</Label>
                <Input
                  type="time"
                  value={manualEntry.clock_out}
                  onChange={(e) => setManualEntry({ ...manualEntry, clock_out: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Break (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={manualEntry.break_minutes}
                onChange={(e) => setManualEntry({ ...manualEntry, break_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Project / Task</Label>
              <Select
                value={manualEntry.project}
                onValueChange={(v) => setManualEntry({ ...manualEntry, project: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_SUGGESTIONS.map(proj => (
                    <SelectItem key={proj} value={proj}>{proj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="What did you work on?"
                value={manualEntry.notes}
                onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualEntry(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualEntry}>
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
