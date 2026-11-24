import { CheckCircle2, Globe, Loader2, Lock, LockKeyhole, Route } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import { BATCH_STATUS_LABEL, ROLE_LABEL } from '@/features/trace/trace.utils'
import { useAdvanceBatch, useSetBatchVisibility } from '@/hooks/useBatchLifecycle'
import { apiErrorMessage } from '@/lib/api-error'
import type { Batch } from '@/types/api'
import { canRecord, LIFECYCLE, nextStatus, roleFor } from './lifecycle'

const BUTTON =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60'

export function BatchLifecyclePanel({ batch }: { batch: Batch }) {
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const advance = useAdvanceBatch()
  const visibility = useSetBatchVisibility()

  // In the demo the visitor plays every role.
  const role = isDemoMode ? 'ADMIN' : user?.role
  const next = nextStatus(batch.status)
  const nextRole = next ? roleFor(next) : undefined
  const reached = batch.status === 'CANCELLED' ? -1 : LIFECYCLE.indexOf(batch.status)
  const error = advance.error ?? visibility.error

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <Route size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Etapas do lote</h2>
      </div>

      <ol className="grid grid-cols-7 gap-1" aria-label="Progresso do lote">
        {LIFECYCLE.map((status, index) => (
          <li key={status} title={BATCH_STATUS_LABEL[status]}>
            <span
              className={`block h-2 rounded-full ${
                index <= reached ? 'bg-[var(--color-teal-600)]' : 'bg-[var(--color-slate-100)]'
              }`}
            />
            <span className="sr-only">
              {BATCH_STATUS_LABEL[status]}: {index <= reached ? 'concluída' : 'pendente'}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        {batch.status === 'CANCELLED'
          ? 'Lote cancelado.'
          : `Etapa ${reached + 1} de ${LIFECYCLE.length}: ${BATCH_STATUS_LABEL[batch.status]}`}
      </p>

      <div className="mt-4">
        {next ? (
          canRecord(role, next) ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => advance.mutate({ batchId: batch.id, status: next })}
                disabled={advance.isPending}
                className={`${BUTTON} w-full bg-[var(--color-teal-700)] text-white hover:bg-[var(--color-teal-600)] sm:w-auto`}
              >
                {advance.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : next === 'CLOSED' ? (
                  <LockKeyhole size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {next === 'CLOSED'
                  ? 'Encerrar lote'
                  : `Registrar etapa: ${BATCH_STATUS_LABEL[next]}`}
              </button>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                {next === 'CLOSED'
                  ? 'Encerrar fecha a cadeia de eventos e registra o hash final na blockchain.'
                  : `Cada etapa vira um evento com hash encadeado ao anterior${nextRole ? `; responsável: ${ROLE_LABEL[nextRole]}` : ''}.`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ink-subtle)]">
              Próxima etapa: {BATCH_STATUS_LABEL[next]}, registrada por{' '}
              {nextRole ? ROLE_LABEL[nextRole].toLowerCase() : 'outro papel'}.
            </p>
          )
        ) : (
          <p className="text-sm text-[var(--color-ink-subtle)]">
            {batch.status === 'CLOSED'
              ? 'Lote encerrado: a cadeia de eventos não aceita novas etapas.'
              : 'Este lote não aceita novas etapas.'}
          </p>
        )}
      </div>

      {role === 'ADMIN' && (
        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-border-soft)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
            {batch.isPublic ? <Globe size={14} /> : <Lock size={14} />}
            {batch.isPublic ? 'Passaporte público' : 'Passaporte privado'}
          </p>
          <button
            type="button"
            onClick={() => visibility.mutate({ batchId: batch.id, isPublic: !batch.isPublic })}
            disabled={visibility.isPending}
            className={`${BUTTON} border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]`}
          >
            {visibility.isPending && <Loader2 size={15} className="animate-spin" />}
            {batch.isPublic ? 'Tornar privado' : 'Publicar passaporte'}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
          {apiErrorMessage(error)}
        </p>
      )}
    </section>
  )
}
