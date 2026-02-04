'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Plus, CheckSquare, Calendar, User, Filter } from 'lucide-react'
import { TaskDialog } from '@/components/tasks/task-dialog'
import type { Activity, Contact, Deal, UserProfile } from '@/lib/types'
import { formatDate } from '@/lib/utils'

type TaskFilter = 'all' | 'mine' | 'created'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Activity[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [orgUsers, setOrgUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Activity | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)
    if (!user) {
      setLoading(false)
      return
    }

    const [tasksRes, contactsRes, dealsRes, usersRes] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('type', 'task')
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('contacts').select('id, name').order('name'),
      supabase.from('deals').select('id, title').order('created_at'),
      supabase.from('user_profiles').select('id, full_name').order('full_name'),
    ])

    if (!tasksRes.error) setTasks(tasksRes.data || [])
    if (!contactsRes.error) setContacts((contactsRes.data || []) as Contact[])
    if (!dealsRes.error) setDeals((dealsRes.data || []) as Deal[])
    if (!usersRes.error) setOrgUsers((usersRes.data || []) as UserProfile[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTasks = tasks.filter((task) => {
    if (showCompleted === false && task.completed) return false
    if (filter === 'mine' && currentUserId) return task.assigned_to === currentUserId
    if (filter === 'created' && currentUserId) return task.user_id === currentUserId
    return true
  })

  const handleToggleComplete = async (task: Activity) => {
    const { error } = await supabase
      .from('activities')
      .update({ completed: !task.completed })
      .eq('id', task.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)))
  }

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return 'Unassigned'
    const u = orgUsers.find((o) => o.id === userId)
    return u?.full_name || `User ${userId.slice(0, 8)}`
  }

  const getContactName = (contactId: string | null) => {
    if (!contactId) return null
    return contacts.find((c) => c.id === contactId)?.name ?? null
  }

  const getDealTitle = (dealId: string | null) => {
    if (!dealId) return null
    return deals.find((d) => d.id === dealId)?.title ?? null
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and assign tasks</p>
        </div>
        <Button onClick={() => { setEditingTask(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={filter} onValueChange={(v) => setFilter(v as TaskFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tasks</SelectItem>
              <SelectItem value="mine">Assigned to me</SelectItem>
              <SelectItem value="created">Created by me</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <Checkbox
            checked={showCompleted}
            onCheckedChange={(checked) => setShowCompleted(!!checked)}
          />
          Show completed
        </label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Task List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{showCompleted ? 'No tasks match the current filter.' : 'No pending tasks. Create one to get started.'}</p>
              {!showCompleted && (
                <Button className="mt-4" onClick={() => { setEditingTask(null); setDialogOpen(true) }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg ${task.completed ? 'bg-gray-50 opacity-75' : ''}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleComplete(task)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(task.due_date)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {getAssigneeName(task.assigned_to)}
                        </span>
                        {getContactName(task.contact_id) && (
                          <Link href="/contacts" className="text-blue-600 hover:underline">
                            {getContactName(task.contact_id)}
                          </Link>
                        )}
                        {getDealTitle(task.deal_id) && (
                          <Link href="/pipeline" className="text-blue-600 hover:underline">
                            {getDealTitle(task.deal_id)}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.completed && (
                      <Badge variant="secondary">Done</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingTask(task); setDialogOpen(true) }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTask(null) }}
        onSuccess={() => { setDialogOpen(false); setEditingTask(null); fetchData() }}
        task={editingTask}
        contacts={contacts}
        deals={deals}
        orgUsers={orgUsers}
      />
    </div>
  )
}
