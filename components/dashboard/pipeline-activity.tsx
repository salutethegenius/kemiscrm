'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Kanban, ArrowRight, Plus, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Deal, PipelineStage, Pipeline } from '@/lib/types'

type DealWithDetails = Deal & {
  stage: (PipelineStage & { pipeline?: Pipeline | null }) | null
  contact?: { name: string } | null
}

export function PipelineActivity() {
  const [deals, setDeals] = useState<DealWithDetails[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [dealsRes, pipelinesRes] = await Promise.all([
        supabase
          .from('deals')
          .select('*, stage:pipeline_stages(*, pipeline:pipelines(*)), contact:contacts(name)')
          .order('updated_at', { ascending: false, nullsFirst: false })
          .limit(6),
        supabase.from('pipelines').select('*').order('position'),
      ])

      setDeals(dealsRes.data || [])
      setPipelines(pipelinesRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const getPipelineName = (deal: DealWithDetails): string => {
    return deal.stage?.pipeline?.name || 'Unknown Pipeline'
  }

  const getTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateStr)
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading...</div>
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Kanban className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p>No pipeline activity yet.</p>
        <Link href="/pipeline" className="text-blue-600 hover:underline mt-2 inline-block">
          Go to Pipeline
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => (
        <Link
          key={deal.id}
          href="/pipeline"
          className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 truncate">{deal.title}</span>
                <span className="text-xs text-gray-400">{getTimeAgo(deal.updated_at || deal.created_at)}</span>
              </div>
              {deal.contact?.name && (
                <p className="text-xs text-gray-500 truncate">{deal.contact.name}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {getPipelineName(deal)}
                </Badge>
                {deal.stage && (
                  <>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <Badge
                      variant="outline"
                      className="text-xs px-1.5 py-0"
                      style={{ borderColor: deal.stage.color, color: deal.stage.color }}
                    >
                      {deal.stage.name}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-gray-900 text-sm">
                {formatCurrency(Number(deal.value))}
              </p>
            </div>
          </div>
        </Link>
      ))}
      
      {/* Pipeline summary */}
      {pipelines.length > 0 && (
        <div className="pt-2 border-t mt-3">
          <p className="text-xs text-gray-500 mb-2">Active Pipelines</p>
          <div className="flex flex-wrap gap-2">
            {pipelines.map((pipeline) => (
              <Link
                key={pipeline.id}
                href="/pipeline"
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
              >
                {pipeline.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
