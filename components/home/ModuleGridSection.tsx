const modules = [
  {
    title: 'CRM & Pipeline',
    meta: 'Contacts · Deals · Tasks · Calendar · Forms · Email sync',
    body: 'Complete visibility across your revenue flow.',
  },
  {
    title: 'Invoicing & Payments',
    meta: 'Create invoices · Track payments · Manage balances · Financial summaries',
    body: 'From proposal to payment — documented.',
  },
  {
    title: 'HR & Internal Control',
    meta: 'Employee records · Departments · Time logs · Approvals',
    body: 'Structure inside the organization.',
  },
  {
    title: 'Accounting Overview',
    meta: 'Income tracking · Expense tracking · Clean reporting',
    body: 'No second system required.',
  },
  {
    title: 'Compliance Layer',
    meta: 'Role permissions · Audit logs · Data export · Deletion controls',
    body: 'Aligned with Bahamas Data Protection standards.',
  },
]

export function ModuleGridSection() {
  return (
    <section className="py-grid-3 border-t border-[var(--border)]">
      <div className="mb-grid-2 max-w-xl">
        <h2 className="text-sm font-mono tracking-[0.18em] uppercase text-[var(--krm-slate)] mb-2">
          Section 3
        </h2>
        <h3 className="text-2xl md:text-3xl font-[var(--font-bebas)] tracking-[0.18em] text-[var(--krm-navy)]">
          KRM modules in one grid
        </h3>
      </div>
      <div className="grid gap-grid md:grid-cols-3">
        {modules.map((m) => (
          <div
            key={m.title}
            className="flex flex-col justify-between rounded-[3px] border border-[var(--border)] bg-white/80 p-5 shadow-sm"
          >
            <div className="space-y-2">
              <h4 className="text-sm font-[var(--font-bebas)] tracking-[0.18em] uppercase text-[var(--krm-navy)]">
                {m.title}
              </h4>
              <p className="text-xs font-mono tracking-[0.08em] text-[var(--krm-slate)]">
                {m.meta}
              </p>
            </div>
            <p className="mt-3 text-sm text-[var(--krm-slate)]">{m.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

