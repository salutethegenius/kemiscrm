"use client"

import { useIntersection } from "@/hooks/use-intersection"
import { MapPin } from "lucide-react"

const points = [
  "How approvals move",
  "How departments are structured",
  "How payroll connects to NIB",
  "How ownership is organized",
  "How small teams actually operate",
]

export function WhyLocalSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section id="why-local" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={ref} className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div className={`${isVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
              <span className="h-px w-8 bg-[var(--landing-border)]" />
              Section 4
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Built in The Bahamas.
              <br />
              Built for how business actually works here.
            </h2>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Built in The Bahamas, for Bahamian business
              </span>
            </div>
          </div>

          <div className={`${isVisible ? "animate-slide-in-right delay-200" : "opacity-0"}`}>
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-8">
              <p className="text-lg font-bold text-foreground">KRM is built here.</p>
              <p className="mt-4 text-sm text-muted-foreground">We understand:</p>

              <div className="mt-4 space-y-2.5">
                {points.map((point, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-secondary"
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-[var(--landing-border)] pt-4">
                <p className="text-sm font-bold text-foreground">
                  You are not adapting to foreign software. The system fits how you already
                  work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
