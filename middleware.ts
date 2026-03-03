import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public access to the logo system
  if (pathname === '/logo' || pathname.startsWith('/logo/')) {
    return NextResponse.next()
  }

  const response = await updateSession(request)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // No-op setters: middleware auth update is handled in updateSession
        set() {},
        remove() {},
      },
    }
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return response
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('employee_id')
      .eq('id', user.id)
      .single()

    const isEmployeePortalUser = !!profile?.employee_id

    if (!isEmployeePortalUser) {
      return response
    }

    const isPortalAllowedPath =
      pathname.startsWith('/hr/portal') ||
      pathname.startsWith('/hr/time')

    if (!isPortalAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/hr/portal'
      url.search = ''
      return NextResponse.redirect(url)
    }
  } catch {
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
