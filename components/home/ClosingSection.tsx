'use client'

import Link from 'next/link'
import { useIntersection } from '@/hooks/useIntersection'

interface ClosingSectionProps {
  isOwner: boolean
}

export function ClosingSection({ isOwner }: ClosingSectionProps) {
  const { ref, isVisible } = useIntersection()

  const primaryClasses = isOwner
    ? 'bg-gold text-[var(--krm-navy)] border-gold hover:bg-gold-light'
    : 'bg-[var(--krm-navy)] text-[var(--krm-off-white)] border-[var(--krm-navy)] hover:bg-[var(--krm-gold)] hover:text-[var(--krm-navy)]'

  const demoHref = '/login?demo=1'

  return (
    <section
      ref={ref as any}
      className={`py-grid-3 border-t border-[var(--border)] ${
        isVisible ? 'animate-fade-up' : 'opacity-0'
      }`}
      id="schedule-walkthrough"
    >
      <div className="space-y-grid">
        <div>
          <h2 className="text-sm font-mono tracking-[0.18em] uppercase text-[var(--krm-slate)] mb-2">
            Section 8
          </h2>
          <h3 className="text-2xl md:text-3xl font-[var(--font-bebas)] tracking-[0.18em] text-[var(--krm-navy)]">
            KRM™ BUILT IN THE BAHAMAS. STRUCTURED FOR SERIOUS BUSINESS.
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={demoHref}
            className={`inline-flex items-center justify-center rounded-[3px] border px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase transition-colors ${primaryClasses}`}
          >
            Explore demo
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[3px] border border-[var(--krm-navy)] px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-[var(--krm-navy)] hover:bg-[var(--krm-navy)] hover:text-[var(--krm-off-white)] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}

