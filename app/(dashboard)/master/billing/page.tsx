'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, AlertCircle, Building2, DollarSign, Users, HardDrive } from 'lucide-react'
import type { Organization } from '@/lib/types'

export default function MasterBillingPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [parentOrg, setParentOrg] = useState<Organization | null>(null)
  const [subAccounts, setSubAccounts] = useState<Organization[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, is_master')
      .eq('id', profile.organization_id)
      .single()

    if (!org || !org.is_master) {
      setLoading(false)
      return
    }

    setParentOrg(org as Organization)

    const { data: subs } = await supabase
      .from('organizations')
      .select('id, name, slug, billing_status, billing_plan, max_users, max_storage_mb, enabled_features, branding, created_at, is_master, parent_org_id')
      // Same logic as accounts page: any non-master org is treated as a sub-account,
      // along with any orgs explicitly linked via parent_org_id.
      .or(`parent_org_id.eq.${org.id},is_master.eq.false`)
      .order('created_at', { ascending: false })

    setSubAccounts((subs || []) as Organization[])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading billing overview...</div>
      </div>
    )
  }

  if (!parentOrg) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Master access required</p>
            <p className="text-sm text-gray-500">
              Only Kemis CRM master accounts can view billing across sub-accounts.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeSubs = subAccounts.filter(s => s.billing_status === 'active')
  const suspendedSubs = subAccounts.filter(s => s.billing_status === 'suspended')
  const cancelledSubs = subAccounts.filter(s => s.billing_status === 'cancelled')

  const estimateMonthly = (org: Organization) => {
    switch (org.billing_plan) {
      case 'basic':
        return 49
      case 'pro':
        return 99
      case 'enterprise':
        return 199
      default:
        return 0
    }
  }

  const totalMonthly = activeSubs.reduce((sum, org) => sum + estimateMonthly(org), 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing Overview</h1>
          <p className="text-gray-500 mt-1">
            High-level view of billing status across all sub-accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Total Sub-Accounts</p>
            <p className="text-2xl font-bold mt-2">{subAccounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{activeSubs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Suspended</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">{suspendedSubs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Est. Monthly (Active)
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              ${totalMonthly.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {subAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No sub-accounts yet.</p>
            <p className="text-sm text-gray-400">
              Once you create sub-accounts, their billing status will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              Sub-Account Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Client
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Plan
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Limits
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Est. Monthly
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subAccounts.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {org.branding?.display_name || org.name}
                            </p>
                            {org.slug && (
                              <p className="text-xs text-gray-400">slug: {org.slug}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs capitalize">
                          {org.billing_plan || 'free'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            org.billing_status === 'active'
                              ? 'default'
                              : org.billing_status === 'suspended'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-xs capitalize"
                        >
                          {org.billing_status || 'active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Max {org.max_users ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {org.max_storage_mb ?? 0} MB
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        ${estimateMonthly(org)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

