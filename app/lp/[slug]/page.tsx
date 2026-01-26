'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import type { LandingPage, LeadForm, FormField } from '@/lib/types'

export default function PublicLandingPage() {
  const params = useParams()
  const slug = params.slug as string
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null)
  const [form, setForm] = useState<LeadForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (!slug) return

    const fetchLandingPage = async () => {
      const { data: page, error: pageError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (pageError || !page) {
        setLoading(false)
        return
      }

      setLandingPage(page)

      if (page.form_id) {
        const { data: formData, error: formError } = await supabase
          .from('lead_forms')
          .select('*')
          .eq('id', page.form_id)
          .single()

        if (!formError && formData) {
          setForm(formData)
          const fields = formData.fields as FormField[]
          const initialData: Record<string, string> = {}
          fields.forEach((field) => {
            initialData[field.id] = ''
          })
          setFormData(initialData)
        }
      }

      setLoading(false)
    }

    fetchLandingPage()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || !landingPage) return

    setSubmitting(true)

    const fields = form.fields as FormField[]
    const nameField = fields.find((f) => f.label.toLowerCase().includes('name'))
    const emailField = fields.find((f) => f.type === 'email' || f.label.toLowerCase().includes('email'))
    const phoneField = fields.find((f) => f.type === 'phone' || f.label.toLowerCase().includes('phone'))

    let contactId = null

    if (nameField && emailField && formData[nameField.id] && formData[emailField.id]) {
      const { data: contact } = await supabase
        .from('contacts')
        .insert([{
          name: formData[nameField.id],
          email: formData[emailField.id],
          phone: phoneField ? formData[phoneField.id] : null,
          source: 'landing_page',
          status: 'new',
          user_id: landingPage.user_id,
          organization_id: landingPage.organization_id,
        }])
        .select()
        .single()

      if (contact) {
        contactId = contact.id
      }
    }

    const { error } = await supabase.from('form_submissions').insert([{
      form_id: form.id,
      data: formData,
      contact_id: contactId,
    }])

    if (error) {
      toast({ title: 'Error', description: 'Failed to submit form. Please try again.', variant: 'destructive' })
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!landingPage || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Landing Page Not Found</h1>
          <p className="text-gray-500">This landing page doesn't exist or hasn't been published yet.</p>
        </div>
      </div>
    )
  }

  const fields = form.fields as FormField[]
  const primaryColor = landingPage.primary_color || '#3B82F6'
  const backgroundColor = landingPage.background_color || '#FFFFFF'

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {(landingPage.header_text || landingPage.header_subtext) && (
          <div className="text-center mb-12">
            {landingPage.header_text && (
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{landingPage.header_text}</h1>
            )}
            {landingPage.header_subtext && (
              <p className="text-xl text-gray-600">{landingPage.header_subtext}</p>
            )}
          </div>
        )}

        {submitted ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600">Your submission has been received. We'll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              {fields.map((field) => (
                <div key={field.id}>
                  <Label htmlFor={field.id} className="mb-2 block">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.id}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      required={field.required}
                      rows={4}
                      className="w-full"
                    />
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      required={field.required}
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>

            {landingPage.footer_text && (
              <p className="text-sm text-gray-500 text-center mt-4">{landingPage.footer_text}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
