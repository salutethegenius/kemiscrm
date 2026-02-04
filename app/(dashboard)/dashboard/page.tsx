import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, CheckSquare } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { RecentContacts } from '@/components/dashboard/recent-contacts'
import { PipelineActivity } from '@/components/dashboard/pipeline-activity'
import { RecentTasks } from '@/components/dashboard/recent-tasks'

export default async function DashboardPage() {
  const supabase = createClient()
  
  // Fetch stats
  const [
    { count: contactsCount },
    { data: deals },
    { count: pendingTasksCount },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('value'),
    supabase.from('activities').select('*', { count: 'exact', head: true }).eq('type', 'task').eq('completed', false),
  ])

  const totalDealsValue = deals?.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0) || 0
  const dealsCount = deals?.length || 0

  const stats = [
    {
      title: 'Total Contacts',
      value: contactsCount || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: undefined as string | undefined,
    },
    {
      title: 'Active Deals',
      value: dealsCount,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: undefined as string | undefined,
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(totalDealsValue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: undefined as string | undefined,
    },
    {
      title: 'Pending Tasks',
      value: pendingTasksCount || 0,
      icon: CheckSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/tasks',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to Kemis CRM! Here&apos;s your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const content = (
            <Card key={stat.title} className={stat.href ? 'cursor-pointer hover:shadow-md transition-shadow' : undefined}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
          return stat.href ? <Link href={stat.href} key={stat.title}>{content}</Link> : content
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentContacts />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineActivity />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTasks />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
