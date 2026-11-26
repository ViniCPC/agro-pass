import { useDemoMode } from '@/contexts/demo-context'
import { isSimulatedProof } from '@/features/trace/solana'
import { Link2 } from 'lucide-react'
import type { BatchBlockchainProof } from '@/types/api'

interface Props {
  proof: BatchBlockchainProof
}

const PENDING_LABEL: Partial<Record<BatchBlockchainProof['status'], string>> = {
  PENDING: 'Registrando…',
  FAILED: 'Falhou',
}

export function BatchBlockchainCell({ proof }: Props) {
  const { isDemoMode } = useDemoMode()
  const simulated = isSimulatedProof(proof, isDemoMode)
  if (proof.status !== 'CONFIRMED') {
    const label = PENDING_LABEL[proof.status]
    return (
      <span className={`text-xs ${proof.status === 'FAILED' ? 'text-[var(--color-red-700)]' : 'text-[var(--color-ink-subtle)]'}`}>
        {label ?? '—'}
      </span>
    )
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[var(--color-teal-600)]">
        <Link2 size={11} strokeWidth={2.5} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{simulated ? 'Simulada' : 'On-chain'}</span>
      </div>
      {proof.txHash && (
        <p
          className="max-w-[120px] truncate font-mono text-[10px] text-[var(--color-ink-subtle)]"
          title={proof.txHash}
        >
          {proof.txHash.slice(0, 8)}…{proof.txHash.slice(-4)}
        </p>
      )}
    </div>
  )
}
