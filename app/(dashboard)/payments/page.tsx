'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard } from 'lucide-react'
import type { Payment } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPayments() {
      const { data } = await supabase
        .from('payments')
        .select('*, invoice:invoices(invoice_number)')
        .order('payment_date', { ascending: false })

      setPayments(data || [])
      setLoading(false)
    }
    fetchPayments()
  }, [])

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Track payment records</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Total Payments Received</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPayments)}</p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No payments recorded.</p>
            <p className="text-sm text-gray-400 mt-2">Payments will appear here when invoices are marked as paid.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{formatDate(payment.payment_date)}</td>
                  <td className="px-6 py-4 font-medium">{(payment as any).invoice?.invoice_number || '-'}</td>
                  <td className="px-6 py-4">
                    {payment.payment_method && (
                      <Badge variant="outline">{payment.payment_method}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(Number(payment.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
