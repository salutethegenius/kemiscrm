"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Play } from "lucide-react"
import { useIntersection } from "@/hooks/use-intersection"

export function HeroSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section
      ref={ref}
      className="relative min-h-screen pt-24 pb-20 lg:pt-32 lg:pb-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div
              className={`${isVisible ? "animate-fade-up" : "opacity-0"}`}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-[var(--landing-card)]/60 px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-muted-foreground backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                KRM{'\u2122'} Sovereign Platform
              </div>
            </div>

            <h1
              className={`font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl ${
                isVisible ? "animate-fade-up delay-100" : "opacity-0"
              }`}
            >
              Your Business.
              <br />
              <span className="text-accent">One System.</span>
            </h1>

            <div
              className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium tracking-widest uppercase text-muted-foreground ${
                isVisible ? "animate-fade-up delay-200" : "opacity-0"
              }`}
            >
              <span>Relationship Management</span>
              <span className="h-1 w-1 rounded-full bg-accent" />
              <span>Operations</span>
              <span className="h-1 w-1 rounded-full bg-accent" />
              <span>Control</span>
            </div>

            <p
              className={`mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground ${
                isVisible ? "animate-fade-up delay-300" : "opacity-0"
              }`}
            >
              A sovereign business operating system built in the Bahamas for
              Bahamian companies that want structure without foreign complexity.
            </p>

            <p
              className={`mt-4 max-w-xl text-base leading-relaxed text-muted-foreground/80 ${
                isVisible ? "animate-fade-up delay-400" : "opacity-0"
              }`}
            >
              CRM. Marketing. Invoicing. HR. Accounting. Compliance.
              Unified under one disciplined dashboard.
            </p>

            <div
              className={`mt-10 flex flex-wrap items-center gap-4 ${
                isVisible ? "animate-fade-up delay-500" : "opacity-0"
              }`}
            >
              <Link
                href="/login?demo=1"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:shadow-xl hover:shadow-primary/20"
              >
                Explore demo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#modules"
                className="group inline-flex items-center gap-2.5 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-card)]/50 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-accent/50 hover:bg-[var(--landing-card)]"
              >
                <Play className="h-4 w-4 text-accent" />
                See Live Dashboard
              </Link>
            </div>
          </div>

          <div
            className={`relative ${
              isVisible ? "animate-scale-in delay-300" : "opacity-0"
            }`}
          >
            <div className="overflow-hidden rounded-2xl border border-[var(--landing-border)] shadow-2xl ring-1 ring-black/5 lg:-mr-32 xl:-mr-48">
              <Image
                src="/dashboard-screenshot.png"
                alt="KRM Dashboard - Contacts, Pipeline, Tasks, and unified CRM for Bahamian businesses"
                width={1600}
                height={1000}
                className="w-full object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, min(55vw, 900px)"
              />
            </div>

            <div className="absolute -bottom-4 -left-4 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-card)] px-4 py-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">6 Modules</p>
                  <p className="text-[10px] text-muted-foreground">One platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module blocks - key visual element */}
        <div
          className={`mt-16 lg:mt-20 ${
            isVisible ? "animate-fade-up delay-500" : "opacity-0"
          }`}
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-9">
            {[
              { bg: "bg-primary", label: "CRM" },
              { bg: "bg-primary/80", label: "HR" },
              { bg: "bg-accent", label: "Finance" },
              { bg: "bg-accent/80", label: "Invoice" },
              { bg: "bg-primary", label: "Comply" },
              { bg: "bg-secondary", label: "Reports" },
              { bg: "bg-secondary", label: "Pipeline" },
              { bg: "bg-accent/60", label: "Audit" },
              { bg: "bg-primary/60", label: "Data" },
            ].map((block, i) => (
              <div
                key={i}
                className={`group relative aspect-square cursor-default overflow-hidden rounded-2xl ${block.bg} transition-all duration-500 hover:scale-[1.05] hover:shadow-lg`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className={`text-[10px] font-semibold tracking-wider uppercase sm:text-xs ${
                    block.bg.includes("secondary") ? "text-foreground" : "text-primary-foreground"
                  }`}>
                    {block.label}
                  </span>
                </div>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
