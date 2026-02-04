'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
import { Download } from 'lucide-react'
import type { Contact, ContactGroup } from '@/lib/types'

interface ExportField {
  key: keyof Contact | 'tags' | 'groups'
  label: string
  defaultChecked: boolean
}

const EXPORT_FIELDS: ExportField[] = [
  { key: 'name', label: 'Name', defaultChecked: true },
  { key: 'email', label: 'Email', defaultChecked: true },
  { key: 'phone', label: 'Phone', defaultChecked: true },
  { key: 'company', label: 'Company', defaultChecked: true },
  { key: 'status', label: 'Status', defaultChecked: true },
  { key: 'source', label: 'Source', defaultChecked: false },
  { key: 'notes', label: 'Notes', defaultChecked: false },
  { key: 'tags', label: 'Tags', defaultChecked: false },
  { key: 'groups', label: 'Groups', defaultChecked: false },
  { key: 'created_at', label: 'Created Date', defaultChecked: false },
]

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  contacts: Contact[]
  groups: ContactGroup[]
  selectedContactIds: Set<string>
}

export function ExportDialog({
  open,
  onClose,
  contacts,
  groups,
  selectedContactIds,
}: ExportDialogProps) {
  const [exportSource, setExportSource] = useState<string>('all')
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(EXPORT_FIELDS.filter((f) => f.defaultChecked).map((f) => f.key))
  )

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAllFields = () => {
    setSelectedFields(new Set(EXPORT_FIELDS.map((f) => f.key)))
  }

  const deselectAllFields = () => {
    setSelectedFields(new Set())
  }

  const getContactsToExport = (): Contact[] => {
    if (exportSource === 'all') {
      return contacts
    }
    if (exportSource === 'selected') {
      return contacts.filter((c) => selectedContactIds.has(c.id))
    }
    // Export by group
    return contacts.filter((c) =>
      c.groups?.some((g) => g.id === exportSource)
    )
  }

  const formatValue = (contact: Contact, key: string): string => {
    if (key === 'tags') {
      return contact.tags?.map((t) => t.name).join(', ') || ''
    }
    if (key === 'groups') {
      return contact.groups?.map((g) => g.name).join(', ') || ''
    }
    if (key === 'created_at') {
      return contact.created_at ? new Date(contact.created_at).toLocaleDateString() : ''
    }
    const value = contact[key as keyof Contact]
    if (value === null || value === undefined) return ''
    return String(value)
  }

  const escapeCsvValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const handleExport = () => {
    const contactsToExport = getContactsToExport()
    if (contactsToExport.length === 0) {
      alert('No contacts to export')
      return
    }
    if (selectedFields.size === 0) {
      alert('Select at least one field to export')
      return
    }

    const fields = EXPORT_FIELDS.filter((f) => selectedFields.has(f.key))
    const headers = fields.map((f) => f.label)
    const rows = contactsToExport.map((contact) =>
      fields.map((f) => escapeCsvValue(formatValue(contact, f.key)))
    )

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    onClose()
  }

  const contactsToExportCount = getContactsToExport().length

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Export Source */}
          <div className="space-y-2">
            <Label>What to export</Label>
            <Select value={exportSource} onValueChange={setExportSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contacts ({contacts.length})</SelectItem>
                {selectedContactIds.size > 0 && (
                  <SelectItem value="selected">
                    Selected contacts ({selectedContactIds.size})
                  </SelectItem>
                )}
                {groups.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                      Groups
                    </div>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.member_count || 0})
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {contactsToExportCount} contact{contactsToExportCount !== 1 ? 's' : ''} will be exported
            </p>
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fields to include</Label>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={selectAllFields}>
                  Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAllFields}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-gray-50">
              {EXPORT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`field-${field.key}`}
                    checked={selectedFields.has(field.key)}
                    onCheckedChange={() => toggleField(field.key)}
                  />
                  <label
                    htmlFor={`field-${field.key}`}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={contactsToExportCount === 0 || selectedFields.size === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
