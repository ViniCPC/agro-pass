import { MapPin, Sprout } from 'lucide-react'
import type { PublicBatch } from '@/types/api'

function FarmField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">{label}</dt>
      <dd className={`mt-1 text-sm text-[var(--color-ink)] ${mono ? 'break-all font-mono text-xs' : 'break-words'}`}>
        {value}
      </dd>
    </div>
  )
}

export function TraceFarmCard({ data }: { data: PublicBatch }) {
  const area = data.farm.totalAreaHa == null
    ? '-'
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(data.farm.totalAreaHa) + ' ha'

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sprout size={16} className="text-[var(--color-green-700)]" />
          <h2 className="text-base font-semibold text-[var(--color-ink)]">Propriedade de origem</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-slate-50)] px-2.5 py-1 text-xs text-[var(--color-ink-muted)]">
          <MapPin size={12} />
          {data.farm.city}, {data.farm.state}
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FarmField label="Fazenda" value={data.farm.name} />
        <FarmField label="Produtor" value={data.farm.producer.name} />
        <FarmField label="Área total" value={area} />
        <FarmField label="CAR" value={data.farm.carNumber ?? '-'} mono={Boolean(data.farm.carNumber)} />
      </dl>
    </section>
  )
}
