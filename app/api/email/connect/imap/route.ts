import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret } from '@/lib/email/crypto'

const MIN_PORT = 1
const MAX_PORT = 65535

function parseBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1) return true
  return false
}

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

  const raw = body as {
    email?: string
    imapHost?: string
    imapPort?: number
    imapSecure?: unknown
    smtpHost?: string
    smtpPort?: number
    smtpSecure?: unknown
    username?: string
    password?: string
  }

  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  const imapHost = typeof raw.imapHost === 'string' ? raw.imapHost.trim() : ''
  const imapPort = Number(raw.imapPort)
  const imapSecure = parseBool(raw.imapSecure)
  const smtpHost = typeof raw.smtpHost === 'string' ? raw.smtpHost.trim() : ''
  const smtpPort = Number(raw.smtpPort)
  const smtpSecure = parseBool(raw.smtpSecure)
  const username = typeof raw.username === 'string' ? raw.username.trim() : ''
  const password = typeof raw.password === 'string' ? raw.password : ''

  if (
    !email ||
    !imapHost ||
    !smtpHost ||
    !username ||
    !password
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (
    !Number.isInteger(imapPort) ||
    imapPort < MIN_PORT ||
    imapPort > MAX_PORT
  ) {
    return NextResponse.json(
      { error: `IMAP port must be between ${MIN_PORT} and ${MAX_PORT}` },
      { status: 400 }
    )
  }

  if (
    !Number.isInteger(smtpPort) ||
    smtpPort < MIN_PORT ||
    smtpPort > MAX_PORT
  ) {
    return NextResponse.json(
      { error: `SMTP port must be between ${MIN_PORT} and ${MAX_PORT}` },
      { status: 400 }
    )
  }

  // Validate IMAP credentials before saving
  const imapClient = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: imapSecure,
    auth: { user: username, pass: password },
  })
  try {
    await imapClient.connect()
    try {
      const lock = await imapClient.getMailboxLock('INBOX')
      lock.release()
    } finally {
      await imapClient.logout().catch(() => {})
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'IMAP connection failed'
    return NextResponse.json(
      { error: `Could not connect to IMAP: ${message}` },
      { status: 400 }
    )
  }

  try {
    const usernameEnc = encryptSecret(username)
    const passwordEnc = encryptSecret(password)

    const { error } = await supabase.from('mailbox_accounts').insert({
      user_id: user.id,
      email_address: email,
      display_name: user.user_metadata?.full_name || null,
      provider: 'imap_smtp',
      imap_host: imapHost,
      imap_port: imapPort,
      imap_tls: imapSecure,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_secure: smtpSecure,
      username_enc: usernameEnc,
      password_enc: passwordEnc,
      status: 'connected',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('IMAP connect error', err)
    if (err instanceof Error && err.message.includes('EMAIL_ENCRYPTION_KEY')) {
      return NextResponse.json(
        { error: 'Server encryption is not configured. Set EMAIL_ENCRYPTION_KEY.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Failed to save mailbox account' }, { status: 500 })
  }
}

