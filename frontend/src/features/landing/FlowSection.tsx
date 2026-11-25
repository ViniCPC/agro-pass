import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { PublicBatch, TraceEventType } from '@/types/api'
import { CHAIN, PHOTOS } from './landing-content'
import { dayMonth, stageLabel } from './landing-format'
import { Container, SectionTitle, TEXT_LINK } from './landing-ui'

export function FlowSection({ passport }: { passport: PublicBatch | null }) {
  const byType = new Map(passport?.traceEvents.map((event) => [event.type, event]) ?? [])
  const find = (type: TraceEventType) => byType.get(type)
  const harvest = find('HARVESTED')

  return (
    <section id="rastreabilidade" aria-labelledby="rastreabilidade-title" className="scroll-mt-16 bg-frost py-20 sm:py-28">
      <Container>
        <SectionTitle id="rastreabilidade-title" label="Rastreabilidade" title={CHAIN.title} subtitle={CHAIN.subtitle} />

        {/* The horizontal track: one node per participant, the buyer last. */}
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {CHAIN.actors.map((actor, index) => {
            const isBuyer = actor.stages.length === 0
            return (
              <li key={actor.name} className="relative lg:pr-8">
                <div aria-hidden className="relative mb-6 flex items-center">
                  <span
                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] ${
                      isBuyer ? 'bg-lime text-carbon ring-4 ring-lime/30' : 'bg-carbon text-white'
                    }`}
                  >
                    {index + 1}
                  </span>
                  {index < CHAIN.actors.length - 1 && <span className="absolute left-7 right-0 hidden h-px bg-carbon/20 lg:block" />}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-carbon">{actor.name}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-carbon-700">{actor.action}</p>

                {isBuyer ? (
                  passport && (
                    <Link to={`/trace/${passport.batch.publicCode}`} className={`${TEXT_LINK} mt-3`}>
                      Ver o passaporte
                      <ArrowRight size={16} aria-hidden />
                    </Link>
                  )
                ) : (
                  <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
                    {actor.stages.map((stage) => {
                      const event = find(stage)
                      return (
                        <li key={stage} className="text-sm">
                          <p className="font-medium text-carbon">{stageLabel(stage)}</p>
                          {event && (
                            <p className="font-mono text-[11px] text-carbon-500">
                              {dayMonth(event.createdAt)} · {event.actorName}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ol>

        {/* Field and product side by side, unevenly. */}
        <div className="mt-20 grid items-end gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14">
          <figure>
            <img
              src={PHOTOS.plantation.src}
              alt={PHOTOS.plantation.alt}
              width={1600}
              height={1063}
              loading="lazy"
              className="aspect-[16/10] w-full rounded-[12px] object-cover"
            />
            <figcaption className="mt-2 text-[11px] text-carbon-500">{PHOTOS.plantation.credit}</figcaption>
          </figure>
          <div className="lg:pb-8">
            <h3 className="text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.025em] text-carbon">{CHAIN.field.title}</h3>
            <p className="mt-4 text-[15px] leading-relaxed text-carbon-700">{CHAIN.field.text}</p>
            {harvest && (
              <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-carbon-500">Origem do lote</dt>
                  <dd className="text-right text-carbon">{harvest.location}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-carbon-500">Registro</dt>
                  <dd className="text-right font-mono text-[13px] text-carbon">
                    {dayMonth(harvest.createdAt)} · {harvest.actorName}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
