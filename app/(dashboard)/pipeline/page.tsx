'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, LayoutList } from 'lucide-react'
import { PipelineColumn } from '@/components/pipeline/pipeline-column'
import { DealCard } from '@/components/pipeline/deal-card'
import { DealDialog } from '@/components/pipeline/deal-dialog'
import { StageDialog } from '@/components/pipeline/stage-dialog'
import type { Deal, Pipeline, PipelineStage, Contact } from '@/lib/types'

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [pipelineSaving, setPipelineSaving] = useState(false)
  const [canManageStages, setCanManageStages] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setCanManageStages(profile?.role === 'admin' || profile?.role === 'owner')
    }

    const [pipelinesRes, stagesRes, dealsRes, contactsRes] = await Promise.all([
      supabase.from('pipelines').select('*').order('position').order('name'),
      supabase.from('pipeline_stages').select('*').order('position'),
      supabase.from('deals').select('*, contact:contacts(*)').order('created_at'),
      supabase.from('contacts').select('*').order('name'),
    ])

    if (pipelinesRes.data && pipelinesRes.data.length > 0) {
      setPipelines(pipelinesRes.data as Pipeline[])
      setSelectedPipelineId((prev) => {
        if (prev && pipelinesRes.data?.some((p) => p.id === prev)) return prev
        return (pipelinesRes.data?.[0] as Pipeline)?.id ?? null
      })
    } else {
      setPipelines([])
      setSelectedPipelineId(null)
    }

    if (user && (!stagesRes.data || stagesRes.data.length === 0)) {
      await supabase.rpc('initialize_user_pipeline', { p_user_id: user.id })
      const retry = await supabase.from('pipeline_stages').select('*').order('position')
      if (!retry.error) setStages(retry.data || [])
    } else if (!stagesRes.error) {
      setStages(stagesRes.data || [])
    }

    if (stagesRes.error) {
      toast({ title: 'Error', description: stagesRes.error.message, variant: 'destructive' })
    }

    if (!dealsRes.error) setDeals(dealsRes.data || [])
    if (!contactsRes.error) setContacts(contactsRes.data || [])

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id)
    setActiveDeal(deal || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDeal(null)

    if (!over) return

    const dealId = active.id as string
    const newStageId = over.id as string

    const deal = deals.find((d) => d.id === dealId)
    if (!deal || deal.stage_id === newStageId) return

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: newStageId } : d))
    )

    // Update in database
    const { error } = await supabase
      .from('deals')
      .update({ stage_id: newStageId })
      .eq('id', dealId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      fetchData() // Revert on error
    }
  }

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingDeal(null)
  }

  const handleSuccess = () => {
    handleCloseDialog()
    fetchData()
  }

  const handleOpenStageDialog = (stage: PipelineStage | null) => {
    setEditingStage(stage)
    setStageDialogOpen(true)
  }

  const handleCloseStageDialog = () => {
    setStageDialogOpen(false)
    setEditingStage(null)
  }

  const handleStageSuccess = () => {
    handleCloseStageDialog()
    fetchData()
  }

  const handleDeleteStage = async (stage: PipelineStage) => {
    const stageDeals = deals.filter((d) => d.stage_id === stage.id)
    if (stageDeals.length > 0) {
      toast({
        title: 'Cannot delete',
        description: `Move or delete the ${stageDeals.length} deal(s) in this stage first.`,
        variant: 'destructive',
      })
      return
    }
    if (!confirm(`Delete stage "${stage.name}"?`)) return
    const { error } = await supabase.from('pipeline_stages').delete().eq('id', stage.id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Stage deleted' })
      fetchData()
    }
  }

  const filteredStages = selectedPipelineId
    ? stages.filter((s) => s.pipeline_id === selectedPipelineId)
    : stages.filter((s) => s.pipeline_id == null)

  const stageIds = new Set(filteredStages.map((s) => s.id))
  const filteredDeals = deals.filter((d) => stageIds.has(d.stage_id))

  const getDealsForStage = (stageId: string) => {
    return filteredDeals.filter((deal) => deal.stage_id === stageId)
  }

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast({ title: 'Error', description: 'Pipeline name is required', variant: 'destructive' })
      return
    }
    setPipelineSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setPipelineSaving(false)
      return
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    const orgId = profile?.organization_id ?? null
    const { data: inserted, error } = await supabase
      .from('pipelines')
      .insert({
        name: newPipelineName.trim(),
        position: pipelines.length,
        user_id: user.id,
        organization_id: orgId,
      })
      .select('id')
      .single()
    setPipelineSaving(false)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setNewPipelineName('')
    setPipelineDialogOpen(false)
    toast({ title: 'Pipeline created' })
    await fetchData()
    if (inserted?.id) setSelectedPipelineId(inserted.id)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading pipeline...</div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-500 mt-1">Track your deals through the sales process</p>
        </div>
        <div className="flex gap-2 items-center">
          {pipelines.length > 0 && (
            <Select value={selectedPipelineId ?? ''} onValueChange={(v) => setSelectedPipelineId(v || null)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canManageStages && (
            <>
              <Button variant="outline" onClick={() => setPipelineDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New pipeline
              </Button>
              {selectedPipelineId && (
                <Button variant="outline" onClick={() => handleOpenStageDialog(null)}>
                  <LayoutList className="h-4 w-4 mr-2" />
                  Add stage
                </Button>
              )}
            </>
          )}
          <Button onClick={() => setDialogOpen(true)} disabled={filteredStages.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {pipelines.length === 0 && canManageStages ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
          <p className="text-gray-600 mb-4">No pipelines yet. Create your first pipeline to get started.</p>
          <Button onClick={() => setPipelineDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create pipeline
          </Button>
        </div>
      ) : pipelines.length > 0 && !selectedPipelineId ? (
        <div className="text-center py-12 text-gray-500">Select a pipeline above.</div>
      ) : filteredStages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
          <p className="text-gray-600 mb-4">No stages in this pipeline yet.</p>
          {canManageStages && (
            <Button variant="outline" onClick={() => handleOpenStageDialog(null)}>
              <LayoutList className="h-4 w-4 mr-2" />
              Add first stage
            </Button>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
            {filteredStages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={getDealsForStage(stage.id)}
                onEditDeal={handleEditDeal}
                canManageStages={canManageStages}
                onEditStage={canManageStages ? handleOpenStageDialog : undefined}
                onDeleteStage={canManageStages ? handleDeleteStage : undefined}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <DealDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        deal={editingDeal}
        stages={filteredStages}
        contacts={contacts}
      />

      <StageDialog
        open={stageDialogOpen}
        onClose={handleCloseStageDialog}
        onSuccess={handleStageSuccess}
        stage={editingStage}
        nextPosition={filteredStages.length}
        pipelineId={selectedPipelineId}
      />

      <Dialog open={pipelineDialogOpen} onOpenChange={setPipelineDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline_name">Name</Label>
              <Input
                id="pipeline_name"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="e.g. Sales, Recruitment"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPipelineDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePipeline} disabled={pipelineSaving || !newPipelineName.trim()}>
                {pipelineSaving ? 'Creating...' : 'Create pipeline'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
