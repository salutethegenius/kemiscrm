"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, ArrowRight } from "lucide-react"
import { KrmFullLockup } from "@/components/logo/krm-logo"

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { label: "Modules", href: "#modules" },
    { label: "Why Local", href: "#why-local" },
    { label: "Infrastructure", href: "#infrastructure" },
    { label: "Pricing & Licenses", href: "#pricing" },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[var(--landing-card)]/80 backdrop-blur-xl border-b border-[var(--landing-border)] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <KrmFullLockup variant="light" showSub height={44} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#pricing"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            See Licenses & Pricing
          </a>
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-foreground transition-colors hover:bg-secondary md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--landing-border)] bg-[var(--landing-card)]/95 backdrop-blur-xl md:hidden animate-fade-in">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 border-t border-[var(--landing-border)] pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
