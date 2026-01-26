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
import type { ContactGroup, Contact } from '@/lib/types'

interface GroupDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  group?: ContactGroup | null
  contacts: Contact[]
}

const colorOptions = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export function GroupDialog({ open, onClose, onSuccess, group, contacts }: GroupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  })
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [groupContacts, setGroupContacts] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        color: group.color,
      })
      // Fetch existing group members
      fetchGroupMembers(group.id)
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
      })
      setSelectedContacts([])
      setGroupContacts([])
    }
  }, [group, open])

  const fetchGroupMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('contact_group_members')
      .select('contact_id')
      .eq('group_id', groupId)

    if (data) {
      const memberIds = data.map(m => m.contact_id)
      setSelectedContacts(memberIds)
      setGroupContacts(memberIds)
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

    let groupId = group?.id

    if (group) {
      // Update existing group
      const { error } = await supabase
        .from('contact_groups')
        .update(formData)
        .eq('id', group.id)

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        setLoading(false)
        return
      }
    } else {
      // Create new group
      const { data, error } = await supabase
        .from('contact_groups')
        .insert([{ ...formData, user_id: user.id }])
        .select()
        .single()

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        setLoading(false)
        return
      }

      groupId = data.id
    }

    // Update group members
    if (groupId) {
      // Find contacts to add and remove
      const toAdd = selectedContacts.filter(id => !groupContacts.includes(id))
      const toRemove = groupContacts.filter(id => !selectedContacts.includes(id))

      // Remove members
      if (toRemove.length > 0) {
        await supabase
          .from('contact_group_members')
          .delete()
          .eq('group_id', groupId)
          .in('contact_id', toRemove)
      }

      // Add members
      if (toAdd.length > 0) {
        await supabase
          .from('contact_group_members')
          .insert(toAdd.map(contactId => ({ contact_id: contactId, group_id: groupId })))
      }
    }

    toast({
      title: group ? 'Group updated' : 'Group created',
      description: group ? 'The group has been updated.' : 'New group has been created.',
    })

    setLoading(false)
    onSuccess()
  }

  const handleDelete = async () => {
    if (!group) return
    if (!confirm('Are you sure you want to delete this group?')) return

    setLoading(true)
    const { error } = await supabase.from('contact_groups').delete().eq('id', group.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Group deleted', description: 'The group has been removed.' })
    setLoading(false)
    onSuccess()
  }

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group ? 'Edit Group' : 'Create Group'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., VIP Clients, Hot Leads"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this group for?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Add Contacts to Group</Label>
                {contacts.length > 0 && (
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedContacts(contacts.map(c => c.id))}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedContacts([])}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">No contacts available</p>
                ) : (
                  contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="rounded mr-3"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500">{selectedContacts.length} of {contacts.length} contacts selected</p>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {group && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                Delete
              </Button>
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : group ? 'Save Changes' : 'Create Group'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
