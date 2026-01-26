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
import type { Deal, PipelineStage, Contact } from '@/lib/types'

interface DealDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  deal?: Deal | null
  stages: PipelineStage[]
  contacts: Contact[]
}

export function DealDialog({ open, onClose, onSuccess, deal, stages, contacts }: DealDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage_id: '',
    contact_id: '',
    expected_close_date: '',
    notes: '',
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title,
        value: deal.value?.toString() || '',
        stage_id: deal.stage_id || '',
        contact_id: deal.contact_id || '',
        expected_close_date: deal.expected_close_date || '',
        notes: deal.notes || '',
      })
    } else {
      setFormData({
        title: '',
        value: '',
        stage_id: stages[0]?.id || '',
        contact_id: '',
        expected_close_date: '',
        notes: '',
      })
    }
  }, [deal, open, stages])

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
      title: formData.title,
      value: parseFloat(formData.value) || 0,
      stage_id: formData.stage_id || null,
      contact_id: formData.contact_id === '__none__' ? null : (formData.contact_id || null),
      expected_close_date: formData.expected_close_date || null,
      notes: formData.notes || null,
      user_id: user.id,
    }

    let error
    if (deal) {
      const result = await supabase.from('deals').update(payload).eq('id', deal.id)
      error = result.error
    } else {
      const result = await supabase.from('deals').insert([payload])
      error = result.error
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({
      title: deal ? 'Deal updated' : 'Deal created',
      description: deal ? 'The deal has been updated.' : 'New deal has been added to the pipeline.',
    })

    setLoading(false)
    onSuccess()
  }

  const handleDelete = async () => {
    if (!deal) return
    if (!confirm('Are you sure you want to delete this deal?')) return

    setLoading(true)
    const { error } = await supabase.from('deals').delete().eq('id', deal.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Deal deleted', description: 'The deal has been removed.' })
    setLoading(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Deal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Website Redesign Project"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select value={formData.stage_id} onValueChange={(v) => setFormData({ ...formData, stage_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center">
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No contact</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                />
              </div>
            </div>

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
            {deal && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                Delete
              </Button>
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : deal ? 'Save Changes' : 'Add Deal'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
