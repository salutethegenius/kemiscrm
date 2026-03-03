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
      .then(async ({ error }) => {
        if (error) return

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('employee_id')
          .eq('id', user.id)
          .single()

        const targetPath = profile?.employee_id ? '/hr/portal' : '/dashboard'

        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        router.push(targetPath)
      })
  }, [router])

  return null
}
