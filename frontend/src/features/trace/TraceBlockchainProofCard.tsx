import { Link2 } from 'lucide-react'
import type { PublicBatch } from '@/types/api'
import { shortHash } from './trace.utils'

interface TraceBlockchainProofCardProps {
  data: PublicBatch
}

function BlockchainField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-teal-700)]/70">
        {label}
      </p>
      <p className="font-mono text-xs text-[var(--color-ink-muted)] break-all">{value ?? '-'}</p>
    </div>
  )
}

export function TraceBlockchainProofCard({ data }: TraceBlockchainProofCardProps) {
  const txHash = data.blockchain.mintTxHash
  const txExplorerUrl = txHash
    ? `https://solscan.io/tx/${encodeURIComponent(txHash)}?cluster=devnet`
    : null

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-teal-100)] bg-gradient-to-br from-[var(--color-teal-50)] via-[var(--color-surface)] to-[var(--color-teal-50)] p-5 shadow-[var(--shadow-card-hover)]">
      <div className="mb-4 flex items-center gap-2">
        <Link2 size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Blockchain proof</h2>
      </div>

      <div className="space-y-4">
        <BlockchainField label="cNFT address" value={data.blockchain.cnftAddress} />
        <BlockchainField label="Merkle tree" value={data.blockchain.merkleTree} />
        <BlockchainField label="Metadata URI" value={data.blockchain.metadataUri} />
        <BlockchainField label="Mint tx hash" value={data.blockchain.mintTxHash} />
      </div>

      {txExplorerUrl && (
        <a
          href={txExplorerUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] border border-[var(--color-teal-100)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-teal-700)] hover:bg-[var(--color-teal-50)]"
          title={data.blockchain.mintTxHash ?? ''}
        >
          View transaction {shortHash(data.blockchain.mintTxHash, 10, 8)}
        </a>
      )}
    </section>
  )
}
