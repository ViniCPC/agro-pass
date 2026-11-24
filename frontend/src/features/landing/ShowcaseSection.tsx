import { Link } from 'react-router-dom'
import { ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react'
import { LIFECYCLE } from '@/features/batches/lifecycle'
import { getPublicTraceLink } from '@/features/qr/qr.utils'
import {
  BATCH_STATUS_LABEL,
  PRODUCT_LABEL,
  ROLE_LABEL,
  formatDateTime,
  formatQuantity,
  shortHash,
} from '@/features/trace/trace.utils'
import { useQrDataUrl } from '@/hooks/useQrDataUrl'
import type { BatchStatus, PublicBatch, PublicTraceEvent } from '@/types/api'
import { STAGE_COPY } from './landing-content'
import { Container, PRIMARY_BUTTON, SectionHeading } from './landing-ui'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--color-sand-100)] py-3 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--color-forest-900)]">{children}</dd>
    </div>
  )
}

type StepState = 'done' | 'current' | 'pending'

function Step({
  index,
  status,
  state,
  event,
  isLast,
}: {
  index: number
  status: BatchStatus
  state: StepState
  event?: PublicTraceEvent
  isLast: boolean
}) {
  const copy = STAGE_COPY[status]
  return (
    <li className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
      <div className="relative flex justify-center">
        <span
          className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
            state === 'pending'
              ? 'border border-dashed border-[var(--color-sand-200)] bg-white text-[var(--color-ink-subtle)]'
              : state === 'current'
                ? 'bg-[var(--color-leaf-500)] text-white ring-4 ring-[var(--color-leaf-100)]'
                : 'bg-[var(--color-forest-800)] text-white'
          }`}
        >
          {index + 1}
        </span>
        {!isLast && <span aria-hidden className="absolute top-8 bottom-0 w-px bg-[var(--color-sand-200)]" />}
      </div>
      <div className={isLast ? '' : 'pb-5'}>
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-semibold ${state === 'pending' ? 'text-[var(--color-ink-subtle)]' : 'text-[var(--color-forest-900)]'}`}>
            {event ? copy.done : copy.pending}
          </p>
          {state === 'current' && (
            <span className="rounded-full bg-[var(--color-leaf-100)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-forest-800)]">
              Etapa atual
            </span>
          )}
        </div>
        {event ? (
          <>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
              {event.actorName} · {ROLE_LABEL[event.actor.role]} · {formatDateTime(event.createdAt)}
            </p>
            <p className="font-mono text-[11px] text-[var(--color-ink-subtle)]" title={event.eventHash}>
              hash {shortHash(event.eventHash, 10, 8)}
            </p>
          </>
        ) : (
          <p className="mt-0.5 text-xs text-[var(--color-ink-subtle)]">Aguardando registro</p>
        )}
      </div>
    </li>
  )
}

export function ShowcaseSection({ passport }: { passport: PublicBatch }) {
  const { batch, farm, traceEvents, integrity } = passport
  const recorded = new Map(traceEvents.map((event) => [event.type as string, event]))
  const { data: qr } = useQrDataUrl(getPublicTraceLink(batch.publicCode), 240)

  return (
    <section id="produto" aria-labelledby="produto-title" className="scroll-mt-16 bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading
          id="produto-title"
          eyebrow="Demonstração do produto"
          title="Conheça o passaporte digital AgroPass"
          subtitle="Um lote da demonstração, exibido com os mesmos dados que compradores consultam pelo QR Code."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-[var(--color-sand-200)] bg-[var(--color-sand-50)] p-6 sm:p-8">
            <span className="inline-flex rounded-full border border-[var(--color-sand-200)] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Lote de demonstração
            </span>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)]">
              {batch.code} — {PRODUCT_LABEL[batch.productType]}
            </h3>

            <dl className="mt-5">
              <Fact label="Origem">
                {farm.name} · {farm.city}, {farm.state}
              </Fact>
              <Fact label="Quantidade">{formatQuantity(batch.quantity, batch.unit)}</Fact>
              <Fact label="Status">{BATCH_STATUS_LABEL[batch.status]}</Fact>
              <Fact label="Criado em">{new Date(batch.createdAt).toLocaleDateString('pt-BR')}</Fact>
              <Fact label="Integridade">
                {integrity?.valid ? (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-green-700)]">
                    <ShieldCheck size={15} aria-hidden />
                    Verificada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-red-700)]">
                    <ShieldAlert size={15} aria-hidden />
                    Não verificada
                  </span>
                )}
              </Fact>
            </dl>

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              {qr && (
                <img
                  src={qr}
                  alt={`QR Code do passaporte ${batch.code}`}
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-xl border border-[var(--color-sand-200)] bg-white p-1.5"
                />
              )}
              <Link to={`/trace/${batch.publicCode}`} className={PRIMARY_BUTTON}>
                Abrir passaporte completo
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-sand-200)] bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-[var(--color-forest-900)]">Linha do tempo</h3>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Cada etapa registra o responsável, a data e um hash ligado à etapa anterior.
            </p>
            <ol className="mt-6" aria-label={`Etapas do lote ${batch.code}`}>
              {LIFECYCLE.map((status, index) => {
                const event = recorded.get(status)
                const state: StepState = !event ? 'pending' : status === batch.status ? 'current' : 'done'
                return (
                  <Step
                    key={status}
                    index={index}
                    status={status}
                    state={state}
                    event={event}
                    isLast={index === LIFECYCLE.length - 1}
                  />
                )
              })}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  )
}
