"use client"

import { Navigation } from "@/components/landing/Navigation"
import { HeroSection } from "@/components/landing/HeroSection"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { ModulesSection } from "@/components/landing/ModulesSection"
import { WhyLocalSection } from "@/components/landing/WhyLocalSection"
import { InfrastructureSection } from "@/components/landing/InfrastructureSection"
import { PricingSection } from "@/components/landing/PricingSection"
import { OutcomesSection } from "@/components/landing/OutcomesSection"
import { CtaSection } from "@/components/landing/CtaSection"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="landing-scope">
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
    </div>
  )
}
