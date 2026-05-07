import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionHeader } from '@/components/SectionHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import { useBatches } from '@/hooks/useBatches'
import type { Batch } from '@/types/api'

const PRODUCT_LABEL: Record<string, string> = {
  COFFEE:   'Café',
  SOY:      'Soja',
  CATTLE:   'Bovino',
  COCOA:    'Cacau',
  PALM_OIL: 'Palma',
  RUBBER:   'Borracha',
  WOOD:     'Madeira',
}

function BatchRow({ batch }: { batch: Batch }) {
  const qty = new Intl.NumberFormat('pt-BR').format(batch.quantity)

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border-soft)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-ink)] font-mono">{batch.code}</p>
        <p className="text-xs text-[var(--color-ink-subtle)] truncate">
          {PRODUCT_LABEL[batch.productType] ?? batch.productType} · {qty} {batch.unit} · {batch.farm.name}
        </p>
      </div>
      <StatusBadge status={batch.status} className="shrink-0" />
    </div>
  )
}

export function RecentBatchesCard() {
  const navigate = useNavigate()
  const { data, isLoading } = useBatches()
  const batches = (data?.data ?? []).slice(0, 5)

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] space-y-3">
      <SectionHeader
        title="Lotes recentes"
        action={
          <button
            onClick={() => navigate('/batches')}
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-teal-600)] hover:underline cursor-pointer"
          >
            Ver todos <ArrowRight size={12} />
          </button>
        }
      />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : batches.length === 0 ? (
        <EmptyState title="Nenhum lote criado ainda" />
      ) : (
        <div>
          {batches.map(batch => <BatchRow key={batch.id} batch={batch} />)}
        </div>
      )}
    </div>
  )
}
