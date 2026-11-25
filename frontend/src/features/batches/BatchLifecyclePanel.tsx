import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Ban,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  LockKeyhole,
  QrCode,
  Route,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/auth-context'
import { RoleHandoff } from '@/features/auth/RoleHandoff'
import { isAdmin, ROLE_BY, ROLE_TITLE } from '@/features/auth/roles'
import {
  BATCH_STATUS_LABEL,
  PRODUCT_LABEL,
  formatQuantity,
  shortHash,
} from '@/features/trace/trace.utils'
import { useActingRole } from '@/hooks/useActingRole'
import { useAdvanceBatch, useCancelBatch, useSetBatchVisibility } from '@/hooks/useBatchLifecycle'
import { apiErrorMessage } from '@/lib/api-error'
import { demoActorName } from '@/mocks/demo-store'
import type { Batch, UserRole } from '@/types/api'
import { canRecord, LIFECYCLE, nextStatus, roleFor } from './lifecycle'
import { RecordStageForm } from './RecordStageForm'

const CARD =
  'rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]'
const BUTTON =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY = `${BUTTON} bg-[var(--color-teal-700)] text-white hover:bg-[var(--color-teal-600)]`
const OUTLINE = `${BUTTON} border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]`

interface BatchLifecyclePanelProps {
  batch: Batch
  // For the closing review; unknown counts are left out of it.
  eventCount?: number
  documentCount?: number
}

function useResponsible(batch: Batch, role: UserRole | undefined) {
  const { user } = useAuth()
  const { isDemoMode } = useActingRole()
  if (!role) return ''
  const name = isDemoMode ? demoActorName(batch.id, role) : user?.name
  return name ? `${name} (${ROLE_TITLE[role]})` : ROLE_TITLE[role]
}

function StageProgress({ batch }: { batch: Batch }) {
  const reached = batch.status === 'CANCELLED' ? -1 : LIFECYCLE.indexOf(batch.status)
  return (
    <>
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
      <details className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        <summary className="cursor-pointer font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
          Quem registra cada etapa
        </summary>
        <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {LIFECYCLE.slice(1).map((status) => (
            <li key={status} className="flex justify-between gap-3 rounded-md bg-[var(--color-page)] px-2.5 py-1.5">
              <span>{BATCH_STATUS_LABEL[status]}</span>
              <span className="font-medium text-[var(--color-ink-muted)]">{ROLE_TITLE[roleFor(status)!]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">O administrador pode registrar qualquer etapa. A API confere o papel de cada registro.</p>
      </details>
    </>
  )
}

// After closing, the passport still has to be published before the QR leads
// anywhere: the three steps are spelled out in order.
function NextSteps({ batch, role }: { batch: Batch; role: UserRole | undefined }) {
  const visibility = useSetBatchVisibility()
  const passportPath = `/trace/${encodeURIComponent(batch.publicCode)}`
  const steps = [
    {
      done: batch.isPublic,
      title: 'Publicar o passaporte',
      body: batch.isPublic ? (
        <p>
          Publicado: qualquer pessoa com o QR abre a página.
          {isAdmin(role) && (
            <button
              type="button"
              onClick={() => visibility.mutate({ batchId: batch.id, isPublic: false })}
              disabled={visibility.isPending}
              className="ml-2 font-medium text-[var(--color-ink-muted)] underline underline-offset-2 hover:text-[var(--color-ink)] disabled:opacity-60"
            >
              Tornar privado
            </button>
          )}
        </p>
      ) : isAdmin(role) ? (
        <button
          type="button"
          onClick={() => visibility.mutate({ batchId: batch.id, isPublic: true })}
          disabled={visibility.isPending}
          className={`${PRIMARY} mt-2`}
        >
          {visibility.isPending ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
          Publicar passaporte
        </button>
      ) : (
        <div className="mt-2">
          <RoleHandoff role="ADMIN">A publicação é feita por um administrador.</RoleHandoff>
        </div>
      ),
    },
    {
      done: false,
      title: 'Baixar o QR',
      body: (
        <a href="#qr-do-lote" className="mt-1 inline-flex items-center gap-1.5 font-medium text-[var(--color-teal-700)] hover:underline">
          <QrCode size={14} aria-hidden />
          Ir para o QR e as etiquetas
        </a>
      ),
    },
    {
      done: false,
      title: 'Abrir o passaporte público',
      body: batch.isPublic ? (
        <Link
          to={passportPath}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 font-medium text-[var(--color-teal-700)] hover:underline"
        >
          <ExternalLink size={14} aria-hidden />
          Abrir como quem escaneou o QR
        </Link>
      ) : (
        'Disponível depois da publicação.'
      ),
    },
  ]

  return (
    <div className="mt-4 border-t border-[var(--color-border-soft)] pt-4">
      <p className="text-sm font-semibold text-[var(--color-ink)]">Próximos passos</p>
      <ol className="mt-3 space-y-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done
                  ? 'bg-[var(--color-green-600)] text-white'
                  : 'border border-[var(--color-border)] text-[var(--color-ink-muted)]'
              }`}
            >
              {step.done ? <Check size={13} strokeWidth={3} /> : index + 1}
            </span>
            <div className="min-w-0 flex-1 text-sm text-[var(--color-ink-muted)]">
              <p className="font-medium text-[var(--color-ink)]">
                {step.title}
                {step.done && <span className="sr-only"> (concluído)</span>}
              </p>
              {typeof step.body === 'string' ? <p>{step.body}</p> : step.body}
            </div>
          </li>
        ))}
      </ol>
      {visibility.error && (
        <p className="mt-3 rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
          {apiErrorMessage(visibility.error)}
        </p>
      )}
    </div>
  )
}

function VisibilityRow({ batch, role }: { batch: Batch; role: UserRole | undefined }) {
  const visibility = useSetBatchVisibility()
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-border-soft)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
        {batch.isPublic ? <Globe size={14} /> : <Lock size={14} />}
        {batch.isPublic ? 'Passaporte público' : 'Passaporte privado'}
        {!isAdmin(role) && !batch.isPublic && (
          <span className="text-xs text-[var(--color-ink-subtle)]"> · um administrador publica</span>
        )}
      </p>
      {isAdmin(role) && (
        <button
          type="button"
          onClick={() => visibility.mutate({ batchId: batch.id, isPublic: !batch.isPublic })}
          disabled={visibility.isPending}
          className={OUTLINE}
        >
          {visibility.isPending && <Loader2 size={15} className="animate-spin" />}
          {batch.isPublic ? 'Tornar privado' : 'Publicar passaporte'}
        </button>
      )}
      {visibility.error && (
        <p className="text-xs text-[var(--color-red-700)]">{apiErrorMessage(visibility.error)}</p>
      )}
    </div>
  )
}

export function BatchLifecyclePanel({ batch, eventCount, documentCount }: BatchLifecyclePanelProps) {
  const { role, isDemoMode } = useActingRole()
  const advance = useAdvanceBatch()
  const cancel = useCancelBatch()
  const [recorded, setRecorded] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const next = nextStatus(batch.status)
  const nextRole = next ? roleFor(next) : undefined
  const terminal = batch.status === 'CLOSED' || batch.status === 'CANCELLED'
  const responsible = useResponsible(batch, role)

  async function recordStage(details: { location?: string; notes?: string }) {
    if (!next) return
    setRecorded(null)
    await advance.mutateAsync({ batchId: batch.id, status: next, details })
    setRecorded(BATCH_STATUS_LABEL[next])
  }

  async function closeBatch() {
    try {
      await advance.mutateAsync({ batchId: batch.id, status: 'CLOSED' })
      setReviewOpen(false)
      setRecorded(null)
    } catch {
      // Shown inside the dialog.
    }
  }

  async function cancelBatch() {
    try {
      await cancel.mutateAsync({ batchId: batch.id, notes: cancelReason.trim() })
      setCancelOpen(false)
      setCancelReason('')
    } catch {
      // Shown inside the dialog.
    }
  }

  const product = PRODUCT_LABEL[batch.productType] ?? batch.productType

  return (
    <section id="etapas" className={`${CARD} scroll-mt-4`}>
      <div className="mb-3 flex items-center gap-2">
        <Route size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Etapas do lote</h2>
      </div>

      <StageProgress batch={batch} />

      {recorded && (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 rounded-lg bg-[var(--color-green-50)] px-3 py-2 text-sm text-[var(--color-green-700)]"
        >
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            Etapa “{recorded}” registrada e encadeada à anterior.{' '}
            <a href="#linha-do-tempo" className="font-medium underline underline-offset-2">
              Ver na linha do tempo
            </a>
          </span>
        </p>
      )}

      <div className="mt-4">
        {next === 'CLOSED' ? (
          isAdmin(role) ? (
            <div className="space-y-2">
              <button type="button" onClick={() => setReviewOpen(true)} className={`${PRIMARY} w-full sm:w-auto`}>
                <LockKeyhole size={15} />
                Revisar e encerrar lote
              </button>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                Encerrar fecha a cadeia de eventos e registra o hash final como prova.
              </p>
            </div>
          ) : (
            <RoleHandoff role="ADMIN">Todas as etapas foram registradas. O encerramento é feito {ROLE_BY.ADMIN}.</RoleHandoff>
          )
        ) : next ? (
          canRecord(role, next) ? (
            <RecordStageForm key={next} stage={next} responsible={responsible} pending={advance.isPending} onSubmit={recordStage} />
          ) : (
            <RoleHandoff role={nextRole ?? 'ADMIN'}>
              Próxima etapa: {BATCH_STATUS_LABEL[next]}, registrada {nextRole ? ROLE_BY[nextRole] : 'por outro papel'}.
            </RoleHandoff>
          )
        ) : (
          <p className="text-sm text-[var(--color-ink-subtle)]">
            {batch.status === 'CLOSED'
              ? 'Lote encerrado: a cadeia de eventos não aceita novas etapas.'
              : 'Lote cancelado: este lote não aceita novas etapas.'}
          </p>
        )}
      </div>

      {advance.error && !reviewOpen && (
        <p role="alert" className="mt-3 rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
          {apiErrorMessage(advance.error)}
        </p>
      )}

      {batch.status === 'CLOSED' ? <NextSteps batch={batch} role={role} /> : <VisibilityRow batch={batch} role={role} />}

      {isAdmin(role) && !terminal && (
        <div className="mt-4 border-t border-[var(--color-border-soft)] pt-3">
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-[var(--color-red-700)] hover:underline"
          >
            <Ban size={14} aria-hidden />
            Cancelar lote
          </button>
        </div>
      )}

      <ConfirmDialog
        open={reviewOpen}
        title={`Encerrar o lote ${batch.code}?`}
        confirmLabel="Confirmar encerramento"
        onConfirm={closeBatch}
        onClose={() => setReviewOpen(false)}
        pending={advance.isPending}
        error={advance.error ? apiErrorMessage(advance.error) : null}
      >
        <p>
          {product} · {formatQuantity(batch.quantity, batch.unit)} · {batch.farm.name}
        </p>
        <ul className="space-y-1.5 rounded-lg bg-[var(--color-page)] p-3">
          <li className="flex gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-green-700)]" aria-hidden />
            Todas as etapas, da criação à entrega, estão registradas
            {eventCount !== undefined ? ` (${eventCount} eventos na cadeia)` : ''}.
          </li>
          {documentCount !== undefined && (
            <li className="flex gap-2">
              <Check
                size={14}
                className={`mt-0.5 shrink-0 ${documentCount ? 'text-[var(--color-green-700)]' : 'text-[var(--color-ink-subtle)]'}`}
                aria-hidden
              />
              {documentCount
                ? `${documentCount} documento${documentCount > 1 ? 's' : ''} anexado${documentCount > 1 ? 's' : ''}.`
                : 'Nenhum documento anexado. Depois de encerrar não será possível anexar.'}
            </li>
          )}
        </ul>
        <p>
          Depois de encerrar, a cadeia não aceita novas etapas, documentos ou correções. O hash final
          {batch.integrityHash ? <span className="font-mono text-xs"> {shortHash(batch.integrityHash, 8, 6)}</span> : ''} será
          registrado como prova{isDemoMode ? ' (simulada na demonstração)' : ''}.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelOpen}
        title={`Cancelar o lote ${batch.code}?`}
        confirmLabel="Confirmar cancelamento"
        tone="danger"
        onConfirm={cancelBatch}
        onClose={() => setCancelOpen(false)}
        pending={cancel.isPending}
        confirmDisabled={cancelReason.trim().length < 5}
        error={cancel.error ? apiErrorMessage(cancel.error) : null}
      >
        <p>O cancelamento é definitivo e fica registrado na cadeia com o motivo informado.</p>
        <label htmlFor="cancel-reason" className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Motivo
        </label>
        <textarea
          id="cancel-reason"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Ex.: Lote duplicado por engano"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-teal-600)]"
        />
      </ConfirmDialog>
    </section>
  )
}
