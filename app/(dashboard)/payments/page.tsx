'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CreditCard, Eye, FileText } from 'lucide-react'
import type { Payment } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'

type PaymentWithInvoice = Payment & {
  invoice?: {
    id: string
    invoice_number: string
    status: string
    issue_date: string
    due_date: string | null
    subtotal: number
    tax_amount: number
    discount: number
    total: number
    notes: string | null
    client?: { company_name: string; email: string } | null
    contact?: { name: string; email: string } | null
  } | null
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithInvoice | null>(null)
  const supabase = createClient()

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          id,
          invoice_number,
          status,
          issue_date,
          due_date,
          subtotal,
          tax_amount,
          discount,
          total,
          notes,
          client:clients(company_name, email),
          contact:contacts(name, email)
        )
      `)
      .order('payment_date', { ascending: false })

    setPayments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  const getBillToName = (payment: PaymentWithInvoice) => {
    if (payment.invoice?.client?.company_name) return payment.invoice.client.company_name
    if (payment.invoice?.contact?.name) return payment.invoice.contact.name
    return 'N/A'
  }

  const getBillToEmail = (payment: PaymentWithInvoice) => {
    if (payment.invoice?.client?.email) return payment.invoice.client.email
    if (payment.invoice?.contact?.email) return payment.invoice.contact.email
    return ''
  }

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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{formatDate(payment.payment_date)}</td>
                  <td className="px-6 py-4 font-medium">{payment.invoice?.invoice_number || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{getBillToName(payment)}</td>
                  <td className="px-6 py-4">
                    {payment.payment_method ? (
                      <Badge variant="outline">{payment.payment_method}</Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">Not specified</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(Number(payment.amount))}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Payment Received</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(Number(selectedPayment.amount))}</p>
                  </div>
                  <CreditCard className="h-10 w-10 text-green-300" />
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Payment Date</p>
                  <p className="font-medium">{formatDate(selectedPayment.payment_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-medium">{selectedPayment.payment_method || 'Not specified'}</p>
                </div>
                {selectedPayment.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Notes</p>
                    <p className="font-medium">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              {/* Invoice Info */}
              {selectedPayment.invoice && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Invoice Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Invoice Number</p>
                      <p className="font-medium">{selectedPayment.invoice.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge variant="success">{selectedPayment.invoice.status}</Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Client</p>
                      <p className="font-medium">{getBillToName(selectedPayment)}</p>
                      {getBillToEmail(selectedPayment) && (
                        <p className="text-xs text-gray-400">{getBillToEmail(selectedPayment)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">Issue Date</p>
                      <p className="font-medium">{formatDate(selectedPayment.invoice.issue_date)}</p>
                    </div>
                    {selectedPayment.invoice.due_date && (
                      <div>
                        <p className="text-gray-500">Due Date</p>
                        <p className="font-medium">{formatDate(selectedPayment.invoice.due_date)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Invoice Total</p>
                      <p className="font-medium">{formatCurrency(Number(selectedPayment.invoice.total))}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">To edit payment details, go to Invoices section.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPayment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
