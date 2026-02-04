'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Printer, X } from 'lucide-react'
import type { Invoice, InvoiceItem, Client, Contact } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'

interface InvoicePreviewProps {
  open: boolean
  onClose: () => void
  invoice: Invoice
}

type InvoiceSettings = {
  company_name?: string
  company_address?: string
  company_email?: string
  company_phone?: string
  logo_url?: string
  accent_color?: string
  footer_text?: string
}

export function InvoicePreview({ open, onClose, invoice }: InvoicePreviewProps) {
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [settings, setSettings] = useState<InvoiceSettings>({})
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (open && invoice) {
      loadData()
    }
  }, [open, invoice])

  const loadData = async () => {
    setLoading(true)
    
    // Load invoice items
    const { data: itemsData } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('sort_order')
    
    if (itemsData) setItems(itemsData)

    // Load organization settings
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      
      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name, settings')
          .eq('id', profile.organization_id)
          .single()
        
        if (org) {
          const orgSettings = (org.settings as Record<string, unknown>) || {}
          setSettings({
            company_name: org.name || '',
            company_address: orgSettings.invoice_address as string || '',
            company_email: orgSettings.invoice_email as string || '',
            company_phone: orgSettings.invoice_phone as string || '',
            logo_url: orgSettings.invoice_logo_url as string || '',
            accent_color: orgSettings.invoice_accent_color as string || '#2563eb',
            footer_text: orgSettings.invoice_footer_text as string || '',
          })
        }
      }
    }
    
    setLoading(false)
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: ${settings.accent_color || '#2563eb'}; }
            .logo img { max-height: 60px; max-width: 200px; }
            .invoice-info { text-align: right; }
            .invoice-number { font-size: 24px; font-weight: bold; color: ${settings.accent_color || '#2563eb'}; }
            .invoice-date { color: #6b7280; margin-top: 4px; }
            .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .party { width: 45%; }
            .party-label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
            .party-name { font-weight: 600; font-size: 16px; }
            .party-details { color: #6b7280; font-size: 14px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .text-right { text-align: right; }
            .totals { width: 300px; margin-left: auto; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 8px; }
            .notes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .notes-label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
            .notes-content { color: #4b5563; font-size: 14px; white-space: pre-wrap; }
            .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-draft { background: #f3f4f6; color: #4b5563; }
            .status-sent, .status-viewed { background: #dbeafe; color: #1e40af; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            @media print { body { padding: 20px; } }
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
    }, 250)
  }

  const handleDownloadPDF = () => {
    // For now, use print dialog which allows saving as PDF
    handlePrint()
  }

  const getBillToInfo = () => {
    if (invoice.client) {
      return {
        name: invoice.client.company_name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: [invoice.client.address, invoice.client.city, invoice.client.country].filter(Boolean).join(', '),
      }
    }
    if (invoice.contact) {
      return {
        name: invoice.contact.name,
        email: invoice.contact.email,
        phone: null,
        address: invoice.contact.company || '',
      }
    }
    return { name: 'N/A', email: '', phone: null, address: '' }
  }

  const billTo = getBillToInfo()

  const statusClass = {
    paid: 'status-paid',
    draft: 'status-draft',
    sent: 'status-sent',
    viewed: 'status-viewed',
    overdue: 'status-overdue',
    cancelled: 'status-draft',
  }[invoice.status] || 'status-draft'

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px]">
          <div className="py-12 text-center text-gray-500">Loading invoice...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Preview</DialogTitle>
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

        <div className="p-8 bg-gray-50">
          <div ref={printRef} className="bg-white p-8 rounded-lg shadow-sm" style={{ minHeight: '800px' }}>
            <div className="invoice">
              {/* Header */}
              <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div className="logo">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Company Logo" style={{ maxHeight: '60px', maxWidth: '200px' }} />
                  ) : (
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: settings.accent_color || '#2563eb' }}>
                      {settings.company_name || 'Your Company'}
                    </span>
                  )}
                  {settings.logo_url && settings.company_name && (
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{settings.company_name}</div>
                  )}
                </div>
                <div className="invoice-info" style={{ textAlign: 'right' }}>
                  <div className="invoice-number" style={{ fontSize: '24px', fontWeight: 'bold', color: settings.accent_color || '#2563eb' }}>
                    {invoice.invoice_number}
                  </div>
                  <div className="invoice-date" style={{ color: '#6b7280', marginTop: '4px' }}>
                    Issued: {formatDate(invoice.issue_date)}
                  </div>
                  {invoice.due_date && (
                    <div style={{ color: '#6b7280' }}>Due: {formatDate(invoice.due_date)}</div>
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <span className={`status ${statusClass}`} style={{ 
                      display: 'inline-block', 
                      padding: '4px 12px', 
                      borderRadius: '9999px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      textTransform: 'uppercase',
                      background: invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'overdue' ? '#fee2e2' : '#dbeafe',
                      color: invoice.status === 'paid' ? '#166534' : invoice.status === 'overdue' ? '#991b1b' : '#1e40af',
                    }}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="parties" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div className="party" style={{ width: '45%' }}>
                  <div className="party-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>From</div>
                  <div className="party-name" style={{ fontWeight: '600', fontSize: '16px' }}>{settings.company_name || 'Your Company'}</div>
                  <div className="party-details" style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                    {settings.company_address && <div>{settings.company_address}</div>}
                    {settings.company_email && <div>{settings.company_email}</div>}
                    {settings.company_phone && <div>{settings.company_phone}</div>}
                  </div>
                </div>
                <div className="party" style={{ width: '45%' }}>
                  <div className="party-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>Bill To</div>
                  <div className="party-name" style={{ fontWeight: '600', fontSize: '16px' }}>{billTo.name}</div>
                  <div className="party-details" style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                    {billTo.address && <div>{billTo.address}</div>}
                    {billTo.email && <div>{billTo.email}</div>}
                    {billTo.phone && <div>{billTo.phone}</div>}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#f9fafb', padding: '12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                    <th style={{ background: '#f9fafb', padding: '12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '80px' }}>Qty</th>
                    <th style={{ background: '#f9fafb', padding: '12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '100px' }}>Price</th>
                    <th style={{ background: '#f9fafb', padding: '12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '100px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{item.description}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{formatCurrency(Number(item.unit_price))}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{formatCurrency(Number(item.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="totals" style={{ width: '300px', marginLeft: 'auto' }}>
                <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                {Number(invoice.tax_rate) > 0 && (
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Tax ({invoice.tax_rate}%)</span>
                    <span>{formatCurrency(Number(invoice.tax_amount))}</span>
                  </div>
                )}
                {Number(invoice.discount) > 0 && (
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(invoice.discount))}</span>
                  </div>
                )}
                <div className="totals-row total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid #e5e7eb', paddingTop: '12px', marginTop: '8px' }}>
                  <span>Total</span>
                  <span style={{ color: settings.accent_color || '#2563eb' }}>{formatCurrency(Number(invoice.total))}</span>
                </div>
              </div>

              {/* Notes & Terms */}
              {(invoice.notes || invoice.terms) && (
                <div className="notes" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  {invoice.notes && (
                    <div style={{ marginBottom: '16px' }}>
                      <div className="notes-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>Notes</div>
                      <div className="notes-content" style={{ color: '#4b5563', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{invoice.notes}</div>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <div className="notes-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>Terms & Conditions</div>
                      <div className="notes-content" style={{ color: '#4b5563', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{invoice.terms}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              {settings.footer_text && (
                <div className="footer" style={{ marginTop: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                  {settings.footer_text}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
