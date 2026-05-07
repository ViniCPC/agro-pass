import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import type { Batch } from '@/types/api'

const PRODUCT_LABEL: Record<string, string> = {
  COFFEE: 'Cafe',
  SOY: 'Soja',
  CATTLE: 'Bovino',
  COCOA: 'Cacau',
  PALM_OIL: 'Palma',
  RUBBER: 'Borracha',
  WOOD: 'Madeira',
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface BatchCardProps {
  batch: Batch
}

export function BatchCard({ batch }: BatchCardProps) {
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-[var(--color-ink-subtle)]">{batch.code}</p>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            {PRODUCT_LABEL[batch.productType] ?? batch.productType}
          </h3>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            {new Intl.NumberFormat('pt-BR').format(batch.quantity)} {batch.unit}
          </p>
        </div>
        <StatusBadge status={batch.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-ink-muted)]">
        <div>
          <p className="uppercase tracking-wide text-[10px] text-[var(--color-ink-subtle)]">Fazenda</p>
          <p>{batch.farm.name}</p>
        </div>
        <div>
          <p className="uppercase tracking-wide text-[10px] text-[var(--color-ink-subtle)]">Colheita</p>
          <p>{formatDate(batch.harvestDate)}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          to={`/batches/${batch.id}`}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-ink)]"
        >
          QR detail
        </Link>
        <Link
          to={`/trace/${encodeURIComponent(batch.code)}`}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-[var(--color-teal-700)] px-3 text-sm font-semibold text-white"
        >
          Public trace
        </Link>
      </div>
    </article>
  )
}
