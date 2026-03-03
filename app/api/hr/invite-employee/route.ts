import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // This will surface clearly in server logs if misconfigured
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Ensure caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Ensure caller is admin/owner in their org
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    if (!['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const employeeId: string | undefined = body?.employeeId

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
    }

    // Load employee to invite and ensure same organization
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, email, first_name, last_name, organization_id')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (!employee.email) {
      return NextResponse.json({ error: 'Employee is missing an email address' }, { status: 400 })
    }

    const fullName = `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() || null

    // Send an invite email (Supabase will handle email sending)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      employee.email,
      {
        data: fullName ? { full_name: fullName } : undefined,
      }
    )

    let authUser = inviteData?.user

    // If the user already exists, Supabase returns an error and does NOT send a new invite.
    // In that case, link the existing auth.user to this employee and report alreadyRegistered=true.
    if (inviteError && inviteError.message?.toLowerCase().includes('already')) {
      const { data: usersResult, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      })

      if (listError) {
        return NextResponse.json({ error: listError.message }, { status: 500 })
      }

      authUser = usersResult.users.find((u) => u.email?.toLowerCase() === employee.email.toLowerCase()) ?? null

      if (!authUser) {
        return NextResponse.json({ error: 'Existing user not found for this email' }, { status: 500 })
      }
    } else if (inviteError || !authUser) {
      return NextResponse.json({ error: inviteError?.message ?? 'Failed to invite user' }, { status: 500 })
    }

    // Link the auth user to the organization and employee in user_profiles.
    // Role must be one of the CHECK-constrained values; we use 'user' and
    // distinguish employee sub-accounts via the employee_id foreign key.
    const { error: upsertError } = await supabaseAdmin.from('user_profiles').upsert(
      {
        id: authUser.id,
        full_name: fullName ?? authUser.email?.split('@')[0] ?? 'Employee',
        role: 'user',
        organization_id: employee.organization_id,
        employee_id: employee.id,
        is_active: true,
      },
      { onConflict: 'id' }
    )

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, alreadyRegistered: !!(inviteError && inviteError.message?.toLowerCase().includes('already')) })
  } catch (error) {
    console.error('Error inviting employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

