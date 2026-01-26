'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Clock, Plus } from 'lucide-react'
import type { TimeEntry, Employee } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const statusColors: Record<string, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<(TimeEntry & { employee?: Employee })[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*, employee:employees(*)')
      .order('date', { ascending: false })
      .limit(50)

    if (!error) setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-500 mt-1">Track and approve employee hours</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No time entries recorded.</p>
            <p className="text-sm text-gray-400 mt-2">Time entries will appear here when employees log their hours.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {entry.employee ? `${entry.employee.first_name} ${entry.employee.last_name}` : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(entry.date)}</td>
                  <td className="px-6 py-4 text-gray-600">{entry.clock_in || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{entry.clock_out || '-'}</td>
                  <td className="px-6 py-4 font-medium">{entry.total_hours?.toFixed(1) || '-'} hrs</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusColors[entry.status]}>{entry.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {entry.status === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => updateStatus(entry.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
