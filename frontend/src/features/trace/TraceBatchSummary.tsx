import { Package } from 'lucide-react'
import type { PublicBatch } from '@/types/api'
import {
  BATCH_STATUS_LABEL,
  PRODUCT_LABEL,
  formatDate,
  formatHarvestDate,
  formatQuantity,
} from './trace.utils'

function SummaryField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </dt>
      <dd className={`mt-1 break-words text-sm text-[var(--color-ink)] ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

export function TraceBatchSummary({ data }: { data: PublicBatch }) {
  const { batch } = data

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Package size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Resumo do lote</h2>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <SummaryField label="Código" value={batch.code} mono />
        <SummaryField label="Produto" value={PRODUCT_LABEL[batch.productType] ?? batch.productType} />
        <SummaryField label="Quantidade" value={formatQuantity(batch.quantity, batch.unit)} />
        <SummaryField label="Status atual" value={BATCH_STATUS_LABEL[batch.status] ?? batch.status} />
        <SummaryField label="Data de criação" value={formatDate(batch.createdAt)} />
        <SummaryField label="Colheita" value={formatHarvestDate(batch.harvestDate)} />
        {batch.closedAt && <SummaryField label="Encerrado em" value={formatDate(batch.closedAt)} />}
        <SummaryField label="Última atualização" value={formatDate(batch.updatedAt)} />
      </dl>
    </section>
  )
}
