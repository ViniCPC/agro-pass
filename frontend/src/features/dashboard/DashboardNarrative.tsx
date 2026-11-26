import { Link2, Route } from 'lucide-react'
import { useBatches } from '@/hooks/useBatches'
import { useFarms } from '@/hooks/useFarms'
import { deriveDashboardMetrics, describeTraceability } from './dashboard-metrics'

function NarrativeValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  )
}

export function DashboardNarrative() {
  const { data: farmsData, isLoading: farmsLoading } = useFarms()
  const { data: batchesData, isLoading: batchesLoading } = useBatches()
  const metrics = deriveDashboardMetrics(farmsData?.data ?? [], batchesData?.data ?? [])
  const isLoading = farmsLoading || batchesLoading

  const narrative = isLoading
    ? 'Carregando dados de rastreabilidade...'
    : describeTraceability(metrics)

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-teal-50)] to-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
        Operação
      </p>
      <h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">Pulso de rastreabilidade</h2>
      <p className="mt-1 max-w-3xl text-sm text-[var(--color-ink-muted)]">{narrative}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <NarrativeValue label="Fazendas" value={isLoading ? '...' : metrics.totalFarms} />
        <NarrativeValue label="Lotes" value={isLoading ? '...' : metrics.totalBatches} />
        <NarrativeValue label="Entregues" value={isLoading ? '...' : metrics.deliveredBatches} />
        <NarrativeValue label="Provas digitais" value={isLoading ? '...' : metrics.blockchainProofBatches} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--color-ink-subtle)]">
        <span className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1">
          <Route size={12} />
          Cadeia ponta a ponta
        </span>
        <span className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1">
          <Link2 size={12} />
          Prova digital verificável
        </span>
      </div>
    </section>
  )
}
