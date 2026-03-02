'use client'

import Link from 'next/link'
import { useIntersection } from '@/hooks/useIntersection'
import { HeroGridVisual } from './HeroGridVisual'

interface HeroSectionProps {
  isOwner: boolean
  isAuthenticated: boolean
}

export function HeroSection({ isOwner, isAuthenticated }: HeroSectionProps) {
  const { ref, isVisible } = useIntersection()

  const primaryClasses = isOwner
    ? 'bg-gold text-[var(--krm-navy)] border-gold hover:bg-gold-light'
    : 'bg-[var(--krm-navy)] text-[var(--krm-off-white)] border-[var(--krm-navy)] hover:bg-[var(--krm-gold)] hover:text-[var(--krm-navy)]'

  const demoHref = '/login?demo=1'
  const dashboardHref = isAuthenticated ? '/dashboard' : '/login'

  return (
    <section
      ref={ref as any}
      className={`grid items-center gap-grid-2 py-grid-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] ${
        isVisible ? 'animate-fade-up' : 'opacity-0'
      }`}
    >
      <div className="space-y-grid">
        <div className="space-y-3">
          <div className="inline-flex flex-col gap-1">
            <span className="text-xs font-mono tracking-[0.25em] text-[var(--krm-slate)]">
              KRM™
            </span>
            <h1
              className="text-4xl md:text-5xl font-[var(--font-bebas)] tracking-[0.25em] text-[var(--krm-navy)]"
            >
              YOUR BUSINESS. ONE SYSTEM.
            </h1>
          </div>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--krm-slate)]">
            RELATIONSHIP MANAGEMENT · OPERATIONS · CONTROL
          </p>
        </div>

        <div className="space-y-4 text-sm md:text-base leading-relaxed text-[var(--krm-slate)] max-w-xl">
          <p>
            A sovereign business operating system built in the Bahamas for Bahamian
            companies that want structure without foreign complexity.
          </p>
          <p>
            CRM. Marketing. Invoicing. HR. Accounting. Compliance. Unified under
            one disciplined dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={demoHref}
            className={`inline-flex items-center justify-center rounded-[3px] border px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase transition-colors ${primaryClasses}`}
          >
            Explore demo
          </Link>
          <Link
            href={dashboardHref}
            className="inline-flex items-center justify-center rounded-[3px] border border-[var(--krm-navy)] px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-[var(--krm-navy)] hover:bg-[var(--krm-navy)] hover:text-[var(--krm-off-white)] transition-colors"
          >
            See live dashboard
          </Link>
        </div>
      </div>

      <div className={`hidden md:flex justify-end ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}>
        <HeroGridVisual />
      </div>
    </section>
  )
}

