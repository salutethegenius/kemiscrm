import nodemailer from 'nodemailer'
import { decryptSecret } from '../crypto'

export type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  usernameEnc: string
  passwordEnc: string
  fromAddress: string
}

export async function sendSmtpEmail(config: SmtpConfig, options: {
  to: string
  subject: string
  text?: string
  html?: string
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: decryptSecret(config.usernameEnc),
      pass: decryptSecret(config.passwordEnc),
    },
  })

  await transporter.sendMail({
    from: config.fromAddress,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  })
}

