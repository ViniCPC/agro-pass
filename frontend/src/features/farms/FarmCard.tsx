import { Link } from 'react-router-dom'
import type { Farm } from '@/types/api'

function formatArea(area: number | null) {
  if (area == null) return 'Área não informada'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(area) + ' ha'
}

export function FarmCard({ farm }: { farm: Farm }) {
  return (
    <Link to={'/farms/' + farm.id} className="block">
      <article className="space-y-3 rounded-[var(--radius-card)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">{farm.name}</p>
          <p className="text-xs text-[var(--color-ink-subtle)]">{farm.city}, {farm.state}</p>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border-soft)] pt-3 text-xs text-[var(--color-ink-muted)]">
          <span>{formatArea(farm.totalAreaHa)}</span>
          <span className="font-mono">{farm.carNumber ?? 'Sem CAR'}</span>
        </div>
      </article>
    </Link>
  )
}
