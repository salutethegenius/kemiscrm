'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PayrollLine, Employee, PayrollRun } from '@/lib/types'
import { bankersRound } from '@/lib/payroll'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

type LineWithEmployee = PayrollLine & { employee?: Employee }

interface NibExportDialogProps {
  open: boolean
  onClose: () => void
  payrollRun: PayrollRun
  lines: LineWithEmployee[]
}

export function NibExportDialog({ open, onClose, payrollRun, lines }: NibExportDialogProps) {
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const buildCsv = () => {
    const header = [
      'employee_name',
      'nib_number',
      'employee_nib',
      'employer_nib',
      'total_contribution',
      'pay_period',
      'pay_date',
    ]

    const periodLabel = `${payrollRun.period_start} - ${payrollRun.period_end}`
    const payDate = payrollRun.pay_date

    const rows = lines.map((line) => {
      const emp = line.employee
      const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Employee'
      const nibNumber = emp?.nib_number || ''
      const employeeNib = bankersRound(line.employee_nib).toFixed(2)
      const employerNib = bankersRound(line.employer_nib).toFixed(2)
      const total = bankersRound(line.employee_nib + line.employer_nib).toFixed(2)

      return [name, nibNumber, employeeNib, employerNib, total, periodLabel, payDate]
    })

    const escapeValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csv = [
      header.join(','),
      ...rows.map((r) => r.map(escapeValue).join(',')),
    ].join('\n')

    return csv
  }

  const handleExport = async () => {
    if (!lines.length) {
      toast({ title: 'No lines to export', variant: 'destructive' })
      return
    }

    setExporting(true)

    const csv = buildCsv()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payroll-${payrollRun.id}-nib.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    try {
      await supabase.rpc('log_audit_event', {
        p_action: 'export',
        p_entity_type: 'nib_export',
        p_entity_id: payrollRun.id,
        p_entity_name: `Payroll ${payrollRun.period_start} - ${payrollRun.period_end}`,
        p_changes: null,
        p_metadata: {
          line_count: lines.length,
        },
      })
    } catch {
      // best-effort only
    }

    toast({ title: 'NIB report exported' })
    setExporting(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Export NIB Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Summary</Label>
            <p className="text-sm text-gray-500">
              This will export employee and employer NIB contributions for this payroll run as a CSV
              file, one row per employee plus totals you can sum externally.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Period {payrollRun.period_start} – {payrollRun.period_end} • Pay date {payrollRun.pay_date}
          </p>
          <p className="text-sm text-gray-500">
            {lines.length} line{lines.length !== 1 ? 's' : ''} will be included.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || lines.length === 0}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

