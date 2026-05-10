import { Activity } from 'lucide-react'

export function TimelineEmptyState() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-page)] px-4 py-6 text-center">
      <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-slate-100)] text-[var(--color-slate-600)]">
        <Activity size={16} />
      </div>
      <p className="text-sm font-medium text-[var(--color-ink)]">
        Nenhum evento de rastreabilidade registrado
      </p>
    </div>
  )
}
