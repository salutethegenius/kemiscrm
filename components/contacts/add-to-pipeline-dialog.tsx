'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
import type { Pipeline, PipelineStage, Contact } from '@/lib/types'

interface AddToPipelineDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** Contacts to add as deals to the selected pipeline stage */
  contacts: Contact[]
}

export function AddToPipelineDialog({
  open,
  onClose,
  onSuccess,
  contacts,
}: AddToPipelineDialogProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const stagesForPipeline = selectedPipelineId
    ? stages.filter((s) => s.pipeline_id === selectedPipelineId)
    : []

  useEffect(() => {
    if (!open) return
    const fetchPipelines = async () => {
      const { data } = await supabase
        .from('pipelines')
        .select('*')
        .order('position')
        .order('name')
      setPipelines((data as Pipeline[]) || [])
    }
    const fetchStages = async () => {
      const { data } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('position')
      setStages((data as PipelineStage[]) || [])
    }
    fetchPipelines()
    fetchStages()
  }, [open])

  useEffect(() => {
    if (!selectedPipelineId) {
      setSelectedStageId(null)
      return
    }
    const first = stages.find((s) => s.pipeline_id === selectedPipelineId)
    setSelectedStageId(first?.id ?? null)
  }, [selectedPipelineId, stages])

  const handleSubmit = async () => {
    if (!selectedStageId || contacts.length === 0) {
      toast({
        title: 'Error',
        description: 'Select a pipeline and stage, and ensure at least one contact is selected.',
        variant: 'destructive',
      })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    const orgId = profile?.organization_id ?? null

    setLoading(true)
    const inserts = contacts.map((c) => ({
      title: c.name,
      value: 0,
      stage_id: selectedStageId,
      contact_id: c.id,
      user_id: user.id,
      ...(orgId ? { organization_id: orgId } : {}),
    }))

    const { error } = await supabase.from('deals').insert(inserts)
    setLoading(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    toast({
      title: 'Added to pipeline',
      description: `${contacts.length} contact(s) added as deals.`,
    })
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add to pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            Add {contacts.length} selected contact(s) as deals to a pipeline stage.
          </p>
          <div className="space-y-2">
            <Label>Pipeline</Label>
            <Select
              value={selectedPipelineId ?? ''}
              onValueChange={(v) => setSelectedPipelineId(v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select
              value={selectedStageId ?? ''}
              onValueChange={(v) => setSelectedStageId(v || null)}
              disabled={!selectedPipelineId || stagesForPipeline.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose stage" />
              </SelectTrigger>
              <SelectContent>
                {stagesForPipeline.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedStageId || contacts.length === 0}
          >
            {loading ? 'Adding...' : `Add ${contacts.length} to pipeline`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
