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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PayrollLine, Employee, PayrollRun } from '@/lib/types'
import { bankersRound } from '@/lib/payroll'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

type LineWithEmployee = PayrollLine & { employee?: Employee }

interface BankExportDialogProps {
  open: boolean
  onClose: () => void
  payrollRun: PayrollRun
  lines: LineWithEmployee[]
}

export function BankExportDialog({ open, onClose, payrollRun, lines }: BankExportDialogProps) {
  const [template, setTemplate] = useState('bahamas_generic')
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const buildCsv = () => {
    // Default Bahamas template:
    // employee_name,bank_account,amount,currency,reference
    const header = ['employee_name', 'bank_account', 'amount', 'currency', 'reference']

    const periodLabel = new Date(payrollRun.period_end).toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
    })

    const rows = lines
      .filter((line) => bankersRound(line.net_pay) > 0)
      .map((line) => {
        const emp = line.employee
        const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Employee'
        const accountRaw = emp?.bank_account_number || ''
        const account = accountRaw.replace(/\s+/g, '')
        const amount = bankersRound(line.net_pay).toFixed(2)
        const reference = `Payroll ${periodLabel}`

        return [name, account, amount, 'BSD', reference]
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
    link.download = `payroll-${payrollRun.id}-bank-${template}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Attempt to log audit event
    try {
      await supabase.rpc('log_audit_event', {
        p_action: 'export',
        p_entity_type: 'payroll_export',
        p_entity_id: payrollRun.id,
        p_entity_name: `Payroll ${payrollRun.period_start} - ${payrollRun.period_end}`,
        p_changes: null,
        p_metadata: {
          template,
          line_count: lines.length,
        },
      })
    } catch {
      // best-effort; ignore errors
    }

    toast({ title: 'Bank file exported' })
    setExporting(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Export Bank File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Bank Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bahamas_generic">Generic Bahamas CSV</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Generates a CSV with employee name, bank account, net pay, BSD currency, and a period reference.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            {lines.length} line{lines.length !== 1 ? 's' : ''} will be included (net pay &gt; 0).
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

