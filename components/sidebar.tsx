'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { KrmFullLockup } from '@/components/logo/krm-logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
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
  Menu,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Organization } from '@/lib/types'
import { PERMISSIONS } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'

// Navigation items with their permission keys
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Contacts', href: '/contacts', icon: Users, permission: 'contacts' },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'pipeline' },
  { name: 'Forms', href: '/forms', icon: FileText, permission: 'forms' },
  { name: 'Landing Pages', href: '/landing-pages', icon: Globe, permission: 'forms' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, permission: 'calendar' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks' },
  { name: 'Email', href: '/email', icon: MessageCircle, permission: 'email' },
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
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [organizationName, setOrganizationName] = useState<string>('')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [userFullName, setUserFullName] = useState<string>('')

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    fetchUserPermissions()
  }, [])

  const fetchUserPermissions = async () => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, organization_id, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.full_name) {
      setUserFullName(profile.full_name)
    }

    if (profile?.role && profile?.organization_id) {
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
        setPermissions(new Set(PERMISSIONS.map(p => p.key)))
      }

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

  const userInitials = userFullName
    ? userFullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.split('@')[0].slice(0, 2).toUpperCase() || 'U'
  
  const displayName = userFullName || user.email?.split('@')[0] || 'User'

  const isDemoAccount = user.email === 'demo@krm.bs'

  const isFeatureEnabled = (featureKey: string) => {
    if (isDemoAccount) return true
    if (organization?.is_master) return true
    if (!organization?.enabled_features || organization.enabled_features.length === 0) return true
    return organization.enabled_features.includes(featureKey)
  }

  const hasPermission = (permission: string, featureKey?: string) => {
    if (isDemoAccount) return true
    const permitted = permissions.has(permission)
    if (!permitted) return false
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
            ? 'bg-primary/10 text-primary'
            : 'text-foreground/80 hover:bg-muted'
        )}
      >
        <item.icon className={cn('mr-3 h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
        {item.name}
      </Link>
    )
  }

  const renderCollapsibleSection = (title: string, key: string, items: typeof navigation) => {
    if (items.length === 0) return null
    return (
      <div className="pt-4" key={key}>
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
        >
          <span>{title}</span>
          {isSectionExpanded(key) ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        {isSectionExpanded(key) && (
          <div className="mt-2 space-y-1">
            {items.map(renderNavItem)}
          </div>
        )}
      </div>
    )
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex flex-col gap-1 h-auto min-h-[4rem] px-4 py-3 border-b">
        <Link href="/dashboard" className="flex items-center">
          <KrmFullLockup variant="light" showSub height={32} />
        </Link>
        {(organizationName || user.email === 'demo@krm.bs') && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px] pl-1">
            {user.email === 'demo@krm.bs' ? 'Demo Account' : organizationName}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map(renderNavItem)}
        {renderCollapsibleSection('Invoicing', 'invoicing', filteredInvoicing)}
        {renderCollapsibleSection('HR', 'hr', filteredHr)}
        {renderCollapsibleSection('Accounting', 'accounting', filteredAccounting)}
        {renderCollapsibleSection('Admin', 'admin', filteredAdmin)}

        {/* Master Admin Section */}
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
                <AvatarFallback className="bg-primary/10 text-primary">
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
    </>
  )

  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-white border-b">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard">
            <KrmFullLockup variant="light" height={24} />
          </Link>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Mobile sidebar sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col h-full">
              {sidebarContent}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r">
      {sidebarContent}
    </div>
  )
}
