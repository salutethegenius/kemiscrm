import { createClient } from '@/lib/supabase/server'
import { HomeHeader } from './HomeHeader'
import { HeroSection } from './HeroSection'
import { ProblemSection } from './ProblemSection'
import { ShiftSection } from './ShiftSection'
import { ModuleGridSection } from './ModuleGridSection'
import { WhyLocalSection } from './WhyLocalSection'
import { ArchitectureSection } from './ArchitectureSection'
import { TierPricingSection } from './TierPricingSection'
import { ChangesSection } from './ChangesSection'
import { ClosingSection } from './ClosingSection'

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    role = (profile as any)?.role ?? null
  }

  const isOwner = role === 'owner'
  const isAuthenticated = !!user

  return (
    <div className="min-h-screen bg-[var(--krm-off-white)] text-foreground">
      <main className="mx-auto max-w-6xl px-6 pb-grid-4 pt-grid">
        <HomeHeader isAuthenticated={isAuthenticated} />
        <div className="space-y-grid-3">
          <HeroSection isOwner={isOwner} isAuthenticated={isAuthenticated} />
          <ProblemSection />
          <ShiftSection />
          <ModuleGridSection />
          <WhyLocalSection />
          <ArchitectureSection />
          <TierPricingSection />
          <ChangesSection />
          <ClosingSection isOwner={isOwner} />
        </div>
      </main>
    </div>
  )
}

