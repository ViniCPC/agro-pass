import { AlertTriangle, CheckCircle2, Link2, Route } from 'lucide-react'
import { useBatches } from '@/hooks/useBatches'
import { useFarms } from '@/hooks/useFarms'
import { deriveDashboardMetrics } from './dashboard-metrics'

function NarrativeValue({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string | number
  tone?: 'default' | 'green' | 'amber' | 'red' | 'teal'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-[var(--color-green-700)]'
      : tone === 'amber'
        ? 'text-[var(--color-amber-700)]'
        : tone === 'red'
          ? 'text-[var(--color-red-700)]'
          : tone === 'teal'
            ? 'text-[var(--color-teal-700)]'
            : 'text-[var(--color-ink)]'

  return (
    <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}

export function DashboardNarrative() {
  const { data: farmsData, isLoading: farmsLoading } = useFarms()
  const { data: batchesData, isLoading: batchesLoading } = useBatches()

  const farms = farmsData?.data ?? []
  const batches = batchesData?.data ?? []
  const metrics = deriveDashboardMetrics(farms, batches)
  const isLoading = farmsLoading || batchesLoading

  const complianceRate =
    metrics.totalFarms > 0
      ? Math.round((metrics.compliantFarms / metrics.totalFarms) * 100)
      : 0

  const narrativeText = isLoading
    ? 'Carregando dados de rastreabilidade...'
    : `${metrics.compliantFarms}/${metrics.totalFarms} fazendas conformes, ${metrics.tracedBatches}/${metrics.totalBatches} lotes rastreados e ${metrics.blockchainProofBatches} com prova blockchain.`

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-teal-50)] to-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
            Narrativa operacional
          </p>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Pulso de rastreabilidade</h2>
          <p className="max-w-3xl text-sm text-[var(--color-ink-muted)]">{narrativeText}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-green-50)] px-2.5 py-1 text-xs font-semibold text-[var(--color-green-700)]">
            <CheckCircle2 size={13} />
            {isLoading ? '...' : `${complianceRate}% conformes`}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-amber-50)] px-2.5 py-1 text-xs font-semibold text-[var(--color-amber-700)]">
            <AlertTriangle size={13} />
            {isLoading ? '...' : `${metrics.farmsNeedingReview + metrics.farmsAtRisk} para revisar`}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <NarrativeValue label="Fazendas" value={isLoading ? '...' : metrics.totalFarms} />
        <NarrativeValue
          label="Conformes"
          value={isLoading ? '...' : metrics.compliantFarms}
          tone="green"
        />
        <NarrativeValue
          label="Lotes rastreados"
          value={isLoading ? '...' : metrics.tracedBatches}
          tone="amber"
        />
        <NarrativeValue
          label="Prova blockchain"
          value={isLoading ? '...' : metrics.blockchainProofBatches}
          tone="teal"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-ink-subtle)]">
          <Route size={12} />
          Rastreabilidade ponta a ponta
        </span>
        <span className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-ink-subtle)]">
          <Link2 size={12} />
          Camada de prova digital
        </span>
      </div>
    </section>
  )
}
