"use client"

import { useIntersection } from "@/hooks/use-intersection"
import { ArrowRight, Calendar } from "lucide-react"

export function CtaSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section id="cta" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          ref={ref}
          className={`relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-20 lg:px-24 ${
            isVisible ? "animate-scale-in" : "opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute bottom-0 -left-10 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />
          </div>

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-primary-foreground/50">
              <span className="h-px w-8 bg-primary-foreground/20" />
              Section 8
            </div>

            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
              {'KRM\u2122 Built in The Bahamas.'}
              <br />
              Structured for Serious Business.
            </h2>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-all duration-300 hover:shadow-xl hover:shadow-accent/30"
              >
                <Calendar className="h-4 w-4" />
                Schedule Walkthrough
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
              <a
                href="#"
                className="group inline-flex items-center gap-2.5 rounded-xl border border-primary-foreground/20 px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:border-primary-foreground/40 hover:bg-primary-foreground/5"
              >
                Request Enterprise Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
