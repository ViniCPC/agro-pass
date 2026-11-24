import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, ShieldCheck } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { getPublicTraceLink } from '@/features/qr/qr.utils'
import { PRODUCT_LABEL, formatDate, formatQuantity } from '@/features/trace/trace.utils'
import { useQrDataUrl } from '@/hooks/useQrDataUrl'
import type { PublicBatch } from '@/types/api'
import { STAGE_COPY } from './landing-content'

// Compact passport card for the hero, built from a real demo batch.
export function PassportPreview({ passport }: { passport: PublicBatch }) {
  const { batch, farm, traceEvents, integrity } = passport
  const link = getPublicTraceLink(batch.publicCode)
  const { data: qr } = useQrDataUrl(link, 192)
  const recent = traceEvents.slice(-4)

  return (
    <figure aria-label={`Exemplo de passaporte digital do lote ${batch.code}`} className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-[var(--color-leaf-100)]" />
      <div className="relative rounded-3xl border border-[var(--color-sand-200)] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(20,50,31,0.45)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-leaf-600)]">
            Passaporte digital
          </p>
          {integrity?.valid && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-green-50)] px-2.5 py-1 text-xs font-semibold text-[var(--color-green-700)]">
              <ShieldCheck size={13} aria-hidden />
              Registros íntegros
            </span>
          )}
        </div>

        <p className="mt-3 text-xl font-semibold tracking-tight text-[var(--color-forest-900)]">
          Lote {batch.code}
        </p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {PRODUCT_LABEL[batch.productType]} · {formatQuantity(batch.quantity, batch.unit)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge status={batch.status} />
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
            <MapPin size={12} aria-hidden />
            {farm.name} · {farm.city}, {farm.state}
          </span>
        </div>

        <ol className="mt-5 space-y-3 border-t border-[var(--color-sand-100)] pt-4" aria-label="Últimas etapas">
          {recent.map((event, index) => {
            const current = index === recent.length - 1
            return (
              <li key={event.id} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    current
                      ? 'bg-[var(--color-leaf-500)] ring-4 ring-[var(--color-leaf-100)]'
                      : 'bg-[var(--color-forest-700)]'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-forest-900)]">
                    {STAGE_COPY[event.type as keyof typeof STAGE_COPY]?.done ?? event.type}
                  </p>
                  <p className="text-xs text-[var(--color-ink-subtle)]">
                    {formatDate(event.createdAt)} · {event.actorName}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-[var(--color-sand-50)] p-3">
          {qr ? (
            <img src={qr} alt={`QR Code do passaporte ${batch.code}`} width={84} height={84} className="h-[84px] w-[84px] rounded-lg bg-white p-1" />
          ) : (
            <div aria-hidden className="h-[84px] w-[84px] rounded-lg bg-white" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-forest-900)]">
              Escaneie para consultar a trajetória
            </p>
            <Link
              to={`/trace/${batch.publicCode}`}
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-leaf-600)] hover:underline"
            >
              Abrir passaporte
              <ArrowUpRight size={12} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </figure>
  )
}
