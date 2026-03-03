import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HrPortalPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('employee_id, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.employee_id) {
    redirect('/dashboard')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position, department:departments(name)')
    .eq('id', profile.employee_id)
    .single()

  const { data: recentTimeEntries } = await supabase
    .from('time_entries')
    .select('id, date, total_hours, status')
    .eq('employee_id', profile.employee_id)
    .order('date', { ascending: false })
    .limit(5)

  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('id, leave_type, start_date, end_date, status')
    .eq('employee_id', profile.employee_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentPayrollLines } = await supabase
    .from('payroll_lines')
    .select('id, net_pay, payroll_runs ( id, period_start, period_end, pay_date, status )')
    .eq('employee_id', profile.employee_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const displayName =
    employee?.first_name && employee?.last_name
      ? `${employee.first_name} ${employee.last_name}`
      : profile.full_name || user.email || 'Employee'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Employee Portal</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {displayName}. View your time, leave, and HR info in one place.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl bg-white shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">Your basic employment details.</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{displayName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Position</dt>
              <dd className="font-medium">{employee?.position || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Department</dt>
              <dd className="font-medium">
                {(employee as any)?.department?.name || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium break-all">{user.email}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl bg-white shadow-sm border p-6 space-y-3">
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <p className="text-sm text-muted-foreground">
            Jump to your most common HR tasks.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <a href="/hr/time?me=1" className="text-primary hover:underline">
              View my time entries
            </a>
            <a href="/hr/time?me=1#request-leave" className="text-primary hover:underline">
              Request leave
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-white shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Time Entries</h2>
            <a href="/hr/time?me=1" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-2 text-sm">
            {recentTimeEntries && recentTimeEntries.length > 0 ? (
              recentTimeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {entry.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {entry.total_hours != null ? Number(entry.total_hours).toFixed(2) : '0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground">hours</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No time entries yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Leave Requests</h2>
            <a href="/hr/time?me=1#leave-requests" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-2 text-sm">
            {leaveRequests && leaveRequests.length > 0 ? (
              leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="font-medium capitalize">{request.leave_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.start_date).toLocaleDateString()} —{' '}
                      {new Date(request.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wide">
                    {request.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No leave requests yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Pay</h2>
            <span className="text-xs text-muted-foreground">Net pay by period</span>
          </div>
          <div className="space-y-2 text-sm">
            {recentPayrollLines && recentPayrollLines.length > 0 ? (
              recentPayrollLines.map((line: any) => {
                const run = line.payroll_runs?.[0] ?? line.payroll_runs
                const periodLabel =
                  run?.period_start && run?.period_end
                    ? `${new Date(run.period_start).toLocaleDateString()} — ${new Date(
                        run.period_end
                      ).toLocaleDateString()}`
                    : 'Pay period'

                return (
                  <div
                    key={line.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{periodLabel}</p>
                      {run?.pay_date && (
                        <p className="text-xs text-muted-foreground">
                          Pay date: {new Date(run.pay_date).toLocaleDateString()}
                        </p>
                      )}
                      {run?.status && (
                        <p className="text-xs text-muted-foreground capitalize">
                          Status: {run.status.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${Number(line.net_pay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">net pay</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No payroll history yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

