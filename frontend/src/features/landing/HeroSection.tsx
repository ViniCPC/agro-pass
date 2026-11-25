import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { BATCH_STATUS_LABEL, PRODUCT_LABEL } from '@/features/trace/trace.utils'
import type { PublicBatch } from '@/types/api'
import { LandingEnterDemoButton } from './EnterDemoButton'
import { HERO, PHOTOS } from './landing-content'
import { dayMonth, stageLabel } from './landing-format'
import { Container, TEXT_LINK } from './landing-ui'
import { LotLabel } from './LotLabel'

// The record the QR opens, cut out of the public passport.
function PassportCut({ passport }: { passport: PublicBatch }) {
  const { batch, farm, traceEvents, integrity } = passport
  const first = traceEvents[0]
  const last = traceEvents.at(-1)

  return (
    <div className="w-full rounded-[12px] bg-white p-5 text-carbon shadow-[0_24px_60px_-28px_rgba(16,27,22,0.45)] lg:w-[19.5rem]">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-carbon-500">
        {PRODUCT_LABEL[batch.productType]} · Lote de demonstração
      </p>
      <p className="mt-3 text-[17px] font-semibold tracking-tight">Origem registrada</p>
      <p className="text-[13px] text-carbon-700">
        {farm.name} · {farm.city}/{farm.state}
      </p>

      <div className="mt-4 border-t border-line pt-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <span
            aria-hidden
            className={`flex h-4 w-4 items-center justify-center rounded-full ${integrity?.valid ? 'bg-lime text-carbon' : 'bg-alert text-white'}`}
          >
            <Check size={11} strokeWidth={3} />
          </span>
          {traceEvents.length} etapas · {integrity?.valid ? 'Integridade verificada' : 'Integridade com falha'}
        </p>
        <ol aria-label="Etapas do lote" className="mt-3 grid grid-cols-7 gap-1">
          {traceEvents.map((event, index) => (
            <li key={event.id} title={`${stageLabel(event.type)} · ${dayMonth(event.createdAt)}`}>
              <span aria-hidden className={`block h-1.5 rounded-full ${index === traceEvents.length - 1 ? 'bg-lime' : 'bg-carbon'}`} />
              <span className="sr-only">{stageLabel(event.type)}</span>
            </li>
          ))}
        </ol>
        {first && last && (
          <p className="mt-1.5 flex justify-between font-mono text-[10px] text-carbon-500">
            <span>{dayMonth(first.createdAt)}</span>
            <span>{dayMonth(last.createdAt)}</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="font-mono text-[13px] font-semibold">{batch.code}</span>
        <span className="rounded-[6px] bg-frost px-2 py-1 text-xs font-semibold text-carbon-700">{BATCH_STATUS_LABEL[batch.status]}</span>
      </div>
    </div>
  )
}

interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

// A thin line from the label on the sack to the record it opens, measured
// from the real positions so it follows any layout.
function useConnector() {
  const box = useRef<HTMLDivElement>(null)
  const from = useRef<HTMLDivElement>(null)
  const to = useRef<HTMLDivElement>(null)
  const [line, setLine] = useState<Line | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      if (!box.current || !from.current || !to.current) return
      const b = box.current.getBoundingClientRect()
      const f = from.current.getBoundingClientRect()
      const t = to.current.getBoundingClientRect()
      if (!b.width || !f.width || !t.width) return setLine(null)
      setLine({
        x1: f.right - b.left - 10,
        y1: f.top - b.top + 14,
        x2: t.left - b.left,
        y2: t.top - b.top + t.height * 0.42,
      })
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (observer && box.current) observer.observe(box.current)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return { box, from, to, line }
}

function HeroComposition({ passport }: { passport: PublicBatch }) {
  const { box, from, to, line } = useConnector()

  return (
    // On phones the composition is the product alone: the passport cut with
    // the label over its corner. The photo and the line join it on desktop.
    <div ref={box} className="relative flex w-full flex-col sm:mx-auto sm:max-w-[26rem] lg:block lg:h-[36rem] lg:max-w-none">
      <figure className="relative hidden overflow-hidden rounded-[12px] lg:absolute lg:inset-y-0 lg:left-0 lg:right-[12%] lg:block">
        <picture>
          {/* Only wide screens download the photo. */}
          <source media="(min-width: 1024px)" srcSet={PHOTOS.warehouse.src} />
          <img
            src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
            alt={PHOTOS.warehouse.alt}
            className="h-full w-full object-cover object-[88%_center]"
            width={1600}
            height={1067}
          />
        </picture>
        <figcaption className="absolute bottom-3 right-3 rounded-[4px] bg-black/45 px-2 py-0.5 text-[10px] text-white/85 backdrop-blur-sm">
          {PHOTOS.warehouse.credit}
        </figcaption>
      </figure>

      <div
        ref={from}
        className="relative z-10 order-2 -mt-3 mr-3 w-fit self-end rotate-[-3deg] lg:absolute lg:bottom-[13%] lg:left-[7%] lg:order-none lg:mr-0 lg:mt-0"
      >
        <LotLabel passport={passport} />
      </div>

      <div ref={to} className="relative order-1 lg:absolute lg:right-0 lg:top-[9%] lg:z-10 lg:order-none">
        <PassportCut passport={passport} />
      </div>

      {line && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full overflow-visible lg:block">
          <path
            d={`M ${line.x1} ${line.y1} C ${line.x1 + 60} ${line.y1 - 30}, ${line.x2 - 70} ${line.y2 + 40}, ${line.x2} ${line.y2}`}
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
          <circle cx={line.x1} cy={line.y1} r="4.5" fill="var(--color-lime)" stroke="var(--color-carbon)" strokeWidth="1.5" />
          <circle cx={line.x2} cy={line.y2} r="4.5" fill="var(--color-lime)" stroke="var(--color-carbon)" strokeWidth="1.5" />
        </svg>
      )}
    </div>
  )
}

export function HeroSection({ passport }: { passport: PublicBatch | null }) {
  const passportPath = passport ? `/trace/${passport.batch.publicCode}` : '/demo'

  return (
    <section aria-labelledby="hero-title" className="overflow-hidden bg-frost">
      <Container className="grid items-center gap-12 pb-20 pt-10 sm:pt-14 lg:grid-cols-2 lg:gap-14 lg:pb-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-carbon-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime ring-2 ring-lime/30" />
            {HERO.badge}
          </p>
          <h1
            id="hero-title"
            className="mt-7 text-[3rem] font-semibold leading-[0.96] tracking-[-0.045em] text-carbon sm:text-[4.4rem] lg:text-[4.9rem]"
          >
            {HERO.titleLead}{' '}
            <span className="block text-carbon-500">{HERO.titleRest}</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-carbon-700">{HERO.subtitle}</p>

          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <LandingEnterDemoButton />
            <Link to={passportPath} className={TEXT_LINK}>
              Abrir um passaporte
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <p className="mt-5 text-sm text-carbon-500">{HERO.note}</p>
        </div>

        {passport && <HeroComposition passport={passport} />}
      </Container>
    </section>
  )
}
