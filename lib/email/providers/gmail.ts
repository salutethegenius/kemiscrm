import { google } from 'googleapis'
import { encryptSecret, decryptSecret } from '../crypto'

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
]

function getOAuthClient() {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET
  const redirectUri = process.env.GMAIL_OAUTH_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Gmail OAuth environment variables are not fully configured')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getGmailAuthUrl(state: string) {
  const oauth2Client = getOAuthClient()
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
    state,
  })
  return url
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Gmail OAuth did not return expected tokens')
  }
  const idTokenPayload = tokens.id_token
    ? (JSON.parse(
        Buffer.from(tokens.id_token.split('.')[1], 'base64').toString('utf8')
      ) as { email?: string; sub?: string })
    : {}

  return {
    email: idTokenPayload.email || '',
    providerAccountId: idTokenPayload.sub || '',
    accessTokenEnc: encryptSecret(tokens.access_token),
    refreshTokenEnc: encryptSecret(tokens.refresh_token),
    tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  }
}

export function buildGmailClient(accessToken: string, refreshToken: string) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export async function refreshAccessToken(
  refreshTokenEnc: string
): Promise<{ accessTokenEnc: string; tokenExpiresAt: Date | null }> {
  const refreshToken = decryptSecret(refreshTokenEnc)
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  if (!credentials.access_token) {
    throw new Error('Failed to refresh Gmail access token')
  }
  return {
    accessTokenEnc: encryptSecret(credentials.access_token),
    tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  }
}

