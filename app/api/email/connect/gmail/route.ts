import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailAuthUrl } from '@/lib/email/providers/gmail'

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL))
  }

  const state = user.id
  const url = getGmailAuthUrl(state)
  return NextResponse.redirect(url)
}

