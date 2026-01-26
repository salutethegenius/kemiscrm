'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Contact } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  new: 'default',
  contacted: 'secondary',
  qualified: 'warning',
  converted: 'success',
  lost: 'destructive',
}

export function RecentContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchContacts() {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setContacts(data || [])
      setLoading(false)
    }
    fetchContacts()
  }, [])

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading...</div>
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No contacts yet.</p>
        <Link href="/contacts" className="text-blue-600 hover:underline mt-2 inline-block">
          Add your first contact
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact) => (
        <Link
          key={contact.id}
          href={`/contacts/${contact.id}`}
          className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Avatar>
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {contact.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{contact.name}</p>
            <p className="text-sm text-gray-500 truncate">{contact.email}</p>
          </div>
          <div className="text-right">
            <Badge variant={statusColors[contact.status]}>{contact.status}</Badge>
            <p className="text-xs text-gray-400 mt-1">{formatDate(contact.created_at)}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
