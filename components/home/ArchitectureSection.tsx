'use client'

import { useIntersection } from '@/hooks/useIntersection'

const items = [
  'Next.js 14',
  'Supabase (Postgres + Auth)',
  'Row-Level Security',
  'Multi-tenant isolation',
  'Encrypted credentials',
]

export function ArchitectureSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section
      ref={ref as any}
      className={`py-grid-3 border-t border-[var(--border)] ${
        isVisible ? 'animate-fade-up' : 'opacity-0'
      }`}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-mono tracking-[0.18em] uppercase text-[var(--krm-slate)] mb-2">
            Section 5
          </h2>
          <h3 className="text-2xl md:text-3xl font-[var(--font-bebas)] tracking-[0.18em] text-[var(--krm-navy)]">
            Built on modern infrastructure
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-[3px] border border-[var(--border)] bg-white/70 px-3 py-2 text-xs font-mono tracking-[0.08em] text-[var(--krm-slate)]"
            >
              {item}
            </span>
          ))}
        </div>
        <p className="text-sm text-[var(--krm-slate)]">
          Enterprise-grade logic. Local sovereignty.
        </p>
      </div>
    </section>
  )
}

