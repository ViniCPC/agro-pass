import { getPublicTraceLink } from '@/features/qr/qr.utils'
import { PRODUCT_LABEL, formatQuantity } from '@/features/trace/trace.utils'
import { useQrDataUrl } from '@/hooks/useQrDataUrl'
import { cn } from '@/lib/utils'
import type { PublicBatch } from '@/types/api'

// The printed QR label that goes on the sack: the same one the app prints on
// A4 sheets, and the one that opens the passport.
export function LotLabel({ passport, className }: { passport: PublicBatch; className?: string }) {
  const { batch, farm } = passport
  const { data: qr } = useQrDataUrl(getPublicTraceLink(batch.publicCode), 320)

  return (
    <div className={cn('w-[15rem] rounded-[6px] bg-white p-3 text-carbon shadow-[0_18px_40px_-18px_rgba(16,27,22,0.55)]', className)}>
      <p className="flex items-center justify-between font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-carbon-500">
        <span>AgroPass</span>
        <span className="rounded-[3px] bg-lime px-1.5 py-0.5 text-carbon">QR do lote</span>
      </p>
      <div className="mt-2.5 flex gap-3">
        {qr ? (
          <img src={qr} alt={`QR Code do passaporte ${batch.code}`} width={88} height={88} className="h-[88px] w-[88px] shrink-0" />
        ) : (
          <div aria-hidden className="h-[88px] w-[88px] shrink-0 rounded bg-frost" />
        )}
        <div className="min-w-0 font-mono">
          <p className="text-[9px] uppercase tracking-[0.14em] text-carbon-500">Lote</p>
          <p className="whitespace-nowrap text-[14px] font-semibold leading-tight">{batch.code}</p>
          <p className="mt-1.5 text-[11px] leading-snug">
            {PRODUCT_LABEL[batch.productType]} · {formatQuantity(batch.quantity, batch.unit)}
          </p>
          <p className="text-[11px] leading-snug text-carbon-700">
            {farm.city}/{farm.state}
          </p>
        </div>
      </div>
    </div>
  )
}
