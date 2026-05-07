import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { StickyMobileCta } from '@/components/StickyMobileCta'
import { TouchFriendlyButton } from '@/components/TouchFriendlyButton'
import { TraceBatchSummary } from '@/features/trace/TraceBatchSummary'
import { BlockchainProofCard } from '@/features/trace/BlockchainProofCard'
import { TraceCertificateMeta } from '@/features/trace/TraceCertificateMeta'
import { TraceComplianceCard } from '@/features/trace/TraceComplianceCard'
import { TraceDocumentsPanel } from '@/features/trace/TraceDocumentsPanel'
import { TraceFarmCard } from '@/features/trace/TraceFarmCard'
import { TraceHero } from '@/features/trace/TraceHero'
import { TraceTimeline } from '@/features/trace/TraceTimeline'
import { TraceTrustFooter } from '@/features/trace/TraceTrustFooter'
import { TraceQrSection } from '@/features/qr/TraceQrSection'
import { resolveAssetUrl } from '@/features/qr/qr.utils'
import { useTraceByCode } from '@/hooks/useTraceByCode'
import type { PublicBatch } from '@/types/api'

function getEudrReportUrl(data: PublicBatch) {
  const report = data.documents.find((document) => document.type === 'ENVIRONMENTAL_REPORT')
  return resolveAssetUrl(report?.fileUrl ?? null)
}

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

  const eudrReportUrl = getEudrReportUrl(data)

  return (
    <div className="mx-auto w-full max-w-5xl pb-24 sm:pb-0">
      <div className="space-y-4 rounded-[16px] border-2 border-[var(--color-teal-100)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card-hover)] sm:p-6">
        <TraceCertificateMeta data={data} />

        <TraceHero data={data} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TraceBatchSummary data={data} />
          <TraceFarmCard data={data} />
        </div>

        <TraceQrSection
          batchCode={data.batch.code}
          qrCodeUrl={data.batch.qrCodeUrl}
        />

        <TraceComplianceCard data={data} />

        <TraceTimeline events={data.traceEvents} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TraceDocumentsPanel data={data} />
          <BlockchainProofCard data={data} />
        </div>

        <TraceTrustFooter />
      </div>

      {eudrReportUrl && (
        <StickyMobileCta>
          <TouchFriendlyButton
            onClick={() => window.open(eudrReportUrl, '_blank', 'noopener,noreferrer')}
            className="w-full rounded-lg bg-[var(--color-teal-700)] px-4 text-sm font-semibold text-white"
          >
            Download EUDR Report
          </TouchFriendlyButton>
        </StickyMobileCta>
      )}
    </div>
  )
}
