'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

type MailboxAccount = {
  id: string
  email_address: string
  provider: string
}

type MailboxMessage = {
  id: string
  subject: string | null
  from_address: string | null
  to_addresses: string | null
  snippet: string | null
  received_at: string | null
}

export default function EmailPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>([])
  const [selectedMailboxId, setSelectedMailboxId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MailboxMessage[]>([])
  const [loadingMailboxes, setLoadingMailboxes] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoadingMailboxes(true)
      const { data: mailboxRows } = await supabase
        .from('mailbox_accounts')
        .select('id, email_address, provider')
        .order('created_at', { ascending: true })
      const list =
        (mailboxRows || []).map((m) => ({
          id: m.id as string,
          email_address: m.email_address as string,
          provider: m.provider as string,
        })) ?? []
      setMailboxes(list)
      setSelectedMailboxId(list[0]?.id ?? null)
      setLoadingMailboxes(false)
    }
    load()
  }, [supabase])

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedMailboxId) {
        setMessages([])
        return
      }
      setLoadingMessages(true)
      const { data: rows } = await supabase
        .from('mailbox_messages')
        .select('id, subject, from_address, to_addresses, snippet, received_at')
        .eq('mailbox_account_id', selectedMailboxId)
        .order('received_at', { ascending: false })
        .limit(50)

      setMessages(
        (rows || []).map((m) => ({
          id: m.id as string,
          subject: (m.subject as string | null) ?? null,
          from_address: (m.from_address as string | null) ?? null,
          to_addresses: (m.to_addresses as string | null) ?? null,
          snippet: (m.snippet as string | null) ?? null,
          received_at: (m.received_at as string | null) ?? null,
        }))
      )
      setLoadingMessages(false)
    }
    loadMessages()
  }, [selectedMailboxId, supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMailboxId) {
      toast({
        title: 'Select mailbox',
        description: 'Please select a mailbox to send from.',
        variant: 'destructive',
      })
      return
    }
    if (!composeTo || !composeSubject) {
      toast({
        title: 'Missing fields',
        description: 'To and subject are required.',
        variant: 'destructive',
      })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailboxAccountId: selectedMailboxId,
          to: composeTo,
          subject: composeSubject,
          html: composeBody || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to send email')
      }
      toast({ title: 'Email sent', description: 'Your email has been sent.' })
      setComposeTo('')
      setComposeSubject('')
      setComposeBody('')
      // Reload messages to include the sent one
      const { data: rows } = await supabase
        .from('mailbox_messages')
        .select('id, subject, from_address, to_addresses, snippet, received_at')
        .eq('mailbox_account_id', selectedMailboxId)
        .order('received_at', { ascending: false })
        .limit(50)
      setMessages(
        (rows || []).map((m) => ({
          id: m.id as string,
          subject: (m.subject as string | null) ?? null,
          from_address: (m.from_address as string | null) ?? null,
          to_addresses: (m.to_addresses as string | null) ?? null,
          snippet: (m.snippet as string | null) ?? null,
          received_at: (m.received_at as string | null) ?? null,
        }))
      )
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      })
    }
    setSending(false)
  }

  const handleSyncNow = async () => {
    if (!selectedMailboxId) return
    toast({ title: 'Syncing', description: 'Triggering incremental sync...' })
    await fetch('/api/email/sync/incremental', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mailboxAccountId: selectedMailboxId }),
    })
    const { data: rows } = await supabase
      .from('mailbox_messages')
      .select('id, subject, from_address, to_addresses, snippet, received_at')
      .eq('mailbox_account_id', selectedMailboxId)
      .order('received_at', { ascending: false })
      .limit(50)
    setMessages(
      (rows || []).map((m) => ({
        id: m.id as string,
        subject: (m.subject as string | null) ?? null,
        from_address: (m.from_address as string | null) ?? null,
        to_addresses: (m.to_addresses as string | null) ?? null,
        snippet: (m.snippet as string | null) ?? null,
        received_at: (m.received_at as string | null) ?? null,
      }))
    )
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col p-4 md:p-6 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Email</h1>
          <p className="text-sm text-gray-500">
            View recent messages and send new email from your connected inbox.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleSyncNow} disabled={!selectedMailboxId}>
          Sync now
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1">
        <Card className="md:w-64 p-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Mailboxes
          </p>
          {loadingMailboxes ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : mailboxes.length === 0 ? (
            <p className="text-sm text-gray-500">
              No mailboxes connected. Connect one from Settings → Email Accounts.
            </p>
          ) : (
            mailboxes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMailboxId(m.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm border ${
                  selectedMailboxId === m.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium truncate">{m.email_address}</p>
                <p className="text-xs text-gray-500">{m.provider}</p>
              </button>
            ))
          )}
        </Card>

        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 p-3 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Recent messages
            </p>
            {loadingMessages ? (
              <p className="text-sm text-gray-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-500">
                No messages yet. Trigger a sync or send an email to see it here.
              </p>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y">
                {messages.map((m) => (
                  <div key={m.id} className="py-2 px-1 text-sm">
                    <p className="font-medium text-gray-900 truncate">
                      {m.subject || '(no subject)'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      From: {m.from_address || 'Unknown'}
                    </p>
                    {m.snippet && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{m.snippet}</p>
                    )}
                    {m.received_at && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(m.received_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Compose
            </p>
            <form onSubmit={handleSend} className="space-y-2">
              <Input
                placeholder="To"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
              />
              <Input
                placeholder="Subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
              <Textarea
                placeholder="Write your message..."
                rows={4}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={sending || !selectedMailboxId}>
                  {sending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

