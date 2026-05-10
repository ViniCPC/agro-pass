import { StatusBadge } from '@/components/StatusBadge'
import type { PublicBatch } from '@/types/api'
import { formatDate, PRODUCT_LABEL } from './trace.utils'

interface TraceBatchSummaryProps {
  data: PublicBatch
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink)]">{value}</p>
    </div>
  )
}

export function TraceBatchSummary({ data }: TraceBatchSummaryProps) {
  const product = PRODUCT_LABEL[data.batch.productType] ?? data.batch.productType
  const quantity = new Intl.NumberFormat('en-US').format(data.batch.quantity)

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Resumo do lote</h2>
        <StatusBadge status={data.batch.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryField label="Produto" value={product} />
        <SummaryField label="Quantidade" value={`${quantity} ${data.batch.unit}`} />
        <SummaryField label="Data da colheita" value={formatDate(data.batch.harvestDate)} />
        <SummaryField label="Status" value={data.batch.status} />
        <SummaryField label="Fazenda de origem" value={data.farm.name} />
        <SummaryField label="Código do lote" value={data.batch.code} />
      </div>
    </section>
  )
}
