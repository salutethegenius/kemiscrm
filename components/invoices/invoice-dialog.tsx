'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2 } from 'lucide-react'
import type { Invoice, Client, InvoiceItem } from '@/lib/types'

interface InvoiceDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  invoice?: Invoice | null
  clients: Client[]
}

type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export function InvoiceDialog({ open, onClose, onSuccess, invoice, clients }: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: 0,
    discount: 0,
    notes: '',
    terms: '',
    status: 'draft' as Invoice['status'],
  })
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, amount: 0 },
  ])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (invoice) {
      setFormData({
        client_id: invoice.client_id || '',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date || '',
        tax_rate: invoice.tax_rate,
        discount: invoice.discount,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        status: invoice.status,
      })
      // Load invoice items
      loadInvoiceItems(invoice.id)
    } else {
      setFormData({
        client_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        tax_rate: 0,
        discount: 0,
        notes: '',
        terms: 'Payment is due within 30 days.',
        status: 'draft',
      })
      setItems([{ id: '1', description: '', quantity: 1, unit_price: 0, amount: 0 }])
    }
  }, [invoice, open])

  const loadInvoiceItems = async (invoiceId: string) => {
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sort_order')

    if (data && data.length > 0) {
      setItems(data.map(item => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        amount: Number(item.amount),
      })))
    }
  }

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unit_price') {
          updated.amount = Number(updated.quantity) * Number(updated.unit_price)
        }
        return updated
      }
      return item
    }))
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (formData.tax_rate / 100)
  const total = subtotal + taxAmount - formData.discount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      setLoading(false)
      return
    }

    let invoiceId = invoice?.id
    let invoiceNumber = invoice?.invoice_number

    if (!invoice) {
      // Generate invoice number
      const { data: numData } = await supabase.rpc('generate_invoice_number', { p_user_id: user.id })
      invoiceNumber = numData || `INV-${Date.now()}`
    }

    const payload = {
      ...formData,
      client_id: formData.client_id || null,
      due_date: formData.due_date || null,
      invoice_number: invoiceNumber,
      subtotal,
      tax_amount: taxAmount,
      total,
      user_id: user.id,
    }

    let error
    if (invoice) {
      const result = await supabase.from('invoices').update(payload).eq('id', invoice.id)
      error = result.error
    } else {
      const result = await supabase.from('invoices').insert([payload]).select().single()
      error = result.error
      if (result.data) {
        invoiceId = result.data.id
      }
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    // Save invoice items
    if (invoiceId) {
      // Delete existing items
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

      // Insert new items
      const itemsPayload = items.filter(item => item.description).map((item, index) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        sort_order: index,
      }))

      if (itemsPayload.length > 0) {
        await supabase.from('invoice_items').insert(itemsPayload)
      }
    }

    toast({
      title: invoice ? 'Invoice updated' : 'Invoice created',
      description: `Invoice ${invoiceNumber} has been saved.`,
    })

    setLoading(false)
    onSuccess()
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm('Are you sure you want to delete this invoice?')) return

    setLoading(true)
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Invoice deleted' })
    setLoading(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? `Edit Invoice ${invoice.invoice_number}` : 'Create New Invoice'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Client & Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Description</th>
                      <th className="text-left px-3 py-2 font-medium w-20">Qty</th>
                      <th className="text-left px-3 py-2 font-medium w-28">Price</th>
                      <th className="text-left px-3 py-2 font-medium w-28">Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-2 py-2">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Item description"
                            className="h-8"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">
                          ${item.amount.toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tax (%)</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-20 h-8 text-right"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Discount</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="w-20 h-8 text-right"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Notes to client..."
                />
              </div>
              <div className="space-y-2">
                <Label>Terms</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows={3}
                  placeholder="Payment terms..."
                />
              </div>
            </div>

            {/* Status */}
            {invoice && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Invoice['status'] })}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            {invoice && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                Delete
              </Button>
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : invoice ? 'Save Changes' : 'Create Invoice'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
