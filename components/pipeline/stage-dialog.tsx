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
import { useToast } from '@/components/ui/use-toast'
import type { PipelineStage } from '@/lib/types'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

interface StageDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  stage?: PipelineStage | null
  nextPosition: number
  /** When creating a new stage, assign it to this pipeline */
  pipelineId?: string | null
}

export function StageDialog({ open, onClose, onSuccess, stage, nextPosition, pipelineId }: StageDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (stage) {
      setFormData({ name: stage.name, color: stage.color || '#3B82F6' })
    } else {
      setFormData({ name: '', color: '#3B82F6' })
    }
  }, [stage, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Stage name is required', variant: 'destructive' })
      return
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const profileRes = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    const orgId = profileRes.data?.organization_id ?? null

    if (stage) {
      const { error } = await supabase
        .from('pipeline_stages')
        .update({ name: formData.name.trim(), color: formData.color })
        .eq('id', stage.id)
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        setLoading(false)
        return
      }
      toast({ title: 'Stage updated' })
      onSuccess()
    } else {
      const { error } = await supabase.from('pipeline_stages').insert({
        name: formData.name.trim(),
        position: nextPosition,
        color: formData.color,
        user_id: user.id,
        organization_id: orgId,
        ...(pipelineId ? { pipeline_id: pipelineId } : {}),
      })
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        setLoading(false)
        return
      }
      toast({ title: 'Stage created' })
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{stage ? 'Edit stage' : 'Add pipeline stage'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stage_name">Name</Label>
            <Input
              id="stage_name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Qualified"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                  onClick={() => setFormData((p) => ({ ...p, color: c }))}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              />
              <span className="text-sm text-gray-500">{formData.color}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : stage ? 'Update stage' : 'Create stage'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
