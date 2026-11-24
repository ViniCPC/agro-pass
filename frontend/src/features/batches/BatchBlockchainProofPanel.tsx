import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Link2, Loader2, RotateCw } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import { TimelineHashInline } from '@/features/trace/TimelineHashInline'
import { networkLabel } from '@/features/trace/solana'
import { formatDateTime } from '@/features/trace/trace.utils'
import { useTokenizeBatch } from '@/hooks/useCreateBatch'
import type { Batch } from '@/types/api'

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { message?: string | string[] }
      const message = Array.isArray(body.message) ? body.message.join(' ') : body.message
      if (message) return message
    } catch {
      // Not a JSON body.
    }
  }
  return error instanceof Error ? error.message : 'Não foi possível registrar a prova.'
}

function StatusLine({ batch }: { batch: Batch }) {
  const { status, attempts, error } = batch.blockchain

  if (status === 'CONFIRMED') {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-green-700)]">
        <CheckCircle2 size={15} />
        Prova registrada na rede {networkLabel(batch.blockchain.network)}
      </p>
    )
  }
  if (status === 'PENDING') {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
        <Loader2 size={15} className="animate-spin" />
        Registro em andamento…
      </p>
    )
  }
  if (status === 'FAILED') {
    return (
      <div className="space-y-1 rounded-lg bg-[var(--color-red-50)] px-3 py-2 text-sm text-[var(--color-red-700)]">
        <p className="inline-flex items-center gap-1.5 font-medium">
          <AlertTriangle size={15} />
          O registro falhou ({attempts} tentativa{attempts === 1 ? '' : 's'} no total)
        </p>
        {error && <p className="break-words text-xs">{error}</p>}
        <p className="text-xs">O lote não foi alterado: o encerramento e a cadeia de eventos seguem válidos.</p>
      </div>
    )
  }
  return (
    <p className="inline-flex items-start gap-1.5 text-sm text-[var(--color-ink-subtle)]">
      <Clock size={15} className="mt-0.5 shrink-0" />
      {batch.status === 'CLOSED'
        ? 'Lote encerrado sem prova registrada (registro em blockchain desabilitado ou ainda não executado).'
        : 'A prova é registrada automaticamente quando o lote for encerrado.'}
    </p>
  )
}

export function BatchBlockchainProofPanel({ batch }: { batch: Batch }) {
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const tokenize = useTokenizeBatch()
  const proof = batch.blockchain

  const canRetry =
    !isDemoMode &&
    user?.role === 'ADMIN' &&
    batch.status === 'CLOSED' &&
    (proof.status === 'FAILED' || proof.status === 'NONE')

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <Link2 size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Prova na blockchain</h2>
      </div>

      <StatusLine batch={batch} />

      {proof.status === 'CONFIRMED' && (
        <div className="mt-3 space-y-2">
          <div className="space-y-1.5 rounded-lg bg-[var(--color-page)] px-2.5 py-2">
            <TimelineHashInline label="Hash registrado" value={proof.proofHash} />
            <TimelineHashInline label="Tx" value={proof.txHash} />
          </div>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Registrado em {batch.tokenizedAt ? formatDateTime(batch.tokenizedAt) : '-'}
          </p>
          {proof.explorerTxUrl && (
            <a
              href={proof.explorerTxUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-teal-700)] hover:underline"
            >
              Verificar no Solana Explorer
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {canRetry && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => tokenize.mutate(batch.id)}
            disabled={tokenize.isPending}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {tokenize.isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            {tokenize.isPending ? 'Registrando…' : 'Tentar registrar novamente'}
          </button>
          {tokenize.isError && (
            <p className="rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
              {errorMessage(tokenize.error)}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
