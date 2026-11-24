import { useState } from 'react'
import { BadgeCheck, CalendarDays, Check, Copy, Share2, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { getPublicTraceLink } from '@/features/qr/qr.utils'
import type { PublicBatch } from '@/types/api'
import { PRODUCT_LABEL, formatDate, formatQuantity, trustMessage } from './trace.utils'

const CHIP = 'inline-flex items-center gap-1 rounded-[var(--radius-badge)] px-2.5 py-1 text-xs font-semibold'

function IntegrityChip({ integrity }: { integrity: PublicBatch['integrity'] }) {
  if (!integrity) return null
  return integrity.valid ? (
    <span className={`${CHIP} bg-[var(--color-green-50)] text-[var(--color-green-700)]`}>
      <ShieldCheck size={13} />
      Cadeia íntegra
    </span>
  ) : (
    <span className={`${CHIP} bg-[var(--color-red-50)] text-[var(--color-red-700)]`}>
      <ShieldAlert size={13} />
      Inconsistência detectada
    </span>
  )
}

export function TraceHero({ data }: { data: PublicBatch }) {
  const [isCopied, setIsCopied] = useState(false)
  const product = PRODUCT_LABEL[data.batch.productType] ?? data.batch.productType
  const isNotarized = Boolean(data.blockchain.tokenAddress)
  const link = getPublicTraceLink(data.batch.publicCode)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function handleShare() {
    if (canShare) {
      try {
        await navigator.share({ title: `Passaporte do lote ${data.batch.code}`, url: link })
        return
      } catch (error) {
        // Closing the share sheet is not an error worth reporting.
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(link)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 1600)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card-hover)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-teal-600)] via-[var(--color-green-600)] to-[var(--color-teal-600)]" />

      <p className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-teal-50)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
        <Shield size={12} />
        Passaporte digital do produto
      </p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="break-words text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl">
            Lote {data.batch.code}
          </h1>
          <p className="text-sm font-medium text-[var(--color-ink-muted)]">
            {product} · {formatQuantity(data.batch.quantity, data.batch.unit)}
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
            <CalendarDays size={12} />
            Criado em {formatDate(data.batch.createdAt)}
          </p>
          <p className="max-w-2xl text-sm text-[var(--color-ink-subtle)]">
            {trustMessage(data.batch.status)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-ink-muted)] hover:border-[var(--color-teal-100)] hover:text-[var(--color-teal-700)]"
        >
          {isCopied ? <Check size={14} /> : canShare ? <Share2 size={14} /> : <Copy size={14} />}
          {isCopied ? 'Link copiado' : canShare ? 'Compartilhar' : 'Copiar link'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={data.batch.status} />
        <IntegrityChip integrity={data.integrity} />
        <span
          className={`${CHIP} ${
            isNotarized
              ? 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)]'
              : 'bg-[var(--color-slate-100)] text-[var(--color-slate-600)]'
          }`}
        >
          {isNotarized ? <BadgeCheck size={13} /> : <Shield size={13} />}
          {isNotarized ? 'Prova na blockchain' : 'Sem prova on-chain'}
        </span>
      </div>
    </section>
  )
}
