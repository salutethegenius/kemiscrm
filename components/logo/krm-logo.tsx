'use client'

/** KRM Logo — Concept 01: Modular Grid Mark + Full Lockup (Primary Light / Inverted Dark) */

export type KrmLogoVariant = 'light' | 'dark'

interface KrmGridMarkProps {
  variant: KrmLogoVariant
  className?: string
  size?: number
}

/** Grid mark only — for favicon, small icons */
export function KrmGridMark({ variant, className = '', size = 32 }: KrmGridMarkProps) {
  const isLight = variant === 'light'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {isLight ? (
        <>
          <rect x="4" y="4" width="28" height="28" rx="3" fill="#0E1C2F" />
          <rect x="38" y="4" width="28" height="28" rx="3" fill="none" stroke="#0E1C2F" strokeWidth="2" opacity="0.18" />
          <rect x="72" y="4" width="20" height="28" rx="3" fill="#9E8A5C" opacity="0.55" />
          <rect x="4" y="38" width="28" height="20" rx="3" fill="#0E1C2F" />
          <rect x="38" y="38" width="28" height="20" rx="3" fill="#0E1C2F" />
          <rect x="72" y="38" width="20" height="20" rx="3" fill="none" stroke="#0E1C2F" strokeWidth="2" opacity="0.18" />
          <rect x="4" y="64" width="28" height="28" rx="3" fill="#0E1C2F" />
          <rect x="38" y="64" width="28" height="28" rx="3" fill="none" stroke="#0E1C2F" strokeWidth="2" opacity="0.18" />
          <rect x="72" y="64" width="20" height="28" rx="3" fill="#0E1C2F" />
        </>
      ) : (
        <>
          <rect x="4" y="4" width="28" height="28" rx="3" fill="#FFFFFF" />
          <rect x="38" y="4" width="28" height="28" rx="3" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />
          <rect x="72" y="4" width="20" height="28" rx="3" fill="#9E8A5C" opacity="0.8" />
          <rect x="4" y="38" width="28" height="20" rx="3" fill="#FFFFFF" />
          <rect x="38" y="38" width="28" height="20" rx="3" fill="#FFFFFF" />
          <rect x="72" y="38" width="20" height="20" rx="3" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />
          <rect x="4" y="64" width="28" height="28" rx="3" fill="#FFFFFF" />
          <rect x="38" y="64" width="28" height="28" rx="3" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />
          <rect x="72" y="64" width="20" height="28" rx="3" fill="#FFFFFF" />
        </>
      )}
    </svg>
  )
}

interface KrmFullLockupProps {
  variant: KrmLogoVariant
  className?: string
  height?: number
  showSub?: boolean
}

/** Full lockup: grid mark + KRM wordmark + optional RELATIONSHIP MANAGEMENT */
export function KrmFullLockup({ variant, className = '', height = 36, showSub = true }: KrmFullLockupProps) {
  const isLight = variant === 'light'
  const scale = height / 72
  return (
    <svg
      width={380 * scale}
      height={height}
      viewBox="0 0 380 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {isLight ? (
        <>
          <rect x="0" y="4" width="17" height="17" rx="2" fill="#0E1C2F" />
          <rect x="21" y="4" width="17" height="17" rx="2" fill="none" stroke="#0E1C2F" strokeWidth="1.5" opacity="0.2" />
          <rect x="41" y="4" width="13" height="17" rx="2" fill="#9E8A5C" opacity="0.7" />
          <rect x="0" y="25" width="17" height="12" rx="2" fill="#0E1C2F" />
          <rect x="21" y="25" width="17" height="12" rx="2" fill="#0E1C2F" />
          <rect x="41" y="25" width="13" height="12" rx="2" fill="none" stroke="#0E1C2F" strokeWidth="1.5" opacity="0.2" />
          <rect x="0" y="41" width="17" height="17" rx="2" fill="#0E1C2F" />
          <rect x="21" y="41" width="17" height="17" rx="2" fill="none" stroke="#0E1C2F" strokeWidth="1.5" opacity="0.2" />
          <rect x="41" y="41" width="13" height="17" rx="2" fill="#0E1C2F" />
          <text x="68" y="44" fontFamily="'Bebas Neue', sans-serif" fontSize="44" fill="#0E1C2F" letterSpacing="6">
            KRM
          </text>
          {showSub && (
            <text x="69" y="64" fontFamily="'DM Mono', monospace" fontSize="14" fill="#4A5D6E" letterSpacing="1">
              RELATIONSHIP MANAGEMENT
            </text>
          )}
        </>
      ) : (
        <>
          <rect x="0" y="4" width="17" height="17" rx="2" fill="white" />
          <rect x="21" y="4" width="17" height="17" rx="2" fill="none" stroke="white" strokeWidth="1.5" opacity="0.2" />
          <rect x="41" y="4" width="13" height="17" rx="2" fill="#C4AB78" opacity="0.85" />
          <rect x="0" y="25" width="17" height="12" rx="2" fill="white" />
          <rect x="21" y="25" width="17" height="12" rx="2" fill="white" />
          <rect x="41" y="25" width="13" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5" opacity="0.2" />
          <rect x="0" y="41" width="17" height="17" rx="2" fill="white" />
          <rect x="21" y="41" width="17" height="17" rx="2" fill="none" stroke="white" strokeWidth="1.5" opacity="0.2" />
          <rect x="41" y="41" width="13" height="17" rx="2" fill="white" />
          <text x="68" y="44" fontFamily="'Bebas Neue', sans-serif" fontSize="44" fill="white" letterSpacing="6">
            KRM
          </text>
          {showSub && (
            <text x="69" y="64" fontFamily="'DM Mono', monospace" fontSize="14" fill="rgba(255,255,255,0.4)" letterSpacing="1">
              RELATIONSHIP MANAGEMENT
            </text>
          )}
        </>
      )}
    </svg>
  )
}
