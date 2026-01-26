'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Deal, Contact } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, DollarSign } from 'lucide-react'

interface DealCardProps {
  deal: Deal & { contact?: Contact | null }
  isDragging?: boolean
  onClick?: () => void
}

export function DealCard({ deal, isDragging, onClick }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <h4 className="font-medium text-gray-900 mb-2 truncate">{deal.title}</h4>
        
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <DollarSign className="h-4 w-4 mr-1" />
          <span className="font-semibold text-gray-900">{formatCurrency(Number(deal.value))}</span>
        </div>

        {deal.expected_close_date && (
          <div className="flex items-center text-xs text-gray-400 mb-3">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Close: {formatDate(deal.expected_close_date)}</span>
          </div>
        )}

        {deal.contact && (
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {deal.contact.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500 truncate">{deal.contact.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
