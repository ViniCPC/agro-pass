import { Link2 } from 'lucide-react'
import type { Batch } from '@/types/api'

type Props = Pick<Batch, 'cnftAddress' | 'mintTxHash' | 'status'>

export function BatchBlockchainCell({ cnftAddress, mintTxHash, status }: Props) {
  const isOnChain = Boolean(cnftAddress) || ['MINTED', 'IN_TRANSIT', 'EXPORTED'].includes(status)

  if (!isOnChain) {
    return <span className="text-xs text-[var(--color-ink-subtle)]">—</span>
  }

  const addr = cnftAddress ?? null
  const tx   = mintTxHash ?? null

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[var(--color-teal-600)]">
        <Link2 size={11} strokeWidth={2.5} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">On-chain</span>
      </div>
      {addr && (
        <p className="font-mono text-[10px] text-[var(--color-ink-subtle)] truncate max-w-[120px]" title={addr}>
          {addr.slice(0, 8)}…{addr.slice(-4)}
        </p>
      )}
      {tx && (
        <p className="font-mono text-[10px] text-[var(--color-ink-subtle)] truncate max-w-[120px]" title={tx}>
          tx: {tx.slice(0, 6)}…{tx.slice(-4)}
        </p>
      )}
    </div>
  )
}
