'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckSquare, Calendar } from 'lucide-react'
import type { Activity } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export function RecentTasks() {
  const [tasks, setTasks] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('type', 'task')
      .eq('completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(5)

    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleToggleComplete = async (e: React.MouseEvent, task: Activity) => {
    e.preventDefault()
    e.stopPropagation()
    await supabase
      .from('activities')
      .update({ completed: true })
      .eq('id', task.id)
    fetchTasks()
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const isPriority = (dueDate: string | null) => {
    if (!dueDate) return false
    const due = new Date(dueDate)
    const today = new Date()
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 2 && diffDays >= 0
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading...</div>
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p>No pending tasks.</p>
        <Link href="/tasks" className="text-blue-600 hover:underline mt-2 inline-block">
          View all tasks
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div
            className="pt-0.5 cursor-pointer"
            onClick={(e) => handleToggleComplete(e, task)}
          >
            <Checkbox checked={task.completed} onCheckedChange={() => {}} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{task.title}</p>
            {task.description && (
              <p className="text-sm text-gray-500 truncate">{task.description}</p>
            )}
            {task.due_date && (
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span
                  className={
                    'text-xs ' +
                    (isOverdue(task.due_date)
                      ? 'text-red-600 font-medium'
                      : isPriority(task.due_date)
                      ? 'text-orange-600'
                      : 'text-gray-500')
                  }
                >
                  {formatDate(task.due_date)}
                </span>
                {isOverdue(task.due_date) && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    Overdue
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <Link
        href="/tasks"
        className="block text-center text-sm text-blue-600 hover:underline py-2"
      >
        View all tasks
      </Link>
    </div>
  )
}
