'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import type { LandingPage, LeadForm } from '@/lib/types'

interface LandingPageDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  landingPage?: LandingPage | null
  forms: LeadForm[]
}

export function LandingPageDialog({ open, onClose, onSuccess, landingPage, forms }: LandingPageDialogProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formId, setFormId] = useState<string>('')
  const [headerText, setHeaderText] = useState('')
  const [headerSubtext, setHeaderSubtext] = useState('')
  const [footerText, setFooterText] = useState('')
  const [published, setPublished] = useState(false)
  const [slug, setSlug] = useState('')
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (landingPage) {
      setTitle(landingPage.title)
      setDescription(landingPage.description || '')
      setFormId(landingPage.form_id || '')
      setHeaderText(landingPage.header_text || '')
      setHeaderSubtext(landingPage.header_subtext || '')
      setFooterText(landingPage.footer_text || '')
      setPublished(landingPage.published)
      setSlug(landingPage.slug)
    } else {
      setTitle('')
      setDescription('')
      setFormId('')
      setHeaderText('')
      setHeaderSubtext('')
      setFooterText('')
      setPublished(false)
      setSlug('')
    }
  }, [landingPage, open])

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  useEffect(() => {
    if (title && !landingPage) {
      setSlug(generateSlug(title))
    }
  }, [title, landingPage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      setLoading(false)
      return
    }

    if (!formId || formId === '__none__') {
      toast({ title: 'Error', description: 'Please select a form to link to this landing page', variant: 'destructive' })
      setLoading(false)
      return
    }

    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' })
      setLoading(false)
      return
    }

    if (!slug.trim()) {
      toast({ title: 'Error', description: 'Slug is required', variant: 'destructive' })
      setLoading(false)
      return
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    const payload: any = {
      title: title.trim(),
      description: description.trim() || null,
      slug: slug.trim(),
      form_id: formId === '__none__' ? null : formId,
      header_text: headerText.trim() || null,
      header_subtext: headerSubtext.trim() || null,
      footer_text: footerText.trim() || null,
      published,
      user_id: user.id,
      organization_id: profile?.organization_id || null,
    }

    if (published && !landingPage?.published) {
      payload.published_at = new Date().toISOString()
    }

    let error
    if (landingPage) {
      const result = await supabase.from('landing_pages').update(payload).eq('id', landingPage.id)
      error = result.error
    } else {
      const result = await supabase.from('landing_pages').insert([payload])
      error = result.error
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({
      title: landingPage ? 'Landing page updated' : 'Landing page created',
      description: landingPage ? 'The landing page has been updated.' : 'Your landing page is ready!',
    })

    setLoading(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{landingPage ? 'Edit Landing Page' : 'Create Landing Page'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {forms.length === 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>No forms available.</strong> Please create a form first before creating a landing page.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="form">Link to Form *</Label>
            <Select value={formId || '__none__'} onValueChange={setFormId} disabled={forms.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select a form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No form selected</SelectItem>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Select the form that will be displayed on this landing page. Create a form first if none are available.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Get Started Today"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., get-started-today"
              required
            />
            <p className="text-xs text-gray-500">
              This will be used in the landing page URL: /lp/{slug || 'your-slug'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this landing page"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headerText">Header Text</Label>
            <Input
              id="headerText"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="e.g., Welcome! Get Started Today"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headerSubtext">Header Subtext</Label>
            <Textarea
              id="headerSubtext"
              value={headerSubtext}
              onChange={(e) => setHeaderSubtext(e.target.value)}
              placeholder="e.g., Fill out the form below to get started"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerText">Footer Text</Label>
            <Textarea
              id="footerText"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g., By submitting, you agree to our terms"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={published}
              onCheckedChange={(checked) => setPublished(checked === true)}
            />
            <Label htmlFor="published" className="cursor-pointer">
              Publish landing page (make it publicly accessible)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || forms.length === 0}>
              {loading ? 'Saving...' : landingPage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
