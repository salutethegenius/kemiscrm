export function WhyLocalSection() {
  return (
    <section className="py-grid-3 border-t border-[var(--border)]">
      <div className="grid gap-grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
        <div>
          <h2 className="text-sm font-mono tracking-[0.18em] uppercase text-[var(--krm-slate)] mb-2">
            Section 4
          </h2>
          <h3 className="text-2xl md:text-3xl font-[var(--font-bebas)] tracking-[0.18em] text-[var(--krm-navy)]">
            Why local matters
          </h3>
        </div>
        <div className="space-y-3 text-sm text-[var(--krm-slate)]">
          <p>Salesforce is global. HubSpot is generic. Zoho is broad.</p>
          <p className="font-medium text-[var(--krm-navy)]">KRM is built here.</p>
          <p className="text-sm">We understand:</p>
          <ul className="space-y-1">
            <li>• How approvals actually move</li>
            <li>• How departments function locally</li>
            <li>• How compliance works here</li>
            <li>• How ownership is structured</li>
          </ul>
          <p className="mt-3 font-medium text-[var(--krm-navy)]">Context is infrastructure.</p>
        </div>
      </div>
    </section>
  )
}

