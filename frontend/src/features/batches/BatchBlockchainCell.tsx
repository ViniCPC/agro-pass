import { Link2 } from 'lucide-react'
import type { Batch } from '@/types/api'

type Props = Pick<Batch, 'tokenAddress'>

export function BatchBlockchainCell({ tokenAddress }: Props) {
  if (!tokenAddress) {
    return <span className="text-xs text-[var(--color-ink-subtle)]">—</span>
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[var(--color-teal-600)]">
        <Link2 size={11} strokeWidth={2.5} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">On-chain</span>
      </div>
      <p
        className="max-w-[120px] truncate font-mono text-[10px] text-[var(--color-ink-subtle)]"
        title={tokenAddress}
      >
        {tokenAddress.slice(0, 8)}…{tokenAddress.slice(-4)}
      </p>
    </div>
  )
}
