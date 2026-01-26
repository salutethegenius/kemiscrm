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
import { useToast } from '@/components/ui/use-toast'
import { Plus } from 'lucide-react'
import { PipelineColumn } from '@/components/pipeline/pipeline-column'
import { DealCard } from '@/components/pipeline/deal-card'
import { DealDialog } from '@/components/pipeline/deal-dialog'
import type { Deal, PipelineStage, Contact } from '@/lib/types'

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
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
    // First check if user has pipeline stages, if not initialize them
    const { data: { user } } = await supabase.auth.getUser()
    
    let stagesRes = await supabase.from('pipeline_stages').select('*').order('position')
    
    // If no stages exist, initialize them for this user
    if (user && (!stagesRes.data || stagesRes.data.length === 0)) {
      await supabase.rpc('initialize_user_pipeline', { p_user_id: user.id })
      // Re-fetch stages after initialization
      stagesRes = await supabase.from('pipeline_stages').select('*').order('position')
    }

    const [dealsRes, contactsRes] = await Promise.all([
      supabase.from('deals').select('*, contact:contacts(*)').order('created_at'),
      supabase.from('contacts').select('*').order('name'),
    ])

    if (stagesRes.error) {
      toast({ title: 'Error', description: stagesRes.error.message, variant: 'destructive' })
    } else {
      setStages(stagesRes.data || [])
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

  const getDealsForStage = (stageId: string) => {
    return deals.filter((deal) => deal.stage_id === stageId)
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
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {stages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No pipeline stages found. Please run the database schema to set up your pipeline.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
            {stages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={getDealsForStage(stage.id)}
                onEditDeal={handleEditDeal}
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
        stages={stages}
        contacts={contacts}
      />
    </div>
  )
}
