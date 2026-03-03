"use client"

import { useIntersection } from "@/hooks/use-intersection"

const techStack = [
  "Next.js 16",
  "Supabase (Postgres + Auth)",
  "Row-Level Security",
  "Multi-tenant Isolation",
  "Encrypted Credentials",
]

export function InfrastructureSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section id="infrastructure" className="relative py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-primary/[0.02]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={ref}>
          <div className={`mb-12 max-w-2xl ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
              <span className="h-px w-8 bg-border" />
              Section 5
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
              Built on modern infrastructure
            </h2>
          </div>

          <div className={`flex flex-wrap gap-3 ${isVisible ? "animate-fade-up delay-200" : "opacity-0"}`}>
            {techStack.map((tech, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-border bg-card px-5 py-3 transition-all duration-300 hover:border-accent/40 hover:shadow-md"
              >
                <div className="absolute inset-0 translate-y-full bg-accent/5 transition-transform duration-300 group-hover:translate-y-0" />
                <span className="relative font-mono text-sm font-medium text-foreground">
                  {tech}
                </span>
              </div>
            ))}
          </div>

          <p className={`mt-8 text-sm text-muted-foreground ${isVisible ? "animate-fade-up delay-300" : "opacity-0"}`}>
            Enterprise-grade logic. Local sovereignty.
          </p>
        </div>
      </div>
    </section>
  )
}
