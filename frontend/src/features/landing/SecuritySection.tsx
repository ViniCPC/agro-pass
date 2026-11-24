import { Check, Link2 } from 'lucide-react'
import { shortHash } from '@/features/trace/trace.utils'
import type { PublicBatch } from '@/types/api'
import { SECURITY, STAGE_COPY } from './landing-content'
import { Container, SectionHeading } from './landing-ui'

// Shows the chaining with the real hashes of the demo batch: each block's
// "anterior" is the hash of the block above it.
function HashChain({ passport }: { passport: PublicBatch }) {
  const blocks = passport.traceEvents.slice(0, 3)
  return (
    <figure className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <ol className="space-y-3">
        {blocks.map((event, index) => (
          <li key={event.id}>
            <div className="rounded-2xl bg-white p-4 text-[var(--color-forest-900)]">
              <p className="text-sm font-semibold">
                <span className="mr-1.5 font-mono text-xs text-[var(--color-ink-subtle)]">#{event.sequence}</span>
                {STAGE_COPY[event.type as keyof typeof STAGE_COPY]?.done ?? event.type}
              </p>
              <dl className="mt-2 grid gap-1 font-mono text-[11px] text-[var(--color-ink-muted)]">
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-sans font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">hash</dt>
                  <dd className="truncate" title={event.eventHash}>{shortHash(event.eventHash, 12, 8)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-sans font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">anterior</dt>
                  <dd className="truncate" title={event.previousHash ?? undefined}>
                    {event.previousHash ? shortHash(event.previousHash, 12, 8) : 'início da cadeia'}
                  </dd>
                </div>
              </dl>
            </div>
            {index < blocks.length - 1 && (
              <div aria-hidden className="ml-6 flex h-6 items-center gap-2 border-l-2 border-dashed border-[var(--color-leaf-500)] pl-3 text-[11px] text-white/60">
                vinculado ao registro anterior
              </div>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 text-xs text-white/60">
        Hashes SHA-256 reais das primeiras etapas do lote {passport.batch.code}, da demonstração.
      </figcaption>
    </figure>
  )
}

export function SecuritySection({ passport }: { passport: PublicBatch | null }) {
  return (
    <section id="seguranca" aria-labelledby="seguranca-title" className="scroll-mt-16 bg-[var(--color-forest-900)] py-16 text-white sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading id="seguranca-title" eyebrow="Segurança e integridade" title={SECURITY.title} tone="dark" />
          <p className="mt-4 text-base leading-relaxed text-white/80">{SECURITY.text}</p>
          <ul className="mt-6 space-y-3">
            {SECURITY.points.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-leaf-500)]/30 text-[var(--color-leaf-100)]">
                  <Check size={13} aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-start gap-2 text-sm text-white/60">
            <Link2 size={15} className="mt-0.5 shrink-0" aria-hidden />
            {SECURITY.blockchain}
          </p>
        </div>
        {passport && <HashChain passport={passport} />}
      </Container>
    </section>
  )
}
