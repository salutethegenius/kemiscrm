"use client"

import { useIntersection } from "@/hooks/use-intersection"
import { TrendingUp } from "lucide-react"

const outcomes = [
  "Clear reporting",
  "No lost invoices",
  "Structured approvals",
  "Controlled data access",
  "Reduced operational friction",
]

export function OutcomesSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section className="relative py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-primary/[0.02]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={ref} className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div className={`${isVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
              <span className="h-px w-8 bg-border" />
              Section 7
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              What changes
              <br />
              in 90 days
            </h2>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Measurable impact
              </span>
            </div>
          </div>

          <div className={`${isVisible ? "animate-slide-in-right delay-200" : "opacity-0"}`}>
            <div className="space-y-3">
              {outcomes.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:border-accent/30 hover:bg-card hover:shadow-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 px-5 py-4">
              <p className="text-sm font-bold text-foreground">
                KRM does not digitize chaos. It disciplines it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
