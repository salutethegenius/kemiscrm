'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Download, Trash2, FileText, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CompliancePage() {
  const [loading, setLoading] = useState(false)
  const [exportRequest, setExportRequest] = useState<any>(null)
  const [deletionRequest, setDeletionRequest] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [exportRes, deletionRes] = await Promise.all([
      supabase
        .from('data_export_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (!exportRes.error && exportRes.data) setExportRequest(exportRes.data)
    if (!deletionRes.error && deletionRes.data) setDeletionRequest(deletionRes.data)
  }

  const handleExportData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Create export request
      const { data: request, error: reqError } = await supabase
        .from('data_export_requests')
        .insert([{
          user_id: user.id,
          status: 'processing',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }])
        .select()
        .single()

      if (reqError) throw reqError

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const orgId = profile?.organization_id

      // Export data - handle null orgId case
      const queryFilter = orgId 
        ? `user_id.eq.${user.id},organization_id.eq.${orgId}`
        : `user_id.eq.${user.id}`

      const [contactsRes, invoicesRes, dealsRes, activitiesRes] = await Promise.all([
        supabase.from('contacts').select('*').or(queryFilter),
        orgId ? supabase.from('invoices').select('*').or(queryFilter) : supabase.from('invoices').select('*').eq('user_id', user.id),
        orgId ? supabase.from('deals').select('*').or(queryFilter) : supabase.from('deals').select('*').eq('user_id', user.id),
        supabase.from('activities').select('*').eq('user_id', user.id),
      ])

      // Check for errors in data fetching
      if (contactsRes.error) console.error('Error fetching contacts:', contactsRes.error)
      if (invoicesRes.error) console.error('Error fetching invoices:', invoicesRes.error)
      if (dealsRes.error) console.error('Error fetching deals:', dealsRes.error)
      if (activitiesRes.error) console.error('Error fetching activities:', activitiesRes.error)

      const exportData = {
        user: profile,
        contacts: contactsRes.data || [],
        invoices: invoicesRes.data || [],
        deals: dealsRes.data || [],
        activities: activitiesRes.data || [],
        exported_at: new Date().toISOString(),
      }

      // Download as JSON
      const jsonStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kemis-crm-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Update request
      await supabase
        .from('data_export_requests')
        .update({ status: 'completed', file_url: 'downloaded' })
        .eq('id', request.id)

      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded successfully.',
      })

      fetchRequests()
    } catch (error: any) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  const handleRequestDeletion = async () => {
    if (!confirm('Are you sure you want to request deletion of all your data? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('data_deletion_requests')
        .insert([{
          user_id: user.id,
          status: 'pending',
          reason: 'User requested data deletion',
        }])

      if (error) throw error

      toast({
        title: 'Deletion requested',
        description: 'Your data deletion request has been submitted. An administrator will process it shortly.',
      })

      fetchRequests()
    } catch (error: any) {
      console.error('Deletion request error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit deletion request',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Compliance & Privacy</h1>
        <p className="text-gray-500 mt-1">Manage your data and privacy settings</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Privacy Policy
          </CardTitle>
          <CardDescription>
            Read our privacy policy to understand how we handle your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/compliance/privacy" className="text-blue-600 hover:underline">
            View Privacy Policy →
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download all your data in JSON format (Bahamas Data Protection Act compliant)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportRequest && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Last Export</p>
                  <p className="text-xs text-gray-500">
                    {new Date(exportRequest.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={exportRequest.status === 'completed' ? 'default' : 'secondary'}>
                  {exportRequest.status}
                </Badge>
              </div>
            </div>
          )}
          <Button onClick={handleExportData} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Exporting...' : 'Export My Data'}
          </Button>
          <p className="text-xs text-gray-500">
            Your export will include: contacts, invoices, deals, activities, and all associated data.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            Request Data Deletion
          </CardTitle>
          <CardDescription>
            Request permanent deletion of all your data (Right to be Forgotten)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deletionRequest && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">Deletion Request Pending</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Status: <Badge variant="secondary" className="ml-1">{deletionRequest.status}</Badge>
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    Requested on {new Date(deletionRequest.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-2">
              <strong>Warning:</strong> This action cannot be undone. All your data including:
            </p>
            <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
              <li>All contacts and associated data</li>
              <li>All invoices and financial records</li>
              <li>All deals and pipeline data</li>
              <li>All activities and notes</li>
              <li>Your user account and profile</li>
            </ul>
          </div>
          <Button
            variant="destructive"
            onClick={handleRequestDeletion}
            disabled={loading || deletionRequest?.status === 'pending'}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deletionRequest?.status === 'pending' ? 'Deletion Requested' : 'Request Data Deletion'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Data Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Encryption</p>
              <p className="text-gray-600">All data is encrypted in transit (HTTPS) and at rest (database encryption)</p>
            </div>
            <div>
              <p className="font-medium">Access Control</p>
              <p className="text-gray-600">Row-level security ensures users can only access their organization's data</p>
            </div>
            <div>
              <p className="font-medium">Backups</p>
              <p className="text-gray-600">Daily automated backups with 30-day retention</p>
            </div>
            <div>
              <p className="font-medium">Compliance</p>
              <p className="text-gray-600">Compliant with Bahamas Data Protection Act and GDPR standards</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
