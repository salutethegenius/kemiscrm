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
  ChevronRight,
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
  CheckSquare,
  MessageCircle,
  User as UserIcon,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Organization } from '@/lib/types'
import { PERMISSIONS } from '@/lib/types'

// Navigation items with their permission keys
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Contacts', href: '/contacts', icon: Users, permission: 'contacts' },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'pipeline' },
  { name: 'Forms', href: '/forms', icon: FileText, permission: 'forms' },
  { name: 'Landing Pages', href: '/landing-pages', icon: Globe, permission: 'forms' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, permission: 'calendar' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks' },
  // { name: 'Messages', href: '/messages', icon: MessageCircle, permission: 'messages' }, // Disabled for now
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
  { name: 'Compliance', href: '/compliance', icon: FileCheck, permission: 'user_management' },
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [organizationName, setOrganizationName] = useState<string>('')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [userFullName, setUserFullName] = useState<string>('')

  useEffect(() => {
    fetchUserPermissions()
  }, [])

  const fetchUserPermissions = async () => {
    // Get user's role and full name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, organization_id, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.full_name) {
      setUserFullName(profile.full_name)
    }

    if (profile?.role && profile?.organization_id) {
      // Get permissions for this role
      const { data: perms } = await supabase
        .from('role_permissions')
        .select('permission, enabled')
        .eq('organization_id', profile.organization_id)
        .eq('role', profile.role)

      if (perms && perms.length > 0) {
        const enabledPerms = new Set(
          perms.filter(p => p.enabled).map(p => p.permission)
        )
        setPermissions(enabledPerms)
      } else {
        // If no role_permissions are configured yet for this org/role,
        // fall back to enabling all known permissions so the menu is visible.
        setPermissions(new Set(PERMISSIONS.map(p => p.key)))
      }

      // Fetch organization details
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, settings, is_master, parent_org_id, max_users, max_storage_mb, billing_status, billing_plan, enabled_features, branding')
        .eq('id', profile.organization_id)
        .single()
      
      if (org) {
        setOrganization(org as Organization)
        if (org.name) {
          setOrganizationName(org.name)
        }
      }
    } else {
      // Default: show all for users without org (backwards compatibility)
      setPermissions(new Set([
        'dashboard', 'contacts', 'pipeline', 'forms', 'calendar', 'tasks', 'messages',
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

  // Generate initials from full name or email
  const userInitials = userFullName
    ? userFullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.split('@')[0].slice(0, 2).toUpperCase() || 'U'
  
  // Display name: prefer full name, fallback to email username
  const displayName = userFullName || user.email?.split('@')[0] || 'User'

  const isFeatureEnabled = (featureKey: string) => {
    // Master org can access everything
    if (organization?.is_master) return true
    if (!organization?.enabled_features || organization.enabled_features.length === 0) return true
    return organization.enabled_features.includes(featureKey)
  }

  const hasPermission = (permission: string, featureKey?: string) => {
    const permitted = permissions.has(permission)
    if (!permitted) return false
    // If a feature key is provided, also check org feature gating
    return featureKey ? isFeatureEnabled(featureKey) : true
  }

  const filterByPermission = <T extends { permission: string; featureKey?: string }>(items: T[]) => 
    items.filter(item => hasPermission(item.permission, (item as any).featureKey))

  const filteredNav = filterByPermission(navigation)
  const filteredInvoicing = filterByPermission(invoicingNav)
  const filteredHr = filterByPermission(hrNav)
  const filteredAccounting = filterByPermission(accountingNav)
  const filteredAdmin = filterByPermission(adminNav)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const isSectionExpanded = (section: string) => expandedSections.has(section)

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
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 leading-tight">Kemis CRM</span>
            {organizationName && (
              <span className="text-xs text-gray-500 truncate max-w-[140px]">{organizationName}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {/* Main CRM - shown for all accounts */}
        {filteredNav.map(renderNavItem)}

        {/* Invoicing Section */}
        {filteredInvoicing.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => toggleSection('invoicing')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
            >
              <span>Invoicing</span>
              {isSectionExpanded('invoicing') ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {isSectionExpanded('invoicing') && (
              <div className="mt-2 space-y-1">
                {filteredInvoicing.map(renderNavItem)}
              </div>
            )}
          </div>
        )}

        {/* HR Section */}
        {filteredHr.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => toggleSection('hr')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
            >
              <span>HR</span>
              {isSectionExpanded('hr') ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {isSectionExpanded('hr') && (
              <div className="mt-2 space-y-1">
                {filteredHr.map(renderNavItem)}
              </div>
            )}
          </div>
        )}

        {/* Accounting Section */}
        {filteredAccounting.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => toggleSection('accounting')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
            >
              <span>Accounting</span>
              {isSectionExpanded('accounting') ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {isSectionExpanded('accounting') && (
              <div className="mt-2 space-y-1">
                {filteredAccounting.map(renderNavItem)}
              </div>
            )}
          </div>
        )}

        {/* Admin Section */}
        {filteredAdmin.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => toggleSection('admin')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
            >
              <span>Admin</span>
              {isSectionExpanded('admin') ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {isSectionExpanded('admin') && (
              <div className="mt-2 space-y-1">
                {filteredAdmin.map(renderNavItem)}
              </div>
            )}
          </div>
        )}

        {/* Master Admin Section - only for master org (Kemis CRM) */}
        {organization?.is_master === true && (
          <div className="pt-4">
            <button
              onClick={() => toggleSection('master')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
            >
              <span>Platform</span>
              {isSectionExpanded('master') ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {isSectionExpanded('master') && (
              <div className="mt-2 space-y-1">
                {renderNavItem({
                  name: 'Sub-Accounts',
                  href: '/master/accounts',
                  icon: Building2,
                  permission: 'user_management',
                })}
                {renderNavItem({
                  name: 'Billing Overview',
                  href: '/master/billing',
                  icon: CreditCard,
                  permission: 'user_management',
                })}
              </div>
            )}
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
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings#profile">
                <UserIcon className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
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
