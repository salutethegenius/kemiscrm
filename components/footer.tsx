'use client'

import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative w-full overflow-hidden border-t border-white/10 bg-[var(--krm-navy)] text-[var(--krm-off-white)]">
      {/* Background grid motif */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 120 120"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Hollow cells */}
          {Array.from({ length: 3 }).map((_, row) =>
            Array.from({ length: 3 }).map((__, col) => {
              const x = 4 + col * 36
              const y = 4 + row * 36
              const isGold = row === 2 && col === 2
              return (
                <rect
                  key={`${row}-${col}`}
                  x={x}
                  y={y}
                  width="28"
                  height="28"
                  rx="3"
                  fill={isGold ? '#9E8A5C' : 'none'}
                  stroke={isGold ? 'none' : '#F5F3EE'}
                  strokeWidth="2"
                />
              )
            })
          )}
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-grid-3">
        {/* Top statement */}
        <div className="mb-grid-2 space-y-3 max-w-3xl">
          <div className="inline-flex flex-col gap-1">
            <span className="text-xs font-mono tracking-[0.25em] text-[rgba(245,243,238,0.7)]">
              KRM™
            </span>
            <h2 className="text-2xl md:text-3xl font-[var(--font-bebas)] tracking-[0.22em] text-[var(--krm-off-white)]">
              THE OPERATING SYSTEM FOR BAHAMIAN BUSINESS
            </h2>
          </div>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[rgba(245,243,238,0.7)]">
            RELATIONSHIP MANAGEMENT · OPERATIONS · CONTROL
          </p>
          <p className="text-sm text-[rgba(245,243,238,0.8)]">
            Built in the Bahamas. Structured for serious organizations. Designed for sovereign
            data control.
          </p>
        </div>

        {/* Main footer grid */}
        <div className="grid gap-grid md:grid-cols-4">
          {/* Column 1 — Platform */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-[0.18em] uppercase text-[rgba(245,243,238,0.7)]">
              Platform
            </h3>
            <ul className="space-y-1 text-sm text-[rgba(245,243,238,0.85)]">
              <li>Overview</li>
              <li>CRM &amp; Pipeline</li>
              <li>Invoicing</li>
              <li>HR &amp; Time Tracking</li>
              <li>Accounting Overview</li>
              <li>Compliance &amp; Data Protection</li>
              <li>
                <span className="underline-offset-4 hover:underline">
                  Enterprise Tier
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2 — Company */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-[0.18em] uppercase text-[rgba(245,243,238,0.7)]">
              Company
            </h3>
            <ul className="space-y-1 text-sm text-[rgba(245,243,238,0.85)]">
              <li>About KRM</li>
              <li>Why Local Matters</li>
              <li>Security &amp; Architecture</li>
              <li>Data Protection Alignment</li>
              <li>
                <Link href="/#schedule-walkthrough" className="underline-offset-4 hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/#schedule-walkthrough" className="underline-offset-4 hover:underline">
                  Book a Walkthrough
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-[0.18em] uppercase text-[rgba(245,243,238,0.7)]">
              Legal
            </h3>
            <ul className="space-y-1 text-sm text-[rgba(245,243,238,0.85)]">
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Data Processing Addendum</li>
              <li>Acceptable Use Policy</li>
              <li>Compliance Statement</li>
            </ul>
          </div>

          {/* Column 4 — Built in the Bahamas */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-[0.18em] uppercase text-[rgba(245,243,238,0.7)]">
              Built in the Bahamas
            </h3>
            <div className="space-y-1 text-sm text-[rgba(245,243,238,0.85)]">
              <p>KRM™</p>
              <p>Kemis Relationship Management</p>
              <p className="mt-2">Nassau, The Bahamas</p>
              <p>Sovereign Infrastructure Initiative</p>
              <p className="mt-3">
                For support:{' '}
                <a
                  href="mailto:support@krm.bs"
                  className="underline-offset-4 hover:underline"
                >
                  support@krm.bs
                </a>
              </p>
              <p>
                For enterprise:{' '}
                <a
                  href="mailto:enterprise@krm.bs"
                  className="underline-offset-4 hover:underline"
                >
                  enterprise@krm.bs
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Lower footer bar */}
        <div className="mt-grid-2 border-t border-white/15 pt-grid flex flex-col gap-3 text-xs text-[rgba(245,243,238,0.7)] md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>© {currentYear} KRM™. All rights reserved.</p>
            <p className="text-[10px]">A KGC Incorporated Company.</p>
          </div>
          <div className="text-right space-y-1">
            <p>BUILT IN THE BAHAMAS · DATA HOSTED SECURELY · ROLE-BASED CONTROL</p>
            <p className="text-sm font-[var(--font-bebas)] tracking-[0.22em]">
              STRUCTURE IS POWER.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

