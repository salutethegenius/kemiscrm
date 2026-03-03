'use client'

import { Badge } from '@/components/ui/badge'
import type { PayrollLine, Employee } from '@/lib/types'
import { bankersRound } from '@/lib/payroll'

interface PayrollRunTableProps {
  lines: (PayrollLine & { employee?: Employee })[]
}

export function PayrollRunTable({ lines }: PayrollRunTableProps) {
  if (!lines.length) {
    return <div className="text-gray-500 text-sm">No payroll lines generated yet.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4">Employee</th>
            <th className="py-2 pr-4 text-right">Gross</th>
            <th className="py-2 pr-4 text-right">NIB (Employee)</th>
            <th className="py-2 pr-4 text-right">NIB (Employer)</th>
            <th className="py-2 pr-4 text-right">Other Deductions</th>
            <th className="py-2 pr-4 text-right">Net Pay</th>
            <th className="py-2 pr-4">Flags</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const employee = line.employee
            const missingBank =
              !employee?.bank_account_number || employee.bank_account_number.trim().length < 4
            const missingNib = !employee?.nib_number
            const zeroPay = bankersRound(line.net_pay) <= 0

            return (
              <tr key={line.id} data-line-id={line.id} className="border-b last:border-0 cursor-pointer hover:bg-gray-50">
                <td className="py-2 pr-4">
                  <div className="font-medium text-gray-900">
                    {employee
                      ? `${employee.first_name} ${employee.last_name}`
                      : 'Employee'}
                  </div>
                  {employee?.position && (
                    <div className="text-xs text-gray-500">{employee.position}</div>
                  )}
                </td>
                <td className="py-2 pr-4 text-right">
                  {bankersRound(line.gross).toFixed(2)}
                </td>
                <td className="py-2 pr-4 text-right">
                  {bankersRound(line.employee_nib).toFixed(2)}
                </td>
                <td className="py-2 pr-4 text-right">
                  {bankersRound(line.employer_nib).toFixed(2)}
                </td>
                <td className="py-2 pr-4 text-right">
                  {bankersRound(line.other_deductions).toFixed(2)}
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-gray-900">
                  {bankersRound(line.net_pay).toFixed(2)}
                </td>
                <td className="py-2 pr-4 space-x-1">
                  {missingBank && (
                    <Badge variant="destructive">Missing bank</Badge>
                  )}
                  {missingNib && (
                    <Badge variant="outline">Missing NIB</Badge>
                  )}
                  {zeroPay && (
                    <Badge variant="secondary">Zero pay</Badge>
                  )}
                  {!missingBank && !missingNib && !zeroPay && (
                    <Badge variant="success">OK</Badge>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

