import { MapPin, Sprout } from 'lucide-react'
import type { PublicBatch } from '@/types/api'
import { BIOME_LABEL } from './trace.utils'

interface TraceFarmCardProps {
  data: PublicBatch
}

function FarmField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink)]">{value}</p>
    </div>
  )
}

export function TraceFarmCard({ data }: TraceFarmCardProps) {
  const biome = data.farm.biome ? BIOME_LABEL[data.farm.biome] : '-'

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <Sprout size={16} className="text-[var(--color-green-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Perfil da fazenda</h2>
      </div>

      <div className="mb-4 inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-slate-50)] px-2.5 py-1 text-xs text-[var(--color-ink-muted)]">
        <MapPin size={12} />
        {data.farm.city}, {data.farm.state}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FarmField label="Nome" value={data.farm.name} />
        <FarmField label="Produtor" value={data.farm.producer.name} />
        <FarmField label="Bioma" value={biome} />
        <FarmField label="Amazônia Legal" value={data.farm.isAmazonLegal ? 'Sim' : 'Não'} />
        <FarmField label="CAR" value={data.farm.carNumber ?? '-'} />
      </div>
    </section>
  )
}
