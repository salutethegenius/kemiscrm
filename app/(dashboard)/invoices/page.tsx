'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, FileText, Send, Eye, DollarSign, Download, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InvoiceDialog } from '@/components/invoices/invoice-dialog'
import { InvoicePreview } from '@/components/invoices/invoice-preview'
import type { Invoice, Client, Contact } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  draft: 'secondary',
  sent: 'default',
  viewed: 'default',
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'secondary',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [sortField, setSortField] = useState<'invoice_number' | 'client' | 'issue_date' | 'due_date' | 'total' | 'status'>('issue_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()
  const supabase = createClient()

  const fetchData = async () => {
    const [invoicesRes, clientsRes, contactsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, client:clients(*), contact:contacts(id, name, email, company)')
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('company_name'),
      supabase.from('contacts').select('id, name, email, company').order('name'),
    ])

    if (!invoicesRes.error) setInvoices(invoicesRes.data || [])
    if (!clientsRes.error) setClients(clientsRes.data || [])
    if (!contactsRes.error) setContacts(contactsRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getBillToName = (invoice: Invoice) => {
    if (invoice.client?.company_name) return invoice.client.company_name
    if (invoice.contact?.name) return invoice.contact.name
    return 'No client'
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />
  }

  const filteredInvoices = invoices
    .filter(invoice =>
      invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      invoice.client?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.contact?.name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortField) {
        case 'invoice_number':
          aVal = a.invoice_number.toLowerCase()
          bVal = b.invoice_number.toLowerCase()
          break
        case 'client':
          aVal = getBillToName(a).toLowerCase()
          bVal = getBillToName(b).toLowerCase()
          break
        case 'issue_date':
          aVal = a.issue_date || ''
          bVal = b.issue_date || ''
          break
        case 'due_date':
          aVal = a.due_date || ''
          bVal = b.due_date || ''
          break
        case 'total':
          aVal = Number(a.total)
          bVal = Number(b.total)
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const stats = {
    total: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total), 0),
    pending: invoices.filter(inv => ['sent', 'viewed'].includes(inv.status)).reduce((sum, inv) => sum + Number(inv.total), 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total), 0),
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingInvoice(null)
  }

  const handleSuccess = () => {
    handleClose()
    fetchData()
  }

  const handleStatusChange = async (invoice: Invoice, newStatus: Invoice['status']) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoice.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    // If marking as paid, create a payment record
    if (newStatus === 'paid' && invoice.status !== 'paid') {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('invoice_id', invoice.id)
        .single()

      if (!existingPayment) {
        await supabase.from('payments').insert({
          invoice_id: invoice.id,
          amount: invoice.total,
          payment_method: 'Not specified',
          payment_date: new Date().toISOString().split('T')[0],
          user_id: user.id,
        })
        toast({ title: 'Status updated', description: `Invoice marked as ${newStatus}. Payment recorded.` })
      } else {
        toast({ title: 'Status updated', description: `Invoice marked as ${newStatus}.` })
      }
    } else {
      toast({ title: 'Status updated', description: `Invoice marked as ${newStatus}.` })
    }

    fetchData()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Create and manage invoices</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Invoiced</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading invoices...</div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {search ? 'No invoices match your search.' : 'No invoices yet. Create your first invoice.'}
            </p>
            {!search && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  <button 
                    onClick={() => handleSort('invoice_number')} 
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Invoice
                    <SortIcon field="invoice_number" />
                  </button>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  <button 
                    onClick={() => handleSort('client')} 
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Client
                    <SortIcon field="client" />
                  </button>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  <button 
                    onClick={() => handleSort('issue_date')} 
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Date
                    <SortIcon field="issue_date" />
                  </button>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  <button 
                    onClick={() => handleSort('due_date')} 
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Due
                    <SortIcon field="due_date" />
                  </button>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  <button 
                    onClick={() => handleSort('total')} 
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Amount
                    <SortIcon field="total" />
                  </button>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  <button 
                    onClick={() => handleSort('status')} 
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Status
                    <SortIcon field="status" />
                  </button>
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium">{invoice.invoice_number}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {getBillToName(invoice)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatCurrency(Number(invoice.total))}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusColors[invoice.status]}>{invoice.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewInvoice(invoice)} title="Preview & Export">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(invoice)} title="Edit">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(invoice, 'draft')}
                            disabled={invoice.status === 'draft'}
                          >
                            Draft
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(invoice, 'sent')}
                            disabled={invoice.status === 'sent'}
                          >
                            Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(invoice, 'viewed')}
                            disabled={invoice.status === 'viewed'}
                          >
                            Viewed
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(invoice, 'paid')}
                            disabled={invoice.status === 'paid'}
                            className="text-green-600"
                          >
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(invoice, 'overdue')}
                            disabled={invoice.status === 'overdue'}
                            className="text-red-600"
                          >
                            Overdue
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(invoice, 'cancelled')}
                            disabled={invoice.status === 'cancelled'}
                          >
                            Cancelled
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        invoice={editingInvoice}
        clients={clients}
        contacts={contacts}
      />

      {previewInvoice && (
        <InvoicePreview
          open={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          invoice={previewInvoice}
        />
      )}
    </div>
  )
}
