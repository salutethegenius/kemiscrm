'use client'

import { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Employee, PayrollLine, PayrollRun } from '@/lib/types'
import { bankersRound } from '@/lib/payroll'
import { formatDate } from '@/lib/utils'
import { Download, Printer, X } from 'lucide-react'

interface PayslipPreviewProps {
  open: boolean
  onClose: () => void
  employee: Employee
  line: PayrollLine
  run: PayrollRun
}

export function PayslipPreview({ open, onClose, employee, line, run }: PayslipPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip ${employee.first_name} ${employee.last_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #111827; }
            .payslip { max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
            .header { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
            .section { margin-top: 20px; }
            .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
            .label { color: #4b5563; }
            .value { font-weight: 500; }
            .table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
            .table td { padding: 6px 0; }
            .right { text-align: right; }
            .total { font-weight: 600; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 200)
  }

  const handleDownloadPDF = () => {
    handlePrint()
  }

  const gross = bankersRound(line.gross).toFixed(2)
  const employeeNib = bankersRound(line.employee_nib).toFixed(2)
  const employerNib = bankersRound(line.employer_nib).toFixed(2)
  const otherDeductions = bankersRound(line.other_deductions).toFixed(2)
  const net = bankersRound(line.net_pay).toFixed(2)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle>Payslip Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-1" />
                Save as PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 bg-gray-50">
          <div ref={printRef} className="bg-white rounded-lg shadow-sm p-6">
            <div className="header">KRM Payroll Payslip</div>

            <div className="section">
              <div className="row">
                <span className="label">Employee</span>
                <span className="value">
                  {employee.first_name} {employee.last_name}
                </span>
              </div>
              <div className="row">
                <span className="label">Period</span>
                <span className="value">
                  {formatDate(run.period_start)} – {formatDate(run.period_end)}
                </span>
              </div>
              <div className="row">
                <span className="label">Pay Date</span>
                <span className="value">{formatDate(run.pay_date)}</span>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Summary</div>
              <table className="table">
                <tbody>
                  <tr>
                    <td>Gross Pay</td>
                    <td className="right">{gross}</td>
                  </tr>
                  <tr>
                    <td>NIB Employee</td>
                    <td className="right">- {employeeNib}</td>
                  </tr>
                  <tr>
                    <td>Other Deductions</td>
                    <td className="right">- {otherDeductions}</td>
                  </tr>
                  <tr className="total">
                    <td>Net Pay</td>
                    <td className="right">{net}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-title">Employer Contributions</div>
              <div className="row">
                <span className="label">NIB Employer</span>
                <span className="value">{employerNib}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

