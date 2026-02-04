'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  FileText, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye,
  Download,
  Filter,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  AlertCircle
} from 'lucide-react'
import type { AuditLog } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-green-600" />,
  update: <Pencil className="h-4 w-4 text-blue-600" />,
  delete: <Trash2 className="h-4 w-4 text-red-600" />,
  view: <Eye className="h-4 w-4 text-gray-600" />,
  export: <Download className="h-4 w-4 text-purple-600" />,
  login: <User className="h-4 w-4 text-green-600" />,
  logout: <User className="h-4 w-4 text-gray-600" />,
}

const ACTION_COLORS: Record<string, 'success' | 'default' | 'destructive' | 'secondary' | 'warning'> = {
  create: 'success',
  update: 'default',
  delete: 'destructive',
  view: 'secondary',
  export: 'default',
  login: 'success',
  logout: 'secondary',
}

const ENTITY_LABELS: Record<string, string> = {
  contacts: 'Contact',
  clients: 'Client',
  invoices: 'Invoice',
  deals: 'Deal',
  expenses: 'Expense',
  income: 'Income',
  payments: 'Payment',
  employees: 'Employee',
  user_profiles: 'User Profile',
  time_entries: 'Time Entry',
  leave_requests: 'Leave Request',
}

export default function AuditViewerPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('7')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 50
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    
    // Check user role first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    setHasAccess(true)

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply date filter
    if (dateFilter !== 'all') {
      const daysAgo = parseInt(dateFilter)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)
      query = query.gte('created_at', startDate.toISOString())
    }

    // Apply action filter
    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter)
    }

    // Apply entity filter
    if (entityFilter !== 'all') {
      query = query.eq('entity_type', entityFilter)
    }

    // Apply search
    if (search) {
      query = query.or(`entity_name.ilike.%${search}%,user_email.ilike.%${search}%,user_name.ilike.%${search}%`)
    }

    // Pagination
    query = query.range(page * pageSize, (page + 1) * pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
    } else {
      setLogs(data || [])
      setTotalCount(count || 0)
    }

    setLoading(false)
  }, [supabase, actionFilter, entityFilter, dateFilter, search, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [actionFilter, entityFilter, dateFilter, search])

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity Name', 'Changes'].join(','),
      ...logs.map(log => [
        log.created_at,
        log.user_email || log.user_name || 'System',
        log.action,
        log.entity_type,
        log.entity_name || '',
        log.changes ? JSON.stringify(log.changes) : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatChanges = (changes: AuditLog['changes']) => {
    if (!changes) return null
    return Object.entries(changes).map(([field, { old: oldVal, new: newVal }]) => (
      <div key={field} className="text-sm py-1 border-b last:border-0">
        <span className="font-medium text-gray-700">{field}:</span>
        <div className="ml-4 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Old:</span>{' '}
            <span className="text-red-600">{JSON.stringify(oldVal) || '(empty)'}</span>
          </div>
          <div>
            <span className="text-gray-500">New:</span>{' '}
            <span className="text-green-600">{JSON.stringify(newVal) || '(empty)'}</span>
          </div>
        </div>
      </div>
    ))
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (!loading && !hasAccess) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-500 mb-4">
              Only administrators and owners can view the audit log.
            </p>
            <Link href="/compliance">
              <Button variant="outline">Back to Compliance</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/compliance" className="text-gray-500 hover:text-gray-700">
              Compliance
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">Audit Log</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1">Track all account activity for compliance and accountability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user or entity name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[150px]">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="deals">Deals</SelectItem>
                  <SelectItem value="expenses">Expenses</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="user_profiles">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Events</p>
            <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Creates</p>
            <p className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.action === 'create').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Updates</p>
            <p className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.action === 'update').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Deletes</p>
            <p className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.action === 'delete').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Activity will be logged automatically as users interact with the system.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm">{log.user_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{log.user_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ACTION_ICONS[log.action] || <FileText className="h-4 w-4" />}
                        <Badge variant={ACTION_COLORS[log.action] || 'secondary'}>
                          {log.action}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {ENTITY_LABELS[log.entity_type] || log.entity_type}
                      </div>
                      {log.entity_name && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {log.entity_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.action === 'update' && log.changes && (
                        <span className="text-blue-600">
                          {Object.keys(log.changes).length} field(s) changed
                        </span>
                      )}
                      {log.action === 'delete' && (
                        <span className="text-red-600">Permanently deleted</span>
                      )}
                      {log.action === 'create' && (
                        <span className="text-green-600">New record created</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} events
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Timestamp</p>
                  <p className="font-medium">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Action</p>
                  <div className="flex items-center gap-2">
                    {ACTION_ICONS[selectedLog.action]}
                    <Badge variant={ACTION_COLORS[selectedLog.action]}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">{selectedLog.user_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{selectedLog.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entity</p>
                  <p className="font-medium">
                    {ENTITY_LABELS[selectedLog.entity_type] || selectedLog.entity_type}
                  </p>
                  {selectedLog.entity_name && (
                    <p className="text-xs text-gray-500">{selectedLog.entity_name}</p>
                  )}
                </div>
              </div>

              {selectedLog.entity_id && (
                <div>
                  <p className="text-sm text-gray-500">Entity ID</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded">{selectedLog.entity_id}</p>
                </div>
              )}

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Changes</p>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                    {formatChanges(selectedLog.changes)}
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Metadata</p>
                  <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {(selectedLog.ip_address || selectedLog.user_agent) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Technical Details</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {selectedLog.ip_address && <p>IP: {selectedLog.ip_address}</p>}
                    {selectedLog.user_agent && <p>User Agent: {selectedLog.user_agent}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
