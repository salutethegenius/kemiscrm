"use client"

import { useIntersection } from "@/hooks/use-intersection"
import { Check, ArrowRight } from "lucide-react"

const tiers = [
  {
    name: "Business License",
    description: "For single Bahamian businesses formalizing operations.",
    price: "399",
    renewalPrice: "129",
    features: [
      "Core CRM for contacts, companies & deals",
      "Pipeline board for work from first touch to close",
      "Tasks & calendar for follow-ups and reminders",
      "Basic invoicing to track who owes what",
      "Single business coverage (one company or location)",
      "Data ownership with easy export if you leave",
    ],
    footer:
      "For Bahamian businesses that want discipline and visibility without monthly SaaS bills.",
    highlighted: false,
  },
  {
    name: "Organization License",
    description: "For firms with branches, departments, or client accounts.",
    price: "799",
    renewalPrice: "269",
    features: [
      "Everything in Business License",
      "Sub-accounts and branches for multi-entity management",
      "Advanced invoicing and accounting overview",
      "HR & time tracking for teams",
      "Advanced permissions across roles and departments",
      "Compliance suite with audit logging",
      "White-label option and priority onboarding",
    ],
    footer: "For firms that need structure across multiple teams, locations, or client books.",
    highlighted: true,
  },
]

const addOns = [
  {
    name: "Bahamas Compliant Payroll Pack",
    price: "249",
    description:
      "Payroll that de-risks Bahamian compliance: automate NIB, generate local bank files, and standardize local deductions so every pay run lines up with local requirements.",
  },
  {
    name: "Finance & Billing Pack",
    price: "99",
    description: "Advanced invoicing options, templates, and deeper accounting dashboards.",
  },
  {
    name: "People & HR Pack",
    price: "99",
    description: "HR records, leave tracking, time tracking, and basic performance notes.",
  },
  {
    name: "Compliance & Audit Pack",
    price: "99",
    description: "Compliance workflows, detailed audit trails, and export/deletion tooling.",
  },
  {
    name: "Branding & White-Label Pack",
    price: "199",
    description: "Custom branding, logo, and white-label options for client-facing firms.",
  },
  {
    name: "More modules coming soon",
    price: "—",
    description:
      "We’re expanding KRM with additional modules like Inventory, Projects, and Client Portal tuned for Bahamian operators.",
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
              KRM licenses for Bahamian operators
            </h2>
          </div>

          <p className={`mb-16 max-w-xl text-sm leading-relaxed text-muted-foreground ${isVisible ? "animate-fade-up delay-100" : "opacity-0"}`}>
            {
              "Annual licenses, not rent. Built to empower Bahamian businesses with clear pricing and data you always control."
            }
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
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

                <div className="mb-8 space-y-1">
                  <div>
                    <span className="text-sm text-muted-foreground">BSD </span>
                    <span className="font-heading text-3xl font-bold text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground"> / first year license</span>
                  </div>
                  {tier.renewalPrice && (
                    <p className="text-xs text-muted-foreground">
                      Future years (optional): BSD {tier.renewalPrice}/year for updates & support.
                    </p>
                  )}
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

          {addOns.length > 0 && (
            <div
              className={`mt-12 max-w-3xl ${
                isVisible ? "animate-fade-up delay-150" : "opacity-0"
              }`}
            >
              <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                Optional module packs
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add depth where you need it, without forcing extra modules on every business.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {addOns.map((pack) => (
                  <div
                    key={pack.name}
                    className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)]/60 p-5 text-sm"
                  >
                    <div className="flex items-baseline justify-between">
                      <div>
                        <h4 className="font-heading text-xs font-semibold tracking-widest uppercase text-foreground">
                          {pack.name}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pack.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                          BSD
                        </span>
                        <span className="font-heading text-xl font-bold text-foreground">
                          {pack.price}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          / year
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p
            className={`mt-10 max-w-xl text-xs leading-relaxed text-muted-foreground ${
              isVisible ? "animate-fade-up delay-200" : "opacity-0"
            }`}
          >
            Year 1 covers your full license, setup, and support. From year 2 onward, you can choose
            to renew at roughly one-third of the license price for ongoing updates and support. If
            you don&apos;t renew, you keep your system and can export all of your data at any time.
          </p>
        </div>
      </div>
    </section>
  )
}
