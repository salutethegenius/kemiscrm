import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { RecentContacts } from '@/components/dashboard/recent-contacts'
import { RecentDeals } from '@/components/dashboard/recent-deals'

export default async function DashboardPage() {
  const supabase = createClient()
  
  // Fetch stats
  const [
    { count: contactsCount },
    { data: deals },
    { count: activitiesCount },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('value'),
    supabase.from('activities').select('*', { count: 'exact', head: true }).eq('completed', false),
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
    },
    {
      title: 'Active Deals',
      value: dealsCount,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(totalDealsValue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Pending Tasks',
      value: activitiesCount || 0,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
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
        {stats.map((stat) => (
          <Card key={stat.title}>
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
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <CardTitle>Recent Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentDeals />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
