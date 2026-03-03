'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import type { Employee, NibRateVersion, PayrollLine, PayrollRun, TimeEntry } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { calculateGrossForEmployee, calculateNib, calculateNetPay } from '@/lib/payroll'
import { PayrollRunTable } from '@/components/hr/payroll-run-table'
import { BankExportDialog } from '@/components/hr/bank-export-dialog'
import { NibExportDialog } from '@/components/hr/nib-export-dialog'
import { PayslipPreview } from '@/components/hr/payslip-preview'

type RunWithRelations = PayrollRun & {
  lines?: (PayrollLine & { employee?: Employee })[]
}

export default function PayrollRunPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const supabase = createClient()
  const { toast } = useToast()

  const [run, setRun] = useState<RunWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [nibExportOpen, setNibExportOpen] = useState(false)
  const [payslipOpen, setPayslipOpen] = useState(false)
  const [selectedLine, setSelectedLine] = useState<(PayrollLine & { employee?: Employee }) | null>(null)

  const statusVariant: Record<string, 'secondary' | 'default' | 'success' | 'outline'> = {
    draft: 'secondary',
    pending_approval: 'outline',
    approved: 'success',
    posted: 'default',
  }

  const fetchRun = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*, lines:payroll_lines(*, employee:employees(*))')
      .eq('id', id)
      .single()

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    setRun(data as RunWithRelations)
    setLoading(false)
  }

  useEffect(() => {
    if (id) {
      fetchRun()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleGenerate = async () => {
    if (!run) return
    setGenerating(true)

    // Fetch active employees in period
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')

    if (empError) {
      toast({ title: 'Error', description: empError.message, variant: 'destructive' })
      setGenerating(false)
      return
    }

    // Fetch approved time entries in range
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('*')
      .gte('date', run.period_start)
      .lte('date', run.period_end)
      .eq('status', 'approved')

    const hoursByEmployee: Record<string, number> = {}
    ;(timeEntries as TimeEntry[] | null || []).forEach((entry) => {
      if (!entry.employee_id || !entry.total_hours) return
      hoursByEmployee[entry.employee_id] =
        (hoursByEmployee[entry.employee_id] || 0) + Number(entry.total_hours)
    })

    // Fetch current NIB rate (latest effective)
    const { data: rates } = await supabase
      .from('nib_rate_versions')
      .select('*')
      .lte('effective_from', run.period_end)
      .order('effective_from', { ascending: false })
      .limit(1)

    const rate = (rates && rates[0]) as NibRateVersion | undefined

    const linesPayload: Omit<PayrollLine, 'id' | 'created_at' | 'organization_id'>[] = []

    ;(employees as Employee[] | null || []).forEach((emp) => {
      // Employment window filter
      const startsBeforeEnd =
        !emp.employment_start_date || emp.employment_start_date <= run.period_end
      const endsAfterStart =
        !emp.employment_end_date || emp.employment_end_date >= run.period_start
      if (!startsBeforeEnd || !endsAfterStart) return

      const hours = hoursByEmployee[emp.id] ?? null
      const gross = calculateGrossForEmployee(emp, hours)

      const nibResult = emp.nib_exempt ? { employeeNib: 0, employerNib: 0 } : calculateNib(gross, rate || null)
      const otherDeductions = 0
      const net = calculateNetPay(gross, nibResult.employeeNib, otherDeductions)

      linesPayload.push({
        payroll_run_id: run.id,
        employee_id: emp.id,
        gross,
        employee_nib: nibResult.employeeNib,
        employer_nib: nibResult.employerNib,
        other_deductions: otherDeductions,
        net_pay: net,
        notes: null,
      } as any)
    })

    // Clear existing lines then insert new
    const { error: delError } = await supabase
      .from('payroll_lines')
      .delete()
      .eq('payroll_run_id', run.id)

    if (delError) {
      toast({ title: 'Error', description: delError.message, variant: 'destructive' })
      setGenerating(false)
      return
    }

    if (linesPayload.length > 0) {
      const { error: insError } = await supabase.from('payroll_lines').insert(linesPayload)
      if (insError) {
        toast({ title: 'Error', description: insError.message, variant: 'destructive' })
        setGenerating(false)
        return
      }
    }

    toast({ title: 'Payroll generated', description: `${linesPayload.length} lines created` })
    setGenerating(false)
    fetchRun()
  }

  const handleApprove = async () => {
    if (!run) return
    if (!run.lines || run.lines.length === 0) {
      toast({ title: 'Cannot approve', description: 'Generate payroll lines before approving.', variant: 'destructive' })
      return
    }

    const invalidNib = (run.lines as any as (PayrollLine & { employee?: Employee })[]).filter(
      (line) => !line.employee?.nib_number
    )
    const invalidBank = (run.lines as any as (PayrollLine & { employee?: Employee })[]).filter(
      (line) => !line.employee?.bank_account_number || line.employee.bank_account_number.trim().length < 4
    )
    const zeroNet = (run.lines as any as (PayrollLine & { employee?: Employee })[]).filter(
      (line) => line.net_pay <= 0
    )

    if (invalidNib.length || invalidBank.length || zeroNet.length) {
      const messages: string[] = []
      if (invalidNib.length) messages.push(`${invalidNib.length} employee(s) missing NIB number`)
      if (invalidBank.length) messages.push(`${invalidBank.length} employee(s) missing bank account`)
      if (zeroNet.length) messages.push(`${zeroNet.length} line(s) with zero or negative net pay`)
      toast({
        title: 'Fix issues before approval',
        description: messages.join('; '),
        variant: 'destructive',
      })
      return
    }

    setApproving(true)

    const { error } = await supabase
      .from('payroll_runs')
      .update({ status: 'approved' })
      .eq('id', run.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setApproving(false)
      return
    }

    toast({ title: 'Payroll approved' })
    setApproving(false)
    fetchRun()
  }

  if (loading || !run) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-gray-500">Loading payroll run...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <Button variant="outline" onClick={() => router.push('/hr/payroll')}>
        ← Back to Payroll
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">
                Payroll {formatDate(run.period_start)} – {formatDate(run.period_end)}
              </div>
              <div className="text-sm text-gray-500">
                Pay date {formatDate(run.pay_date)}
              </div>
              {run.status !== 'draft' && (
                <div className="text-xs text-gray-400 mt-1">
                  This payroll run is {run.status.replace('_', ' ')} and cannot be regenerated.
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[run.status]}>{run.status.replace('_', ' ')}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={generating || run.status !== 'draft'}
              >
                {generating ? 'Generating...' : 'Generate'}
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={approving || run.status !== 'draft'}
              >
                {approving ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExportOpen(true)}
                disabled={!run.lines || run.lines.length === 0}
              >
                Export Bank File
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNibExportOpen(true)}
                disabled={!run.lines || run.lines.length === 0}
              >
                Export NIB Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-gray-500">
            Click a row to preview a payslip for that employee. All employees must have NIB and bank
            details, and net pay &gt; 0 before approval.
          </div>
          <div
            onClick={(e) => {
              // delegate clicks from table rows
              const target = e.target as HTMLElement
              const row = target.closest<HTMLTableRowElement>('tr[data-line-id]')
              if (!row || !run.lines) return
              const id = row.getAttribute('data-line-id')
              const line = (run.lines as any as (PayrollLine & { employee?: Employee })[]).find(
                (l) => l.id === id
              )
              if (line && line.employee) {
                setSelectedLine(line)
                setPayslipOpen(true)
              }
            }}
          >
            <PayrollRunTable lines={(run.lines || []) as any} />
          </div>
        </CardContent>
      </Card>

      <BankExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        payrollRun={run}
        lines={(run.lines || []) as any}
      />

      <NibExportDialog
        open={nibExportOpen}
        onClose={() => setNibExportOpen(false)}
        payrollRun={run}
        lines={(run.lines || []) as any}
      />

      {selectedLine && selectedLine.employee && (
        <PayslipPreview
          open={payslipOpen}
          onClose={() => setPayslipOpen(false)}
          employee={selectedLine.employee}
          line={selectedLine}
          run={run}
        />
      )}
    </div>
  )
}

