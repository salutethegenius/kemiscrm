import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/email/providers/gmail'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?email_error=missing_code', process.env.NEXT_PUBLIC_APP_URL)
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== state) {
    return NextResponse.redirect(
      new URL('/settings?email_error=unauthorized', process.env.NEXT_PUBLIC_APP_URL)
    )
  }

  try {
    const tokenInfo = await exchangeCodeForTokens(code)

    const { error } = await supabase.from('mailbox_accounts').insert({
      user_id: user.id,
      email_address: tokenInfo.email || user.email || '',
      display_name: user.user_metadata?.full_name || null,
      provider: 'gmail',
      provider_account_id: tokenInfo.providerAccountId || null,
      access_token_enc: tokenInfo.accessTokenEnc,
      refresh_token_enc: tokenInfo.refreshTokenEnc,
      token_expires_at: tokenInfo.tokenExpiresAt?.toISOString() ?? null,
      status: 'connected',
    })

    if (error) {
      return NextResponse.redirect(
        new URL('/settings?email_error=save_failed', process.env.NEXT_PUBLIC_APP_URL)
      )
    }

    return NextResponse.redirect(
      new URL('/settings?email_connected=gmail', process.env.NEXT_PUBLIC_APP_URL)
    )
  } catch (err) {
    console.error('Gmail callback error', err)
    return NextResponse.redirect(
      new URL('/settings?email_error=gmail_oauth_failed', process.env.NEXT_PUBLIC_APP_URL)
    )
  }
}

