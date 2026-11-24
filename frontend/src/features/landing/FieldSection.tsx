import { Check, CheckCircle2, ChevronLeft } from 'lucide-react'
import { LIFECYCLE, nextStatus, roleFor } from '@/features/batches/lifecycle'
import { BATCH_STATUS_LABEL, ROLE_LABEL, formatDate, shortHash } from '@/features/trace/trace.utils'
import type { PublicBatch } from '@/types/api'
import { FIELD } from './landing-content'
import { Container, SectionHeading } from './landing-ui'

// The stage registration screen as the app shows it on a phone, filled with
// the demo batch.
function PhoneMockup({ passport }: { passport: PublicBatch }) {
  const { batch, traceEvents } = passport
  const reached = LIFECYCLE.indexOf(batch.status)
  const next = nextStatus(batch.status)
  const nextRole = next ? roleFor(next) : undefined
  const last = traceEvents.at(-1)

  return (
    <div
      role="img"
      aria-label={`Tela do celular para registrar a próxima etapa do lote ${batch.code}`}
      className="mx-auto w-[288px] rounded-[2.6rem] border-[10px] border-[var(--color-forest-950)] bg-[var(--color-forest-950)] shadow-[0_30px_70px_-30px_rgba(13,33,22,0.7)]"
    >
      <div className="overflow-hidden rounded-[1.9rem] bg-[var(--color-page)]">
        <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-[var(--color-ink)]">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-[var(--color-forest-950)]" />
          <span>4G</span>
        </div>
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-white px-4 py-3">
          <ChevronLeft size={16} className="text-[var(--color-ink-muted)]" />
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-ink)]">{batch.code}</p>
            <p className="text-[10px] text-[var(--color-ink-subtle)]">Registrar nova etapa</p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl bg-white p-3 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-7 gap-1">
              {LIFECYCLE.map((status, index) => (
                <span
                  key={status}
                  className={`h-1.5 rounded-full ${index <= reached ? 'bg-[var(--color-leaf-500)]' : 'bg-[var(--color-slate-100)]'}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[10px] text-[var(--color-ink-subtle)]">
              Etapa {reached + 1} de {LIFECYCLE.length}: {BATCH_STATUS_LABEL[batch.status]}
            </p>
          </div>

          {next && (
            <div className="rounded-xl bg-white p-3 shadow-[var(--shadow-card)]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">Próxima etapa</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{BATCH_STATUS_LABEL[next]}</p>
              {nextRole && (
                <p className="text-[11px] text-[var(--color-ink-muted)]">Responsável: {ROLE_LABEL[nextRole]}</p>
              )}
              <span className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[var(--color-forest-800)] text-[13px] font-semibold text-white">
                <CheckCircle2 size={15} />
                Registrar etapa
              </span>
              <p className="mt-2 text-[10px] leading-snug text-[var(--color-ink-subtle)]">
                Cada etapa vira um evento com hash encadeado ao anterior.
              </p>
            </div>
          )}

          {last && (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">Último registro</p>
              <p className="mt-1 text-[12px] font-medium text-[var(--color-ink)]">
                #{last.sequence} {BATCH_STATUS_LABEL[last.type as keyof typeof BATCH_STATUS_LABEL] ?? last.type} · {formatDate(last.createdAt)}
              </p>
              <p className="font-mono text-[10px] text-[var(--color-ink-subtle)]">hash {shortHash(last.eventHash, 8, 6)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function FieldSection({ passport }: { passport: PublicBatch | null }) {
  return (
    <section aria-labelledby="campo-title" className="overflow-hidden bg-[var(--color-sand-100)] py-16 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeading id="campo-title" eyebrow="Uso no campo" title={FIELD.title} />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {FIELD.points.map((point) => (
              <li key={point} className="flex items-center gap-3 rounded-xl border border-[var(--color-sand-200)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-forest-900)]">
                <Check size={16} className="shrink-0 text-[var(--color-leaf-600)]" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
        {passport && <PhoneMockup passport={passport} />}
      </Container>
    </section>
  )
}
