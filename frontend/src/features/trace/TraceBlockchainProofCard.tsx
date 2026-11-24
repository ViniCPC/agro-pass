import { ExternalLink, Link2 } from 'lucide-react'
import type { PublicBatch } from '@/types/api'
import { TimelineHashInline } from './TimelineHashInline'
import { SOLANA_NETWORK_LABEL, explorerAddressUrl, explorerTxUrl } from './solana'
import { formatDateTime } from './trace.utils'

interface TraceBlockchainProofCardProps {
  data: PublicBatch
  // Demo addresses do not exist on-chain, so explorer links are hidden.
  isDemo: boolean
}

const LINK =
  'inline-flex items-center gap-1 text-xs font-medium text-[var(--color-teal-700)] hover:underline'

export function TraceBlockchainProofCard({ data, isDemo }: TraceBlockchainProofCardProps) {
  const { tokenAddress, tokenizedAt } = data.blockchain
  const mintTx = data.traceEvents.find(
    (event) => event.type === 'MINTED_ONCHAIN' && event.txHash,
  )?.txHash

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-teal-100)] bg-gradient-to-br from-[var(--color-teal-50)] via-[var(--color-surface)] to-[var(--color-teal-50)] p-4 shadow-[var(--shadow-card-hover)] sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Link2 size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Prova na blockchain</h2>
      </div>

      {tokenAddress ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-ink-muted)]">
            O passaporte foi registrado como token na rede {SOLANA_NETWORK_LABEL}, um registro público
            que não pode ser apagado.
          </p>
          <div className="space-y-1.5 rounded-lg bg-[var(--color-surface)] px-2.5 py-2">
            <TimelineHashInline label="Token" value={tokenAddress} />
            <TimelineHashInline label="Tx" value={mintTx ?? null} />
          </div>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Registrado em {tokenizedAt ? formatDateTime(tokenizedAt) : '-'}
          </p>
          {isDemo ? (
            <p className="rounded-md bg-[var(--color-amber-50)] px-2.5 py-1.5 text-xs text-[var(--color-amber-700)]">
              Endereço e transação de demonstração: não existem na rede.
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <a href={explorerAddressUrl(tokenAddress)} target="_blank" rel="noreferrer" className={LINK}>
                Ver token no Solana Explorer
                <ExternalLink size={12} />
              </a>
              {mintTx && (
                <a href={explorerTxUrl(mintTx)} target="_blank" rel="noreferrer" className={LINK}>
                  Ver transação
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-ink-subtle)]">
          Este passaporte ainda não foi registrado na blockchain. A integridade do histórico continua
          verificável pela cadeia de hashes.
        </p>
      )}
    </section>
  )
}
