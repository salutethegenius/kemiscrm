"use client"

import { useIntersection } from "@/hooks/use-intersection"
import { Users, Receipt, UserCheck, Calculator, ShieldCheck, Wallet } from "lucide-react"

const modules = [
  {
    icon: Users,
    title: "CRM & Pipeline",
    tags: ["Contacts", "Deals", "Follow-ups", "Pipeline"],
    description:
      "Track leads, clients, deals, and follow ups in one place. Know what is closing and what is stalling.",
  },
  {
    icon: Receipt,
    title: "Invoicing & Payments",
    tags: ["Invoices", "Payments", "Balances", "Cash Flow"],
    description:
      "Create invoices. Track who owes you. See what has been paid. No more wondering where cash flow stands.",
  },
  {
    icon: UserCheck,
    title: "HR & Internal Control",
    tags: ["Employees", "Departments", "Time", "Approvals"],
    description:
      "Employee records. Departments. Time tracking. Approval flows. Clear accountability inside your organization.",
  },
  {
    icon: Calculator,
    title: "Accounting Overview",
    tags: ["Income", "Expenses", "Reporting"],
    description:
      "Track income and expenses without needing a second system just to understand your numbers.",
  },
  {
    icon: ShieldCheck,
    title: "Bahamas Compliant Payroll",
    tags: ["NIB", "Bank Exports", "Deductions", "Pay History"],
    description:
      "Run payroll correctly. NIB calculations, local bank file exports, standardized deductions, organized pay history. Payroll should not feel risky.",
  },
  {
    icon: Wallet,
    title: "Compliance & Data Control",
    tags: ["Permissions", "Audit Logs", "Export", "Deletion"],
    description:
      "Role permissions. Audit logs. Data export. Deletion controls. Your business data stays structured and controlled.",
  },
]

export function ModulesSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section id="modules" className="relative py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-primary/[0.02]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div
          ref={ref}
          className={`mb-16 max-w-2xl ${isVisible ? "animate-fade-up" : "opacity-0"}`}
        >
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
            <span className="h-px w-8 bg-[var(--landing-border)]" />
            Modules
          </div>
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            KRM modules in one grid
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-6 transition-all duration-500 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 ${
                isVisible ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: isVisible ? `${(i + 1) * 100}ms` : undefined }}
            >
              <div className="absolute top-0 left-0 h-0.5 w-0 bg-accent transition-all duration-500 group-hover:w-full" />

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 transition-colors duration-300 group-hover:bg-accent/10">
                <mod.icon className="h-5 w-5 text-foreground transition-colors duration-300 group-hover:text-accent" />
              </div>

              <h3 className="font-heading text-lg font-bold tracking-tight text-foreground">
                {mod.title}
              </h3>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {mod.tags.map((tag, j) => (
                  <span
                    key={j}
                    className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors duration-200 group-hover:bg-accent/10 group-hover:text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {mod.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
