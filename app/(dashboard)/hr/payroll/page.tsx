'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, FileText, PlusCircle } from 'lucide-react'
import type { PayrollRun } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { PayrollRunDialog } from '@/components/hr/payroll-run-dialog'

const statusColors: Record<string, 'secondary' | 'default' | 'success' | 'outline'> = {
  draft: 'secondary',
  pending_approval: 'outline',
  approved: 'success',
  posted: 'default',
}

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()

  const fetchRuns = useCallback(async () => {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .order('pay_date', { ascending: false })
      .limit(20)

    if (!error && data) {
      setRuns(data as PayrollRun[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  const latestRun = runs[0]
  const upcomingPayDate = latestRun?.pay_date

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-500 mt-1">Run compliant Bahamian payroll with NIB and bank exports.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Payroll Run
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Next Pay Date</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {upcomingPayDate ? formatDate(upcomingPayDate) : 'Not scheduled'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Recent Runs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{runs.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {latestRun ? latestRun.status.replace('_', ' ') : 'No runs yet'}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading payroll runs...</div>
          ) : runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No payroll runs yet.</div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/hr/payroll/${run.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatDate(run.period_start)} – {formatDate(run.period_end)}
                        </span>
                        <Badge variant={statusColors[run.status]}>
                          {run.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Pay date {formatDate(run.pay_date)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Created {formatDate(run.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PayrollRunDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={fetchRuns}
      />
    </div>
  )
}

