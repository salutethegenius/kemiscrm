import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import { DashboardFooter } from '@/components/dashboard-footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen md:h-screen bg-[#F5F3EE] md:overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        <div className="flex-shrink-0 relative">
          <DashboardFooter />
        </div>
      </div>
    </div>
  )
}
