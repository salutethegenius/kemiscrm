'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { LeadForm, FormField } from '@/lib/types'

interface FormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  form?: LeadForm | null
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Long Text' },
]

const defaultFields: FormField[] = [
  { id: '1', label: 'Name', type: 'text', required: true },
  { id: '2', label: 'Email', type: 'email', required: true },
  { id: '3', label: 'Phone', type: 'phone', required: false },
  { id: '4', label: 'Message', type: 'textarea', required: false },
]

export function FormDialog({ open, onClose, onSuccess, form }: FormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [fields, setFields] = useState<FormField[]>(defaultFields)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (form) {
      setName(form.name)
      setFields((form.fields as FormField[]) || defaultFields)
    } else {
      setName('')
      setFields(defaultFields)
    }
  }, [form, open])

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      label: '',
      type: 'text',
      required: false,
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
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

    // Validate fields
    const validFields = fields.filter((f) => f.label.trim())
    if (validFields.length === 0) {
      toast({ title: 'Error', description: 'Add at least one field with a label', variant: 'destructive' })
      setLoading(false)
      return
    }

    const payload = {
      name,
      fields: validFields,
      user_id: user.id,
    }

    let error
    if (form) {
      const result = await supabase.from('lead_forms').update(payload).eq('id', form.id)
      error = result.error
    } else {
      const result = await supabase.from('lead_forms').insert([payload])
      error = result.error
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({
      title: form ? 'Form updated' : 'Form created',
      description: form ? 'The form has been updated.' : 'Your lead capture form is ready to use.',
    })

    setLoading(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form ? 'Edit Form' : 'Create Lead Capture Form'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Form Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Contact Form, Newsletter Signup"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Form Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Field label"
                      className="flex-1"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(field.id, { type: v as FormField['type'] })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center space-x-1 text-sm whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      <span>Required</span>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(field.id)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : form ? 'Save Changes' : 'Create Form'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
