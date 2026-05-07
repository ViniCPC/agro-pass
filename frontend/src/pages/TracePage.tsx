import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { TraceBatchSummary } from '@/features/trace/TraceBatchSummary'
import { BlockchainProofCard } from '@/features/trace/BlockchainProofCard'
import { TraceCertificateMeta } from '@/features/trace/TraceCertificateMeta'
import { TraceComplianceCard } from '@/features/trace/TraceComplianceCard'
import { TraceDocumentsPanel } from '@/features/trace/TraceDocumentsPanel'
import { TraceFarmCard } from '@/features/trace/TraceFarmCard'
import { TraceHero } from '@/features/trace/TraceHero'
import { TraceTimeline } from '@/features/trace/TraceTimeline'
import { TraceTrustFooter } from '@/features/trace/TraceTrustFooter'
import { useTraceByCode } from '@/hooks/useTraceByCode'

export function TracePage() {
  const { code } = useParams<{ code: string }>()
  const decodedCode = code ? decodeURIComponent(code) : null

  const { data, isLoading, error, refetch } = useTraceByCode(decodedCode)

  if (!decodedCode) {
    return (
      <ErrorState
        title="Invalid trace link"
        description="This traceability URL is missing a batch code."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingState rows={4} />
        <LoadingState rows={3} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <ErrorState
          title={`Batch "${decodedCode}" not found`}
          description="We could not find a public traceability record for this code."
          onRetry={() => refetch()}
        />
        <p className="text-center text-sm text-[var(--color-ink-subtle)]">
          For demo mode, open <Link className="text-[var(--color-teal-700)] hover:underline" to="/trace/AGP-2025-001">/trace/AGP-2025-001</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="space-y-4 rounded-[16px] border-2 border-[var(--color-teal-100)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card-hover)] sm:p-6">
        <TraceCertificateMeta data={data} />

        <TraceHero data={data} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TraceBatchSummary data={data} />
          <TraceFarmCard data={data} />
        </div>

        <TraceComplianceCard data={data} />

        <TraceTimeline events={data.traceEvents} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TraceDocumentsPanel data={data} />
          <BlockchainProofCard data={data} />
        </div>

        <TraceTrustFooter />
      </div>
    </div>
  )
}
