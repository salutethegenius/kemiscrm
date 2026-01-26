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
import type { Contact, ContactTag, ContactGroup } from '@/lib/types'

interface ContactDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  contact?: Contact | null
  tags?: ContactTag[]
  groups?: ContactGroup[]
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
]

const sourceOptions = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social Media' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'import', label: 'Import' },
  { value: 'other', label: 'Other' },
]

export function ContactDialog({ open, onClose, onSuccess, contact, tags = [], groups = [] }: ContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'manual',
    status: 'new',
    notes: '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [existingGroups, setExistingGroups] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.company || '',
        source: contact.source || 'manual',
        status: contact.status,
        notes: contact.notes || '',
      })
      // Set existing tags and groups
      const tagIds = contact.tags?.map(t => t.id) || []
      const groupIds = contact.groups?.map(g => g.id) || []
      setSelectedTags(tagIds)
      setSelectedGroups(groupIds)
      setExistingTags(tagIds)
      setExistingGroups(groupIds)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'manual',
        status: 'new',
        notes: '',
      })
      setSelectedTags([])
      setSelectedGroups([])
      setExistingTags([])
      setExistingGroups([])
    }
  }, [contact, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      setLoading(false)
      return
    }

    const payload = {
      ...formData,
      user_id: user.id,
    }

    let contactId = contact?.id
    let error

    if (contact) {
      const result = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', contact.id)
      error = result.error
    } else {
      const result = await supabase
        .from('contacts')
        .insert([payload])
        .select()
        .single()
      error = result.error
      if (result.data) {
        contactId = result.data.id
      }
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    // Update tags and groups if tables exist
    if (contactId) {
      try {
        // Handle tags
        const tagsToAdd = selectedTags.filter(id => !existingTags.includes(id))
        const tagsToRemove = existingTags.filter(id => !selectedTags.includes(id))

        if (tagsToRemove.length > 0) {
          await supabase
            .from('contact_tag_assignments')
            .delete()
            .eq('contact_id', contactId)
            .in('tag_id', tagsToRemove)
        }

        if (tagsToAdd.length > 0) {
          await supabase
            .from('contact_tag_assignments')
            .insert(tagsToAdd.map(tagId => ({ contact_id: contactId, tag_id: tagId })))
        }

        // Handle groups
        const groupsToAdd = selectedGroups.filter(id => !existingGroups.includes(id))
        const groupsToRemove = existingGroups.filter(id => !selectedGroups.includes(id))

        if (groupsToRemove.length > 0) {
          await supabase
            .from('contact_group_members')
            .delete()
            .eq('contact_id', contactId)
            .in('group_id', groupsToRemove)
        }

        if (groupsToAdd.length > 0) {
          await supabase
            .from('contact_group_members')
            .insert(groupsToAdd.map(groupId => ({ contact_id: contactId, group_id: groupId })))
        }
      } catch (e) {
        // Tables might not exist yet, ignore
        // Tags/Groups tables not yet created - silent fail
      }
    }

    toast({
      title: contact ? 'Contact updated' : 'Contact created',
      description: contact ? 'The contact has been updated.' : 'New contact has been added.',
    })

    setLoading(false)
    onSuccess()
  }

  const handleDelete = async () => {
    if (!contact) return
    
    if (!confirm('Are you sure you want to delete this contact?')) return

    setLoading(true)
    const { error } = await supabase.from('contacts').delete().eq('id', contact.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Contact deleted', description: 'The contact has been removed.' })
    setLoading(false)
    onSuccess()
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-all ${
                        selectedTags.includes(tag.id)
                          ? 'ring-2 ring-offset-1 ring-current'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label>Groups</Label>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm border transition-colors ${
                        selectedGroups.includes(group.id)
                          ? 'border-2'
                          : 'border-gray-200 opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: selectedGroups.includes(group.id) ? group.color : undefined,
                        color: selectedGroups.includes(group.id) ? group.color : undefined,
                      }}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {contact && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                Delete
              </Button>
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : contact ? 'Save Changes' : 'Add Contact'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
