import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { Contact } from '@/lib/types'
import { formatDate } from '@/lib/utils'

type PageProps = {
  params: { id: string }
}

export default async function ContactDetailPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .single<Contact>()

  if (error || !contact) {
    notFound()
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/contacts">&larr; Back to contacts</Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
            {contact.name}
          </h1>
        </div>
        {contact.status && (
          <Badge variant="secondary" className="capitalize">
            {contact.status}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {contact.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{contact.name}</CardTitle>
            <p className="text-sm text-gray-500">
              Added {formatDate(contact.created_at)}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Email
              </p>
              <p className="text-sm text-gray-900 break-all">
                {contact.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Phone
              </p>
              <p className="text-sm text-gray-900">
                {contact.phone || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Company
              </p>
              <p className="text-sm text-gray-900">
                {contact.company || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Source
              </p>
              <p className="text-sm text-gray-900 capitalize">
                {contact.source || 'manual'}
              </p>
            </div>
          </div>

          {contact.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Notes
              </p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {contact.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
