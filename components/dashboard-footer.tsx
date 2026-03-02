'use client'

import Link from 'next/link'

export function DashboardFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-[var(--krm-navy)] text-[var(--krm-off-white)]">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6 text-xs text-[rgba(245,243,238,0.8)]">
          <p>© {currentYear} KRM™. Built in Nassau, Bahamas.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="underline-offset-4 hover:underline">
              Privacy
            </Link>
            <Link href="/" className="underline-offset-4 hover:underline">
              Terms
            </Link>
            <Link href="/#schedule-walkthrough" className="underline-offset-4 hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
