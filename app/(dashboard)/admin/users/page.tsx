'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Shield, Users, UserCog, MessageCircle } from 'lucide-react'
import type { UserProfile, UserRole } from '@/lib/types'

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  accountant: 'bg-green-100 text-green-700',
  user: 'bg-gray-100 text-gray-700',
}

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full access to all features and settings',
  owner: 'Business owner with full access',
  manager: 'Can manage team and view reports',
  accountant: 'Access to invoicing and accounting',
  user: 'Basic access to CRM features',
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user')
  const { toast } = useToast()
  const supabase = createClient()

  const fetchUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setCurrentUserRole(profile.role)
      }
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at')

    if (!error && data) {
      setUsers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Role updated', description: `User role changed to ${newRole}` })
      fetchUsers()
    }
  }

  const canManageUsers = ['admin', 'owner'].includes(currentUserRole)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">Manage user roles and permissions</p>
      </div>

      {/* Role Legend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
          <CardDescription>Understanding user access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(roleDescriptions) as UserRole[]).map((role) => (
              <div key={role} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className={`px-2 py-1 rounded text-xs font-medium ${roleColors[role]}`}>
                  {role}
                </div>
                <p className="text-sm text-gray-600">{roleDescriptions[role]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCog className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No user profiles found.</p>
              <p className="text-sm mt-2">User profiles are created when users sign up.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {user.full_name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                      <p className="text-sm text-gray-500">{user.department || 'No department'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {user.id !== currentUserId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/messages?user=${user.id}`}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Link>
                      </Button>
                    )}
                    <Badge className={roleColors[user.role]}>{user.role}</Badge>
                    {canManageUsers && (
                      <Select
                        value={user.role}
                        onValueChange={(v) => updateUserRole(user.id, v as UserRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Badge variant={user.is_active ? 'success' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!canManageUsers && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center space-x-3">
            <Shield className="h-5 w-5 text-orange-600" />
            <p className="text-sm text-orange-800">
              You need Admin or Owner role to manage user permissions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
