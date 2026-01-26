'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Deal, PipelineStage } from '@/lib/types'

export function RecentDeals() {
  const [deals, setDeals] = useState<(Deal & { stage: PipelineStage | null })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchDeals() {
      const { data } = await supabase
        .from('deals')
        .select('*, stage:pipeline_stages(*)')
        .order('created_at', { ascending: false })
        .limit(5)

      setDeals(data || [])
      setLoading(false)
    }
    fetchDeals()
  }, [])

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading...</div>
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No deals yet.</p>
        <Link href="/pipeline" className="text-blue-600 hover:underline mt-2 inline-block">
          Create your first deal
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deals.map((deal) => (
        <Link
          key={deal.id}
          href="/pipeline"
          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{deal.title}</p>
            <p className="text-sm text-gray-500">{formatDate(deal.created_at)}</p>
          </div>
          <div className="text-right ml-4">
            <p className="font-semibold text-gray-900">{formatCurrency(Number(deal.value))}</p>
            {deal.stage && (
              <Badge 
                variant="outline" 
                style={{ borderColor: deal.stage.color, color: deal.stage.color }}
              >
                {deal.stage.name}
              </Badge>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
