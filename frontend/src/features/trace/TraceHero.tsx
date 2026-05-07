import { useState } from 'react'
import { BadgeCheck, Check, Copy, Shield } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { PublicBatch } from '@/types/api'
import { PRODUCT_LABEL, trustMessage } from './trace.utils'

interface TraceHeroProps {
  data: PublicBatch
}

export function TraceHero({ data }: TraceHeroProps) {
  const [isCopied, setIsCopied] = useState(false)
  const product = PRODUCT_LABEL[data.batch.productType] ?? data.batch.productType
  const validationStatus = data.farm.lastValidation?.status
  const validationToneClass =
    validationStatus === 'COMPLIANT'
      ? 'bg-[var(--color-green-50)] text-[var(--color-green-700)]'
      : validationStatus === 'NEEDS_REVIEW'
        ? 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)]'
        : validationStatus === 'NON_COMPLIANT'
          ? 'bg-[var(--color-red-50)] text-[var(--color-red-700)]'
          : 'bg-[var(--color-slate-50)] text-[var(--color-slate-600)]'
  const isNotarized = Boolean(
    data.blockchain.cnftAddress || data.blockchain.mintTxHash,
  )
  const publicTraceLink =
    typeof window === 'undefined'
      ? `/trace/${encodeURIComponent(data.batch.code)}`
      : window.location.href

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicTraceLink)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 1600)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card-hover)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-teal-600)] via-[var(--color-green-600)] to-[var(--color-teal-600)]" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-teal-50)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
            <Shield size={12} />
            Public verification record
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl">
            Batch {data.batch.code}
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)]">{product}</p>
          <p className="max-w-2xl text-sm text-[var(--color-ink-subtle)]">
            {trustMessage(data.batch.status, validationStatus)}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <StatusBadge status={data.batch.status} />
          <span
            className={`inline-flex items-center gap-1 rounded-[var(--radius-badge)] px-2.5 py-1 text-xs font-semibold ${
              isNotarized
                ? 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)]'
                : 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)]'
            }`}
          >
            {isNotarized ? <BadgeCheck size={13} /> : <Shield size={13} />}
            {isNotarized ? 'Notarized' : 'Pending'}
          </span>
          {validationStatus && (
            <span className={`inline-flex items-center gap-1 rounded-[var(--radius-badge)] px-2.5 py-1 text-xs font-semibold ${validationToneClass}`}>
              <BadgeCheck size={13} />
              {validationStatus}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-muted)] hover:border-[var(--color-teal-100)] hover:text-[var(--color-teal-700)]"
          >
            {isCopied ? <Check size={13} /> : <Copy size={13} />}
            {isCopied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>
    </section>
  )
}
