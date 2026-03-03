'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function InviteTokenHandler() {
  const router = useRouter()

  useEffect(() => {
    // Supabase invite links redirect with auth data in the URL hash:
    // #access_token=...&refresh_token=...&type=invite
    const { hash } = window.location
    if (!hash || !hash.includes('access_token')) return

    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (!access_token || !refresh_token) return

    const supabase = createClient()

    supabase.auth
      .setSession({
        access_token,
        refresh_token,
      })
      .then(({ error }) => {
        if (!error) {
          // Clean up the URL and send the user to the dashboard
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
          router.push('/dashboard')
        }
      })
  }, [router])

  return null
}
