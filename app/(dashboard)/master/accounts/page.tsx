'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Users, HardDrive, AlertCircle } from 'lucide-react'
import type { Organization } from '@/lib/types'
import { SubAccountDialog } from '@/components/master/sub-account-dialog'
import { useToast } from '@/components/ui/use-toast'

export default function MasterAccountsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [parentOrg, setParentOrg] = useState<Organization | null>(null)
  const [subAccounts, setSubAccounts] = useState<Organization[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)

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

    // Get user's organization and ensure it's master
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
      .select('id, name, is_master, max_users, max_storage_mb, billing_status, billing_plan, enabled_features, branding')
      .eq('id', profile.organization_id)
      .single()

    if (!org || !org.is_master) {
      setParentOrg(null)
      setSubAccounts([])
      setLoading(false)
      return
    }

    setParentOrg(org as Organization)

    const { data: subs, error } = await supabase
      .from('organizations')
      .select('id, name, slug, is_master, parent_org_id, max_users, max_storage_mb, billing_status, billing_plan, enabled_features, branding, created_at')
      // Treat any non-master org as a sub-account, plus any explicitly linked by parent_org_id
      .or(`parent_org_id.eq.${org.id},is_master.eq.false`)
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: 'Error loading sub-accounts',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setSubAccounts((subs || []) as Organization[])
    }

    setLoading(false)
  }

  const handleCreate = () => {
    setEditingOrg(null)
    setDialogOpen(true)
  }

  const handleEdit = (org: Organization) => {
    setEditingOrg(org)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setEditingOrg(null)
    fetchData()
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading sub-accounts...</div>
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
              Only Kemis CRM master accounts can manage sub-accounts.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sub-Accounts</h1>
          <p className="text-gray-500 mt-1">
            Manage client accounts under <span className="font-semibold">{parentOrg.name}</span>
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Sub-Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Total Sub-Accounts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{subAccounts.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {subAccounts.filter(s => s.billing_status === 'active').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Suspended</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {subAccounts.filter(s => s.billing_status === 'suspended').length}
            </p>
          </div>
        </CardContent>
      </Card>

      {subAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No sub-accounts yet.</p>
            <p className="text-sm text-gray-400 mb-4">
              Create a sub-account for each client organization you onboard.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Sub-Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {subAccounts.map((org) => (
            <Card key={org.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {org.branding?.display_name || org.name}
                      </p>
                      {org.slug && (
                        <span className="text-xs text-gray-400 border px-1.5 py-0.5 rounded">
                          {org.slug}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Plan: {org.billing_plan || 'free'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      org.billing_status === 'active'
                        ? 'default'
                        : org.billing_status === 'suspended'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {org.billing_status || 'active'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>Max {org.max_users ?? 0} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>{org.max_storage_mb ?? 0} MB storage</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex flex-wrap gap-1">
                    {(org.enabled_features || [])
                      .slice(0, 4)
                      .map((f) => (
                        <Badge key={f} variant="outline" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                    {(org.enabled_features || []).length > 4 && (
                      <span className="text-xs text-gray-400">
                        +{(org.enabled_features || []).length - 4} more
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(org)}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {parentOrg && (
        <SubAccountDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false)
            setEditingOrg(null)
          }}
          onSuccess={handleSuccess}
          parentOrgId={parentOrg.id}
          organization={editingOrg}
        />
      )}
    </div>
  )
}

