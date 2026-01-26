'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  Calendar,
  Settings,
  LogOut,
  ChevronDown,
  Receipt,
  UserCog,
  Wallet,
  Building2,
  Clock,
  CreditCard,
  PieChart,
  Shield,
  KeyRound,
  FileCheck,
  Globe,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { RolePermission, UserRole } from '@/lib/types'

// Navigation items with their permission keys
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Contacts', href: '/contacts', icon: Users, permission: 'contacts' },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'pipeline' },
  { name: 'Forms', href: '/forms', icon: FileText, permission: 'forms' },
  { name: 'Landing Pages', href: '/landing-pages', icon: Globe, permission: 'forms' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, permission: 'calendar' },
  { name: 'Compliance', href: '/compliance', icon: FileCheck, permission: 'dashboard' },
]

const invoicingNav = [
  { name: 'Invoices', href: '/invoices', icon: Receipt, permission: 'invoices' },
  { name: 'Clients', href: '/clients', icon: Building2, permission: 'clients' },
  { name: 'Payments', href: '/payments', icon: CreditCard, permission: 'payments' },
]

const hrNav = [
  { name: 'Employees', href: '/hr/employees', icon: UserCog, permission: 'employees' },
  { name: 'Time Tracking', href: '/hr/time', icon: Clock, permission: 'time_tracking' },
  { name: 'Departments', href: '/hr/departments', icon: Building2, permission: 'departments' },
]

const accountingNav = [
  { name: 'Expenses', href: '/accounting/expenses', icon: Wallet, permission: 'expenses' },
  { name: 'Income', href: '/accounting/income', icon: PieChart, permission: 'income' },
  { name: 'Reports', href: '/accounting/reports', icon: PieChart, permission: 'reports' },
]

const adminNav = [
  { name: 'User Management', href: '/admin/users', icon: Shield, permission: 'user_management' },
  { name: 'Role Permissions', href: '/admin/permissions', icon: KeyRound, permission: 'role_permissions' },
]

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserPermissions()
  }, [])

  const fetchUserPermissions = async () => {
    // Get user's role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profile?.role && profile?.organization_id) {
      // Get permissions for this role
      const { data: perms } = await supabase
        .from('role_permissions')
        .select('permission, enabled')
        .eq('organization_id', profile.organization_id)
        .eq('role', profile.role)

      if (perms) {
        const enabledPerms = new Set(
          perms.filter(p => p.enabled).map(p => p.permission)
        )
        setPermissions(enabledPerms)
      }
    } else {
      // Default: show all for users without org (backwards compatibility)
      setPermissions(new Set([
        'dashboard', 'contacts', 'pipeline', 'forms', 'calendar',
        'invoices', 'clients', 'payments',
        'employees', 'time_tracking', 'departments',
        'expenses', 'income', 'reports',
        'user_management', 'role_permissions'
      ]))
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userInitials = user.email
    ?.split('@')[0]
    .slice(0, 2)
    .toUpperCase() || 'U'

  const hasPermission = (permission: string) => permissions.has(permission)

  const filterByPermission = <T extends { permission: string }>(items: T[]) => 
    items.filter(item => hasPermission(item.permission))

  const filteredNav = filterByPermission(navigation)
  const filteredInvoicing = filterByPermission(invoicingNav)
  const filteredHr = filterByPermission(hrNav)
  const filteredAccounting = filterByPermission(accountingNav)
  const filteredAdmin = filterByPermission(adminNav)

  const renderNavItem = (item: typeof navigation[0]) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-blue-700' : 'text-gray-400')} />
        {item.name}
      </Link>
    )
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Kemis CRM</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {/* Main CRM */}
        {filteredNav.map(renderNavItem)}

        {/* Invoicing Section */}
        {filteredInvoicing.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoicing</p>
            <div className="mt-2 space-y-1">
              {filteredInvoicing.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* HR Section */}
        {filteredHr.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">HR</p>
            <div className="mt-2 space-y-1">
              {filteredHr.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* Accounting Section */}
        {filteredAccounting.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Accounting</p>
            <div className="mt-2 space-y-1">
              {filteredAccounting.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {filteredAdmin.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            <div className="mt-2 space-y-1">
              {filteredAdmin.map(renderNavItem)}
            </div>
          </div>
        )}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-2">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
