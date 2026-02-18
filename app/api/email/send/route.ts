import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret } from '@/lib/email/crypto'
import { buildGmailClient, refreshAccessToken } from '@/lib/email/providers/gmail'
import { sendSmtpEmail } from '@/lib/email/providers/smtp'

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

  const { mailboxAccountId, to, subject, text, html } = body as {
    mailboxAccountId?: string
    to?: string
    subject?: string
    text?: string
    html?: string
  }

  if (!mailboxAccountId || !to || !subject) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

  try {
    if (account.provider === 'gmail') {
      let accessTokenEnc: string = account.access_token_enc
      let tokenExpiresAt: Date | null = account.token_expires_at
        ? new Date(account.token_expires_at as string)
        : null

      if (!accessTokenEnc && account.refresh_token_enc) {
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

      const now = Date.now()
      if (
        accessTokenEnc &&
        tokenExpiresAt &&
        tokenExpiresAt.getTime() - now < 60 * 1000 &&
        account.refresh_token_enc
      ) {
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
        return NextResponse.json(
          { error: 'No valid Gmail access token available' },
          { status: 400 }
        )
      }

      const accessToken = decryptSecret(accessTokenEnc)
      const refreshToken =
        account.refresh_token_enc && typeof account.refresh_token_enc === 'string'
          ? decryptSecret(account.refresh_token_enc)
          : ''
      const gmail = buildGmailClient(accessToken, refreshToken)

      const from = account.email_address as string
      const messageParts = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html || text || '',
      ]
      const message = messageParts.join('\n')
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      })
    } else if (account.provider === 'imap_smtp') {
      await sendSmtpEmail(
        {
          host: account.smtp_host as string,
          port: account.smtp_port as number,
          secure: Boolean(account.smtp_secure),
          usernameEnc: account.username_enc as string,
          passwordEnc: account.password_enc as string,
          fromAddress: account.email_address as string,
        },
        { to, subject, text, html }
      )
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
    }

    // Persist sent message record (simplified, without thread linkage for now)
    await supabase.from('mailbox_messages').insert({
      mailbox_account_id: account.id,
      user_id: user.id,
      direction: 'outgoing',
      to_addresses: to,
      from_address: account.email_address,
      subject,
      body_text: text || null,
      body_html: html || null,
      sent_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      is_read: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Send email error', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

