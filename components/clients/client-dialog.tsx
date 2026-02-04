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
import { useToast } from '@/components/ui/use-toast'
import { Search, X, UserPlus } from 'lucide-react'
import type { Client, Contact, ClientContact } from '@/lib/types'

interface ClientDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  client?: Client | null
  contacts?: Contact[]
}

export function ClientDialog({ open, onClose, onSuccess, client, contacts = [] }: ClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    tax_id: '',
    poc_name: '',
    poc_email: '',
    poc_phone: '',
    notes: '',
  })
  const [contactSearch, setContactSearch] = useState('')
  const [linkedContacts, setLinkedContacts] = useState<{ contact_id: string; role: string; is_primary: boolean; contact?: Contact }[]>([])
  const [showContactSearch, setShowContactSearch] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || '',
        tax_id: client.tax_id || '',
        poc_name: client.poc_name || '',
        poc_email: client.poc_email || '',
        poc_phone: client.poc_phone || '',
        notes: client.notes || '',
      })
      // Load linked contacts
      loadLinkedContacts(client.id)
    } else {
      setFormData({
        company_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        tax_id: '',
        poc_name: '',
        poc_email: '',
        poc_phone: '',
        notes: '',
      })
      setLinkedContacts([])
    }
    setContactSearch('')
    setShowContactSearch(false)
  }, [client, open])

  const loadLinkedContacts = async (clientId: string) => {
    const { data } = await supabase
      .from('client_contacts')
      .select('contact_id, role, is_primary, contact:contacts(id, name, email, phone, company)')
      .eq('client_id', clientId)
    if (data) {
      setLinkedContacts(data.map((d: any) => ({
        contact_id: d.contact_id,
        role: d.role || '',
        is_primary: d.is_primary || false,
        contact: d.contact,
      })))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      setLoading(false)
      return
    }

    const payload = { ...formData, user_id: user.id }

    let error
    let clientId = client?.id
    if (client) {
      const result = await supabase.from('clients').update(payload).eq('id', client.id)
      error = result.error
    } else {
      const result = await supabase.from('clients').insert([payload]).select().single()
      error = result.error
      if (result.data) clientId = result.data.id
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    // Save linked contacts
    if (clientId) {
      // Delete existing links and re-insert
      await supabase.from('client_contacts').delete().eq('client_id', clientId)
      if (linkedContacts.length > 0) {
        const contactLinks = linkedContacts.map((lc) => ({
          client_id: clientId,
          contact_id: lc.contact_id,
          role: lc.role || null,
          is_primary: lc.is_primary,
        }))
        await supabase.from('client_contacts').insert(contactLinks)
      }
    }

    toast({ title: client ? 'Client updated' : 'Client created' })
    setLoading(false)
    onSuccess()
  }

  const handleDelete = async () => {
    if (!client || !confirm('Delete this client?')) return
    setLoading(true)
    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Client deleted' })
      onSuccess()
    }
    setLoading(false)
  }

  const addContact = (contact: Contact) => {
    if (linkedContacts.some((lc) => lc.contact_id === contact.id)) return
    setLinkedContacts([...linkedContacts, { contact_id: contact.id, role: '', is_primary: false, contact }])
    setContactSearch('')
    setShowContactSearch(false)
  }

  const removeContact = (contactId: string) => {
    setLinkedContacts(linkedContacts.filter((lc) => lc.contact_id !== contactId))
  }

  const updateContactRole = (contactId: string, role: string) => {
    setLinkedContacts(linkedContacts.map((lc) => 
      lc.contact_id === contactId ? { ...lc, role } : lc
    ))
  }

  const setPrimaryContact = (contactId: string) => {
    setLinkedContacts(linkedContacts.map((lc) => ({
      ...lc,
      is_primary: lc.contact_id === contactId,
    })))
  }

  const filteredContacts = contacts.filter((c) => {
    const search = contactSearch.toLowerCase()
    const alreadyLinked = linkedContacts.some((lc) => lc.contact_id === c.id)
    return !alreadyLinked && (
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.company?.toLowerCase().includes(search)
    )
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700 border-b pb-1">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax ID</Label>
                  <Input
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Point of Contact */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700 border-b pb-1">Point of Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={formData.poc_name}
                    onChange={(e) => setFormData({ ...formData, poc_name: e.target.value })}
                    placeholder="Primary contact person"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.poc_email}
                    onChange={(e) => setFormData({ ...formData, poc_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.poc_phone}
                    onChange={(e) => setFormData({ ...formData, poc_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Linked Contacts from CRM */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-1">
                <h3 className="font-medium text-sm text-gray-700">Linked Contacts</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContactSearch(!showContactSearch)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add from Contacts
                </Button>
              </div>

              {showContactSearch && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Search contacts by name, email, or company..."
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  {contactSearch && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {filteredContacts.length === 0 ? (
                        <p className="p-3 text-sm text-gray-500">No contacts found</p>
                      ) : (
                        filteredContacts.slice(0, 10).map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => addContact(contact)}
                            className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium text-sm">{contact.name}</p>
                              <p className="text-xs text-gray-500">{contact.email}</p>
                            </div>
                            {contact.company && (
                              <span className="text-xs text-gray-400">{contact.company}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {linkedContacts.length > 0 && (
                <div className="space-y-2">
                  {linkedContacts.map((lc) => (
                    <div key={lc.contact_id} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{lc.contact?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">{lc.contact?.email}</p>
                      </div>
                      <Input
                        value={lc.role}
                        onChange={(e) => updateContactRole(lc.contact_id, e.target.value)}
                        placeholder="Role"
                        className="w-28 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant={lc.is_primary ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrimaryContact(lc.contact_id)}
                        className="text-xs"
                      >
                        Primary
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(lc.contact_id)}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700 border-b pb-1">Notes</h3>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this client..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {client && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                Delete
              </Button>
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : client ? 'Save' : 'Add Client'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
