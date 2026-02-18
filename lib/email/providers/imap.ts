import { ImapFlow } from 'imapflow'
import { decryptSecret } from '../crypto'

export type ImapConfig = {
  host: string
  port: number
  secure: boolean
  usernameEnc: string
  passwordEnc: string
}

export async function fetchRecentMessages(
  config: ImapConfig,
  since: Date
): Promise<
  {
    providerMessageId: string
    subject: string
    from: string
    to: string
    date: Date
    snippet: string
    bodyText: string
  }[]
> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: decryptSecret(config.usernameEnc),
      pass: decryptSecret(config.passwordEnc),
    },
  })

  await client.connect()
  try {
    const mailbox = await client.getMailboxLock('INBOX')
    try {
      const result: {
        providerMessageId: string
        subject: string
        from: string
        to: string
        date: Date
        snippet: string
        bodyText: string
      }[] = []

      const sinceStr = since.toISOString()
      for await (const msg of client.fetch(
        { since: new Date(sinceStr) },
        { envelope: true, bodyStructure: true, internalDate: true, uid: true }
      )) {
        const subject = msg.envelope?.subject || ''
        const from = msg.envelope?.from?.map((a) => a.address || '').join(', ') || ''
        const to = msg.envelope?.to?.map((a) => a.address || '').join(', ') || ''
        const date = msg.internalDate || new Date()
        const providerMessageId = String(msg.uid)

        result.push({
          providerMessageId,
          subject,
          from,
          to,
          date,
          snippet: '',
          bodyText: '',
        })
      }

      return result
    } finally {
      mailbox.release()
    }
  } finally {
    await client.logout()
  }
}

