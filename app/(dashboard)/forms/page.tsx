'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, ExternalLink, Copy, Trash2 } from 'lucide-react'
import { FormDialog } from '@/components/forms/form-dialog'
import type { LeadForm } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function FormsPage() {
  const [forms, setForms] = useState<LeadForm[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<LeadForm | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchForms = async () => {
    const { data, error } = await supabase
      .from('lead_forms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    setForms(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const handleEdit = (form: LeadForm) => {
    setEditingForm(form)
    setDialogOpen(true)
  }

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    const { error } = await supabase.from('lead_forms').delete().eq('id', formId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Form deleted', description: 'The form has been removed.' })
    fetchForms()
  }

  const copyFormLink = (formId: string) => {
    const url = `${window.location.origin}/f/${formId}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Link copied', description: 'Form link copied to clipboard.' })
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingForm(null)
  }

  const handleSuccess = () => {
    handleClose()
    fetchForms()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Capture Forms</h1>
          <p className="text-gray-500 mt-1">Create forms to capture leads from your website</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading forms...</div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No forms yet. Create your first lead capture form.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    <CardDescription>
                      Created {formatDate(form.created_at)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {(form.fields as any[])?.length || 0} fields
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyFormLink(form.id)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`/f/${form.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(form)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(form.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        form={editingForm}
      />
    </div>
  )
}
