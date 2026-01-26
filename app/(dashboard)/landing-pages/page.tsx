'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, ExternalLink, Copy, Trash2, Globe } from 'lucide-react'
import { LandingPageDialog } from '@/components/landing-pages/landing-page-dialog'
import type { LandingPage, LeadForm } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function LandingPagesPage() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [forms, setForms] = useState<LeadForm[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchData = async () => {
    const [pagesRes, formsRes] = await Promise.all([
      supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('lead_forms')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (pagesRes.error) {
      toast({ title: 'Error', description: pagesRes.error.message, variant: 'destructive' })
    } else {
      setLandingPages(pagesRes.data || [])
    }

    if (formsRes.error) {
      toast({ title: 'Error', description: formsRes.error.message, variant: 'destructive' })
    } else {
      setForms(formsRes.data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEdit = (page: LandingPage) => {
    setEditingPage(page)
    setDialogOpen(true)
  }

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this landing page?')) return

    const { error } = await supabase.from('landing_pages').delete().eq('id', pageId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Deleted', description: 'Landing page deleted successfully.' })
    fetchData()
  }

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/lp/${slug}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Copied!', description: 'Landing page link copied to clipboard.' })
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingPage(null)
    fetchData()
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-gray-500 mt-1">Create beautiful landing pages to collect leads</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Landing Page
        </Button>
      </div>

      {forms.length === 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Globe className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 mb-1">Create a Form First</p>
                <p className="text-sm text-orange-700">
                  You need to create a form before you can create a landing page. Landing pages are linked to forms to collect leads.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.location.href = '/forms'}
                >
                  Go to Forms →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {landingPages.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No landing pages yet</h3>
            <p className="text-gray-500 mb-6">Create your first landing page to start collecting leads</p>
            <Button onClick={() => setDialogOpen(true)} disabled={forms.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Landing Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landingPages.map((page) => {
            const linkedForm = forms.find(f => f.id === page.form_id)
            return (
              <Card key={page.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {page.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={page.published ? 'default' : 'secondary'}>
                      {page.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-500">Form: </span>
                      <span className="font-medium">
                        {linkedForm ? linkedForm.name : 'No form linked'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Created {formatDate(page.created_at)}
                    </div>
                    {page.published && (
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/lp/${page.slug}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(page.slug)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(page)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(page.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <LandingPageDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogClose}
        landingPage={editingPage}
        forms={forms}
      />
    </div>
  )
}
