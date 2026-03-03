import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { ModulesSection } from "@/components/modules-section"
import { WhyLocalSection } from "@/components/why-local-section"
import { InfrastructureSection } from "@/components/infrastructure-section"
import { PricingSection } from "@/components/pricing-section"
import { OutcomesSection } from "@/components/outcomes-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <ModulesSection />
      <WhyLocalSection />
      <InfrastructureSection />
      <PricingSection />
      <OutcomesSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
