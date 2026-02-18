import { NextRequest, NextResponse } from 'next/server'
import { subDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret } from '@/lib/email/crypto'
import { buildGmailClient, refreshAccessToken } from '@/lib/email/providers/gmail'
import { fetchRecentMessages } from '@/lib/email/providers/imap'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { mailboxAccountId } = body as { mailboxAccountId?: string }
  if (!mailboxAccountId) {
    return NextResponse.json({ error: 'Missing mailboxAccountId' }, { status: 400 })
  }

  const { data: account, error: accountError } = await supabase
    .from('mailbox_accounts')
    .select('*')
    .eq('id', mailboxAccountId)
    .eq('user_id', user.id)
    .single()

  if (accountError || !account) {
    return NextResponse.json({ error: 'Mailbox account not found' }, { status: 404 })
  }

  const historyDays =
    typeof account.history_backfill_days === 'number' && account.history_backfill_days > 0
      ? account.history_backfill_days
      : 30
  const since = subDays(new Date(), historyDays)

  const { data: syncRunRow } = await supabase
    .from('mailbox_sync_runs')
    .insert({
      mailbox_account_id: account.id,
      sync_type: 'initial',
      from_ts: since.toISOString(),
      to_ts: new Date().toISOString(),
      status: 'running',
    })
    .select('id')
    .single()

  const syncRunId = syncRunRow?.id

  try {
    if (account.provider === 'gmail') {
      let accessTokenEnc: string = account.access_token_enc
      let tokenExpiresAt: Date | null = account.token_expires_at
        ? new Date(account.token_expires_at as string)
        : null

      if ((!accessTokenEnc || !tokenExpiresAt) && account.refresh_token_enc) {
        const refreshed = await refreshAccessToken(account.refresh_token_enc)
        accessTokenEnc = refreshed.accessTokenEnc
        tokenExpiresAt = refreshed.tokenExpiresAt
        await supabase
          .from('mailbox_accounts')
          .update({
            access_token_enc: accessTokenEnc,
            token_expires_at: tokenExpiresAt?.toISOString() ?? null,
          })
          .eq('id', account.id)
      }

      if (!accessTokenEnc) {
        throw new Error('No Gmail access token available for sync')
      }

      const accessToken = decryptSecret(accessTokenEnc)
      const refreshToken =
        account.refresh_token_enc && typeof account.refresh_token_enc === 'string'
          ? decryptSecret(account.refresh_token_enc)
          : ''
      const gmail = buildGmailClient(accessToken, refreshToken)

      const q = `newer_than:${historyDays}d`
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q,
        maxResults: 50,
      })

      const messages = listRes.data.messages || []
      for (const m of messages) {
        if (!m.id) continue
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: m.id,
        })
        const msg = full.data
        const headers = msg.payload?.headers || []
        const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || ''
        const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || ''
        const to = headers.find((h) => h.name?.toLowerCase() === 'to')?.value || ''
        const dateHeader =
          headers.find((h) => h.name?.toLowerCase() === 'date')?.value ||
          (msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : null)

        const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : null
        const snippet = msg.snippet || ''

        await supabase.from('mailbox_messages').upsert(
          {
            mailbox_account_id: account.id,
            user_id: user.id,
            direction: 'incoming',
            provider_message_id: msg.id,
            provider_thread_id: msg.threadId || null,
            from_address: from,
            to_addresses: to,
            subject,
            snippet,
            received_at: receivedAt,
          },
          {
            onConflict: 'mailbox_account_id,provider_message_id',
          } as any
        )
      }
    } else if (account.provider === 'imap_smtp') {
      const imapMessages = await fetchRecentMessages(
        {
          host: account.imap_host as string,
          port: account.imap_port as number,
          secure: Boolean(account.imap_tls),
          usernameEnc: account.username_enc as string,
          passwordEnc: account.password_enc as string,
        },
        since
      )

      for (const m of imapMessages) {
        await supabase.from('mailbox_messages').upsert(
          {
            mailbox_account_id: account.id,
            user_id: user.id,
            direction: 'incoming',
            provider_message_id: m.providerMessageId,
            from_address: m.from,
            to_addresses: m.to,
            subject: m.subject,
            snippet: m.snippet,
            received_at: m.date.toISOString(),
          },
          {
            onConflict: 'mailbox_account_id,provider_message_id',
          } as any
        )
      }
    }

    await supabase
      .from('mailbox_accounts')
      .update({
        last_synced_at: new Date().toISOString(),
        last_history_synced_at: new Date().toISOString(),
      })
      .eq('id', account.id)

    if (syncRunId) {
      await supabase
        .from('mailbox_sync_runs')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
        })
        .eq('id', syncRunId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Initial sync error', err)
    if (syncRunId) {
      await supabase
        .from('mailbox_sync_runs')
        .update({
          status: 'error',
          error_message: (err as Error).message,
          finished_at: new Date().toISOString(),
        })
        .eq('id', syncRunId)
    }
    return NextResponse.json({ error: 'Initial sync failed' }, { status: 500 })
  }
}

