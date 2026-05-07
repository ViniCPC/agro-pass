import { Coins, ExternalLink, Link2 } from 'lucide-react'
import type { ElementType } from 'react'
import { SectionHeader } from '@/components/SectionHeader'
import { useBatches } from '@/hooks/useBatches'
import { deriveDashboardMetrics } from './dashboard-metrics'

function ProofMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: ElementType
}) {
  return (
    <div className="rounded-lg border border-[var(--color-teal-100)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center gap-1.5 text-[var(--color-teal-700)]">
        <Icon size={14} />
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  )
}

export function BlockchainProofSummary() {
  const { data, isLoading } = useBatches()
  const batches = data?.data ?? []
  const metrics = deriveDashboardMetrics([], batches)

  const v = (value: number) => (isLoading ? '...' : value)

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-teal-100)] bg-gradient-to-br from-[var(--color-teal-50)] via-[var(--color-surface)] to-[var(--color-teal-50)] p-5 shadow-[var(--shadow-card-hover)]">
      <SectionHeader
        title="Blockchain proof layer"
        description="cNFT notarization on Solana"
        action={
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-teal-700)]">
            <Link2 size={12} />
            Digital proof
          </span>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <ProofMetric label="Proofed batches" value={v(metrics.blockchainProofBatches)} icon={Coins} />
        <ProofMetric label="Traced batches" value={v(metrics.tracedBatches)} icon={Link2} />
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
          Latest on-chain hash
        </p>
        <p className="truncate rounded-[var(--radius-badge)] border border-[var(--color-teal-100)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--color-ink-muted)]">
          5KJFp8mWnR2sYtUeA4BcDfJnKoP8WmVqE5iTGHv7m...
        </p>
        <a
          href="https://explorer.solana.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-teal-700)] hover:underline"
        >
          View in Solana Explorer <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}
