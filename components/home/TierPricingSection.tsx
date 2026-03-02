'use client'

import { KrmGridMark } from '@/components/logo/krm-logo'
import { useIntersection } from '@/hooks/useIntersection'

type TierKey = 'operator' | 'manager' | 'owner'

const tiers: Array<{
  key: TierKey
  name: string
  label: string
  price: string
  description: string
  features: string[]
}> = [
  {
    key: 'operator',
    name: 'Operator',
    label: 'For structured teams starting discipline.',
    price: 'Starting at BSD $149 / month',
    description: 'For businesses formalizing workflow.',
    features: [
      'CRM',
      'Pipeline board',
      'Tasks & calendar',
      'Basic invoicing',
      'Role permissions (limited)',
    ],
  },
  {
    key: 'manager',
    name: 'Manager',
    label: 'For growing companies with multiple departments.',
    price: 'Starting at BSD $349 / month',
    description: 'For companies requiring internal visibility.',
    features: [
      'Everything in Operator',
      'Advanced invoicing',
      'HR & time tracking',
      'Accounting overview',
      'Email integration',
      'Expanded role controls',
    ],
  },
  {
    key: 'owner',
    name: 'Owner',
    label: 'Full operating authority.',
    price: 'Starting at BSD $749 / month',
    description: 'For firms managing departments, subsidiaries, or client accounts.',
    features: [
      'Everything in Manager',
      'Sub-accounts',
      'Compliance suite',
      'Audit logging',
      'Data export & deletion tools',
      'White-label option',
      'Priority onboarding',
    ],
  },
]

export function TierPricingSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section
      ref={ref as any}
      className={`py-grid-3 border-t border-[var(--border)] ${
        isVisible ? 'animate-fade-up' : 'opacity-0'
      }`}
    >
      <div className="mb-grid-2 max-w-xl">
        <h2 className="text-sm font-mono tracking-[0.18em] uppercase text-[var(--krm-slate)] mb-2">
          Section 6
        </h2>
        <h3 className="text-2xl md:text-3xl font-[var(--font-bebas)] tracking-[0.18em] text-[var(--krm-navy)]">
          KRM structure tiers
        </h3>
        <p className="mt-2 text-sm text-[var(--krm-slate)]">
          Positioned by responsibility, not size. No “Basic / Pro / Premium” — tiers are
          aligned to authority.
        </p>
      </div>
      <div className="grid gap-grid md:grid-cols-3">
        {tiers.map((tier) => {
          const isOwner = tier.key === 'owner'
          return (
            <div
              key={tier.key}
              className={`flex flex-col rounded-[3px] border bg-white/85 p-5 shadow-sm ${
                isOwner
                  ? 'border-gold shadow-[0_0_0_1px_rgba(196,171,120,0.35)]'
                  : 'border-[var(--border)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-mono tracking-[0.18em] uppercase text-[var(--krm-slate)]">
                    {tier.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--krm-slate)]">{tier.label}</p>
                </div>
                {isOwner && (
                  <div className="shrink-0">
                    <KrmGridMark variant="light" size={36} />
                  </div>
                )}
              </div>
              <p className="mb-3 text-sm font-medium text-[var(--krm-navy)]">
                {tier.price}
              </p>
              <ul className="mb-3 flex-1 space-y-1 text-sm text-[var(--krm-slate)]">
                {tier.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-[var(--krm-slate)]">{tier.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

