import { CheckCircle2, Clock, ExternalLink, Link2, XCircle } from 'lucide-react'
import type { PublicBatch } from '@/types/api'
import { TimelineHashInline } from './TimelineHashInline'
import { isSimulatedProof, networkLabel } from './solana'
import { formatDateTime } from './trace.utils'

interface TraceBlockchainProofCardProps {
  data: PublicBatch
  // Demo addresses do not exist on-chain, so there is nothing to link to.
  isDemo: boolean
}

const LINK =
  'inline-flex min-h-[32px] items-center gap-1 text-xs font-medium text-[var(--color-teal-700)] hover:underline'

function HashComparison({ proofHash, finalHash }: { proofHash: string | null; finalHash: string | null }) {
  // Proofs from the previous flow did not record the anchored hash.
  if (!proofHash || !finalHash) return null

  return proofHash === finalHash ? (
    <p className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-green-50)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-green-700)]">
      <CheckCircle2 size={13} className="shrink-0" />
      Confere com o hash final da cadeia de eventos
    </p>
  ) : (
    <p className="inline-flex items-start gap-1.5 rounded-md bg-[var(--color-red-50)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-red-700)]">
      <XCircle size={13} className="mt-0.5 shrink-0" />
      Diferente do hash final atual: a cadeia mudou depois do registro
    </p>
  )
}

export function TraceBlockchainProofCard({ data, isDemo }: TraceBlockchainProofCardProps) {
  const proof = data.blockchain
  const simulated = isSimulatedProof(proof, isDemo)
  const finalHash = data.integrity?.finalHash ?? data.batch.integrityHash
  const isClosed = data.batch.status === 'CLOSED'

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-teal-100)] bg-gradient-to-br from-[var(--color-teal-50)] via-[var(--color-surface)] to-[var(--color-teal-50)] p-4 shadow-[var(--shadow-card-hover)] sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Link2 size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Prova na blockchain</h2>
      </div>

      {proof.status === 'CONFIRMED' ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-ink-muted)]">
            {simulated
              ? 'Prova simulada: o hash foi calculado localmente; nenhuma transação foi enviada à Solana.'
              : `Ao encerrar o lote, o hash final da cadeia foi registrado como token na rede ${networkLabel(proof.network)}. Confira a transação no Explorer.`}
          </p>

          <div className="space-y-1.5 rounded-lg bg-[var(--color-surface)] px-2.5 py-2">
            <TimelineHashInline label="Hash registrado" value={proof.proofHash} />
            <TimelineHashInline label="Tx" value={proof.txHash} />
            <TimelineHashInline label="Token" value={proof.tokenAddress} />
          </div>

          <HashComparison proofHash={proof.proofHash} finalHash={finalHash} />

          <p className="text-xs text-[var(--color-ink-subtle)]">
            Registrado em {proof.tokenizedAt ? formatDateTime(proof.tokenizedAt) : '-'}
          </p>

          {simulated ? (
            <p className="rounded-md bg-[var(--color-amber-50)] px-2.5 py-1.5 text-xs text-[var(--color-amber-700)]">
              Transação de demonstração: o hash é real, mas o registro não existe na rede.
            </p>
          ) : proof.explorerTxUrl ? (
            <div className="space-y-1">
              <div className="flex flex-wrap gap-x-4">
                <a href={proof.explorerTxUrl} target="_blank" rel="noreferrer" className={LINK}>
                  Verificar transação no Solana Explorer
                  <ExternalLink size={12} />
                </a>
                {proof.explorerTokenUrl && (
                  <a href={proof.explorerTokenUrl} target="_blank" rel="noreferrer" className={LINK}>
                    Ver token
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                No explorer, o memo da transação mostra o mesmo hash registrado acima.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-ink-subtle)]">
              Registro sem link público de verificação.
            </p>
          )}
        </div>
      ) : proof.status === 'FAILED' ? (
        <p className="text-sm text-[var(--color-ink-subtle)]">O registro na blockchain falhou. A cadeia de hashes continua disponível para verificação.</p>
      ) : proof.status === 'PENDING' ? (
        <p className="flex items-start gap-2 text-sm text-[var(--color-ink-subtle)]">
          <Clock size={15} className="mt-0.5 shrink-0" />
          O registro na blockchain está em andamento. Enquanto isso, a integridade do histórico já
          pode ser verificada pela cadeia de hashes.
        </p>
      ) : (
        <p className="text-sm text-[var(--color-ink-subtle)]">
          {isClosed
            ? 'Este passaporte não foi registrado na blockchain. A integridade do histórico continua verificável pela cadeia de hashes.'
            : 'A prova na blockchain é registrada quando o lote for encerrado, com o hash final de toda a cadeia de eventos.'}
        </p>
      )}
    </section>
  )
}
