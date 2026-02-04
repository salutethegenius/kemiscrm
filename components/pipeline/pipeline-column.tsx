'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DealCard } from './deal-card'
import { Button } from '@/components/ui/button'
import type { Deal, PipelineStage } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'

interface PipelineColumnProps {
  stage: PipelineStage
  deals: Deal[]
  onEditDeal: (deal: Deal) => void
  canManageStages?: boolean
  onEditStage?: (stage: PipelineStage) => void
  onDeleteStage?: (stage: PipelineStage) => void
}

export function PipelineColumn({ stage, deals, onEditDeal, canManageStages, onEditStage, onDeleteStage }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0)

  return (
    <div
      className={`flex-shrink-0 w-80 bg-gray-50 rounded-lg flex flex-col ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-semibold text-gray-900">{stage.name}</h3>
            <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {deals.length}
            </span>
          </div>
          {canManageStages && (onEditStage || onDeleteStage) && (
            <div className="flex items-center gap-1">
              {onEditStage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  onClick={() => onEditStage(stage)}
                  aria-label="Edit stage"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDeleteStage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-red-600"
                  onClick={() => onDeleteStage(stage)}
                  aria-label="Delete stage"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{formatCurrency(totalValue)}</p>
      </div>

      {/* Deals List */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto"
        style={{ minHeight: '200px' }}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={() => onEditDeal(deal)} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No deals in this stage
          </div>
        )}
      </div>
    </div>
  )
}
