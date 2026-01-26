'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { Shield, Save } from 'lucide-react'
import { PERMISSIONS, type UserRole, type RolePermission } from '@/lib/types'

const ROLES: UserRole[] = ['admin', 'owner', 'manager', 'accountant', 'user']

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  accountant: 'bg-green-100 text-green-700',
  user: 'bg-gray-100 text-gray-700',
}

export default function RolePermissionsPage() {
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    // Check user role
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setCanManage(['admin', 'owner'].includes(profile?.role || ''))
    }

    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role')

    if (!error && data) {
      setPermissions(data)
    }
    setLoading(false)
  }

  const isPermissionEnabled = (role: UserRole, permission: string): boolean => {
    const perm = permissions.find(p => p.role === role && p.permission === permission)
    return perm?.enabled ?? false
  }

  const togglePermission = (role: UserRole, permission: string) => {
    if (!canManage) return
    
    setPermissions(prev => {
      const existing = prev.find(p => p.role === role && p.permission === permission)
      if (existing) {
        return prev.map(p => 
          p.role === role && p.permission === permission 
            ? { ...p, enabled: !p.enabled }
            : p
        )
      }
      return prev
    })
  }

  const savePermissions = async () => {
    setSaving(true)
    
    const updates = permissions.map(p => ({
      id: p.id,
      enabled: p.enabled,
    }))

    for (const update of updates) {
      await supabase
        .from('role_permissions')
        .update({ enabled: update.enabled })
        .eq('id', update.id)
    }

    toast({ title: 'Permissions saved', description: 'Role permissions have been updated.' })
    setSaving(false)
  }

  // Group permissions by their group
  const groupedPermissions = PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = []
    acc[perm.group].push(perm)
    return acc
  }, {} as Record<string, typeof PERMISSIONS[number][]>)

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading permissions...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Permissions</h1>
          <p className="text-gray-500 mt-1">Configure access levels for each role</p>
        </div>
        {canManage && (
          <Button onClick={savePermissions} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {!canManage && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center space-x-3">
            <Shield className="h-5 w-5 text-orange-600" />
            <p className="text-sm text-orange-800">
              You need Admin or Owner role to modify permissions.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>Check the boxes to enable features for each role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Feature</th>
                  {ROLES.map(role => (
                    <th key={role} className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[role]}`}>
                        {role}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <>
                    <tr key={group} className="bg-gray-50">
                      <td colSpan={ROLES.length + 1} className="py-2 px-4 font-semibold text-gray-700">
                        {group}
                      </td>
                    </tr>
                    {perms.map(perm => (
                      <tr key={perm.key} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{perm.label}</td>
                        {ROLES.map(role => (
                          <td key={`${role}-${perm.key}`} className="text-center py-3 px-4">
                            <Checkbox
                              checked={isPermissionEnabled(role, perm.key)}
                              onCheckedChange={() => togglePermission(role, perm.key)}
                              disabled={!canManage}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
