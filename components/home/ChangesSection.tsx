'use client'

import { useIntersection } from '@/hooks/useIntersection'

export function ChangesSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section
      ref={ref as any}
      className={`py-grid-3 border-t border-[var(--border)] ${
        isVisible ? 'animate-fade-up' : 'opacity-0'
      }`}
    >
      <div className="grid gap-grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
        <div>
          <h2 className="text-sm font-mono tracking-[0.18em] uppercase text-[var(--krm-slate)] mb-2">
            Section 7
          </h2>
          <h3 className="text-2xl md:text-3xl font-[var(--font-bebas)] tracking-[0.18em] text-[var(--krm-navy)]">
            What changes in 90 days
          </h3>
        </div>
        <div className="space-y-2 text-sm text-[var(--krm-slate)]">
          <ul className="space-y-1">
            <li>• Clear reporting.</li>
            <li>• No lost invoices.</li>
            <li>• Structured approvals.</li>
            <li>• Controlled data access.</li>
            <li>• Reduced operational friction.</li>
          </ul>
          <p className="mt-3 font-medium text-[var(--krm-navy)]">
            KRM does not digitize chaos. It disciplines it.
          </p>
        </div>
      </div>
    </section>
  )
}

