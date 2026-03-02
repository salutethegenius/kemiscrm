"use client"

import { useIntersection } from "@/hooks/use-intersection"
import { Check, ArrowRight } from "lucide-react"

const tiers = [
  {
    name: "Operator",
    description: "For structured teams starting discipline.",
    price: "$149",
    features: [
      "CRM",
      "Pipeline board",
      "Tasks & calendar",
      "Basic invoicing",
      "Role permissions (limited)",
    ],
    footer: "For businesses formalizing workflow.",
    highlighted: false,
  },
  {
    name: "Manager",
    description: "For growing companies with multiple departments.",
    price: "$349",
    features: [
      "Everything in Operator",
      "Advanced invoicing",
      "HR & time tracking",
      "Accounting overview",
      "Email integration",
      "Expanded role controls",
    ],
    footer: "For companies requiring internal visibility.",
    highlighted: true,
  },
  {
    name: "Owner",
    description: "Full operating authority.",
    price: "$749",
    features: [
      "Everything in Manager",
      "Sub-accounts",
      "Compliance suite",
      "Audit logging",
      "Data export & deletion tools",
      "White-label option",
      "Priority onboarding",
    ],
    footer: "For firms managing departments, subsidiaries, or client accounts.",
    highlighted: false,
  },
]

export function PricingSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={ref}>
          <div className={`mb-6 max-w-2xl ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
              <span className="h-px w-8 bg-[var(--landing-border)]" />
              Section 6
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              KRM structure tiers
            </h2>
          </div>

          <p className={`mb-16 max-w-xl text-sm leading-relaxed text-muted-foreground ${isVisible ? "animate-fade-up delay-100" : "opacity-0"}`}>
            {'Positioned by responsibility, not size. No "Basic / Pro / Premium" \u2014 tiers are aligned to authority.'}
          </p>

          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden rounded-2xl border p-8 transition-all duration-500 hover:shadow-xl ${
                  tier.highlighted
                    ? "border-accent bg-[var(--landing-card)] shadow-lg shadow-accent/5"
                    : "border-[var(--landing-border)] bg-[var(--landing-card)] hover:border-accent/30"
                } ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: isVisible ? `${(i + 1) * 150}ms` : undefined }}
              >
                {tier.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
                )}

                <div className="mb-6">
                  <h3 className="font-heading text-xs font-bold tracking-widest uppercase text-muted-foreground">
                    {tier.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-8">
                  <span className="text-sm text-muted-foreground">Starting at BSD </span>
                  <span className="font-heading text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground"> / month</span>
                </div>

                <div className="space-y-3">
                  {tier.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                        tier.highlighted ? "bg-accent/20" : "bg-secondary"
                      }`}>
                        <Check className={`h-3 w-3 ${tier.highlighted ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-[var(--landing-border)] pt-6">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {tier.footer}
                  </p>
                </div>

                <a
                  href="#cta"
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                    tier.highlighted
                      ? "bg-accent text-accent-foreground hover:shadow-lg hover:shadow-accent/20"
                      : "border border-[var(--landing-border)] bg-secondary text-foreground hover:border-accent/40 hover:bg-accent/5"
                  }`}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
