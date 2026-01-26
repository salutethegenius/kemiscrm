'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle } from 'lucide-react'
import type { LeadForm, FormField } from '@/lib/types'

export default function PublicFormPage() {
  const params = useParams()
  const formId = params.formId as string
  const [form, setForm] = useState<LeadForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function fetchForm() {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (error || !data) {
        setForm(null)
      } else {
        setForm(data)
        // Initialize form data
        const initialData: Record<string, string> = {}
        ;(data.fields as FormField[])?.forEach((field) => {
          initialData[field.id] = ''
        })
        setFormData(initialData)
      }
      setLoading(false)
    }
    fetchForm()
  }, [formId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    setSubmitting(true)

    // Create contact from form data
    const fields = form.fields as FormField[]
    const nameField = fields.find((f) => f.label.toLowerCase().includes('name'))
    const emailField = fields.find((f) => f.type === 'email' || f.label.toLowerCase().includes('email'))
    const phoneField = fields.find((f) => f.type === 'phone' || f.label.toLowerCase().includes('phone'))

    let contactId = null

    // Try to create a contact if we have name and email
    if (nameField && emailField && formData[nameField.id] && formData[emailField.id]) {
      const { data: contact } = await supabase
        .from('contacts')
        .insert([{
          name: formData[nameField.id],
          email: formData[emailField.id],
          phone: phoneField ? formData[phoneField.id] : null,
          source: 'website',
          status: 'new',
          user_id: form.user_id,
        }])
        .select()
        .single()

      if (contact) {
        contactId = contact.id
      }
    }

    // Save form submission
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

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Form not found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-500">Your submission has been received. We&apos;ll be in touch soon.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fields = form.fields as FormField[]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
          </div>
          <CardTitle className="text-center">{form.name}</CardTitle>
          <CardDescription className="text-center">Fill out the form below and we&apos;ll get back to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
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
                  />
                ) : (
                  <Input
                    id={field.id}
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
