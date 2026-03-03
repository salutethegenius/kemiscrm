"use client"

import { useIntersection } from "@/hooks/use-intersection"
import { AlertTriangle, Zap } from "lucide-react"

const fragments = [
  "WhatsApp messages for approvals",
  "Excel sheets for payroll",
  "Separate accounting software",
  "Loose HR records",
  "Manual invoice tracking",
]

const painPoints =
  "Missed payments. Payroll stress. Unclear reporting. No real visibility."

const solutions = [
  "One login",
  "One system",
  "One database",
  "Clear permissions",
  "Documented workflows",
]

export function ProblemSection() {
  const { ref: problemRef, isVisible: problemVisible } = useIntersection()
  const { ref: solutionRef, isVisible: solutionVisible } = useIntersection()

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          ref={problemRef}
          className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20"
        >
          <div className={`${problemVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
              <span className="h-px w-8 bg-[var(--landing-border)]" />
              The Reality
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Most Bahamian businesses
              <br />
              run on fragments
            </h2>
          </div>

          <div className={`${problemVisible ? "animate-slide-in-right delay-200" : "opacity-0"}`}>
            <div className="space-y-3">
              {fragments.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-[var(--landing-border)]/50 bg-[var(--landing-card)]/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-destructive/30 hover:bg-[var(--landing-card)]"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive/60" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm font-semibold text-foreground">
              {"That is not structure. That is risk."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {painPoints}
            </p>
          </div>
        </div>

        <div className="my-20 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--landing-border)]" />
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
            <Zap className="h-4 w-4 text-accent" />
          </div>
          <div className="h-px flex-1 bg-[var(--landing-border)]" />
        </div>

        <div
          ref={solutionRef}
          className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20"
        >
          <div className={`${solutionVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
              <span className="h-px w-8 bg-[var(--landing-border)]" />
              The Solution
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              KRM replaces
              <br />
              the patchwork
            </h2>
          </div>

          <div className={`${solutionVisible ? "animate-slide-in-right delay-200" : "opacity-0"}`}>
            <div className="space-y-3">
              {solutions.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 transition-all duration-300 hover:border-accent/40 hover:bg-accent/10"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/20">
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm font-semibold text-foreground">
              You stop guessing. You start seeing.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              KRM brings structure to growing Bahamian businesses.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
