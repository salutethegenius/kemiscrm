import Link from 'next/link'
import { KrmFullLockup } from '@/components/logo/krm-logo'

interface HomeHeaderProps {
  isAuthenticated: boolean
}

export function HomeHeader({ isAuthenticated }: HomeHeaderProps) {
  return (
    <header className="flex items-center justify-between py-grid">
      <Link href="/" className="inline-flex items-center">
        <KrmFullLockup variant="light" showSub height={32} />
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium">
        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-[3px] border border-[var(--krm-navy)] px-4 py-2 text-[var(--krm-navy)] hover:bg-[var(--krm-navy)] hover:text-[var(--krm-off-white)] transition-colors"
          >
            Go to dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center rounded-[3px] border border-[var(--krm-navy)] px-4 py-2 text-[var(--krm-navy)] hover:bg-[var(--krm-navy)] hover:text-[var(--krm-off-white)] transition-colors"
          >
            Log in
          </Link>
        )}
      </nav>
    </header>
  )
}

