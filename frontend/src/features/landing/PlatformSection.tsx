import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Paperclip, Printer } from 'lucide-react'
import { getPublicTraceLink } from '@/features/qr/qr.utils'
import {
  DOCUMENT_SHORT_LABEL,
  PRODUCT_LABEL,
  formatQuantity,
  shortHash,
} from '@/features/trace/trace.utils'
import { useQrDataUrl } from '@/hooks/useQrDataUrl'
import type { PublicBatch } from '@/types/api'
import { PLATFORM, type PlatformTab } from './landing-content'
import { calendarDate, dayMonth, stageLabel } from './landing-format'
import { Container, SectionTitle } from './landing-ui'
import { LotLabel } from './LotLabel'

// An app screen: a slim title bar, then the content.
function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_24px_60px_-36px_rgba(16,27,22,0.35)]">
      <p className="flex items-center justify-between border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-carbon-500">
        <span>{title}</span>
        <span className="text-carbon">AgroPass</span>
      </p>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-carbon-500">{label}</p>
      <p className="mt-1 rounded-[8px] border border-line bg-frost px-3 py-2 text-sm text-carbon">{value}</p>
    </div>
  )
}

function RegisterScreen({ passport }: { passport: PublicBatch }) {
  const { batch, farm, traceEvents } = passport
  const { data: qr } = useQrDataUrl(getPublicTraceLink(batch.publicCode), 240)
  const first = traceEvents[0]

  return (
    <Screen title="Novo lote">
      <div className="grid gap-6 md:grid-cols-[1.35fr_1fr]">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Produto" value={PRODUCT_LABEL[batch.productType]} />
          <Field label="Quantidade" value={formatQuantity(batch.quantity, batch.unit)} />
          <div className="col-span-2">
            <Field label="Propriedade" value={farm.name} />
          </div>
          <Field label="Município" value={`${farm.city}/${farm.state}`} />
          <Field label="Coordenadas" value={`${farm.latitude}, ${farm.longitude}`} />
          <Field label="Colheita" value={calendarDate(batch.harvestDate)} />
          <div className="flex items-end">
            <span className="flex w-full items-center justify-center rounded-[8px] bg-carbon py-2 text-sm font-semibold text-white">Criar lote</span>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-[10px] bg-frost p-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-carbon">
              <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-lime">
                <Check size={11} strokeWidth={3} />
              </span>
              Lote criado
            </p>
            <p className="mt-2 font-mono text-lg font-semibold text-carbon">{batch.code}</p>
            {first && (
              <p className="font-mono text-[11px] text-carbon-500">
                Registro #1 · hash {shortHash(first.eventHash, 6, 4)}
              </p>
            )}
          </div>
          {qr ? (
            <img src={qr} alt="" width={112} height={112} className="mt-4 h-28 w-28 self-start rounded bg-white p-1.5" />
          ) : (
            <div aria-hidden className="mt-4 h-28 w-28 rounded bg-white" />
          )}
        </div>
      </div>
    </Screen>
  )
}

function TrackScreen({ passport }: { passport: PublicBatch }) {
  const { batch, traceEvents, documents, integrity } = passport
  const current = traceEvents.length - 1

  return (
    <Screen title={`Lotes / ${batch.code}`}>
      <dl className="grid grid-cols-3 gap-3">
        {[
          ['Eventos', String(traceEvents.length)],
          ['Documentos', String(documents.length)],
          ['Integridade', integrity?.valid ? 'Íntegra' : 'Falha'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] bg-frost px-3 py-2.5">
            <dt className="text-[11px] text-carbon-500">{label}</dt>
            <dd className="text-lg font-semibold tracking-tight text-carbon">{value}</dd>
          </div>
        ))}
      </dl>
      <ol aria-label={`Etapas registradas do lote ${batch.code}`} className="mt-5">
        {traceEvents.map((event, index) => (
          <li
            key={event.id}
            className={`grid grid-cols-[1rem_minmax(0,1fr)_auto] items-baseline gap-3 border-t border-line py-2.5 text-sm ${index === current ? 'font-semibold' : ''}`}
          >
            <span aria-hidden className={`mt-1 h-2.5 w-2.5 self-start rounded-full ${index === current ? 'bg-lime ring-4 ring-lime/30' : 'bg-carbon'}`} />
            <span className="min-w-0 text-carbon">
              {stageLabel(event.type)}
              <span className="block truncate text-xs font-normal text-carbon-500">
                {event.actorName}
                {event.documents[0] && (
                  <span className="ml-2 inline-flex items-center gap-1 text-carbon-700">
                    <Paperclip size={11} aria-hidden />
                    {DOCUMENT_SHORT_LABEL[event.documents[0].type]}
                  </span>
                )}
              </span>
            </span>
            <span className="font-mono text-xs font-normal text-carbon-500">{dayMonth(event.createdAt)}</span>
          </li>
        ))}
      </ol>
    </Screen>
  )
}

function ShareScreen({ passport }: { passport: PublicBatch }) {
  const { batch, farm, traceEvents, integrity } = passport

  return (
    <Screen title="Compartilhar passaporte">
      <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
        <div>
          <LotLabel passport={passport} className="shadow-none ring-1 ring-line" />
          <p className="mt-4 flex items-center gap-2 text-xs text-carbon-700">
            <Printer size={14} aria-hidden />
            Folha A4 com 4, 8 ou 16 etiquetas
          </p>
          <div aria-hidden className="mt-2 grid w-28 grid-cols-2 gap-1 rounded-[6px] border border-line bg-frost p-1.5">
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} className="h-4 rounded-[2px] bg-white ring-1 ring-line" />
            ))}
          </div>
        </div>
        <div className="rounded-[10px] bg-frost p-4">
          <p className="font-mono text-[11px] text-carbon-500">{getPublicTraceLink(batch.publicCode).replace(/^https?:\/\//, '')}</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-carbon">Lote {batch.code}</p>
          <p className="text-sm text-carbon-700">
            {farm.name}, {farm.city}/{farm.state}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-carbon">
            <span aria-hidden className="h-2 w-2 rounded-full bg-lime ring-4 ring-lime/30" />
            {traceEvents.length} etapas · {integrity?.valid ? 'cadeia íntegra' : 'cadeia com falha'}
          </p>
          <p className="mt-3 text-xs text-carbon-500">Abre direto pelo QR. Consulta sem login.</p>
        </div>
      </div>
    </Screen>
  )
}

const SCREENS: Record<PlatformTab, (props: { passport: PublicBatch }) => ReactNode> = {
  registrar: RegisterScreen,
  acompanhar: TrackScreen,
  compartilhar: ShareScreen,
}

export function PlatformSection({ passport }: { passport: PublicBatch }) {
  const [active, setActive] = useState<PlatformTab>('registrar')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const reduceMotion = useReducedMotion()
  const ActiveScreen = SCREENS[active]

  // Arrow keys move between tabs, as the ARIA tabs pattern expects.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = PLATFORM.tabs.findIndex((tab) => tab.id === active)
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
    let next = step === undefined ? -1 : (index + step + PLATFORM.tabs.length) % PLATFORM.tabs.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = PLATFORM.tabs.length - 1
    if (next < 0) return
    event.preventDefault()
    setActive(PLATFORM.tabs[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section id="plataforma" aria-labelledby="plataforma-title" className="scroll-mt-16 border-t border-line bg-white py-20 sm:py-28">
      <Container>
        <SectionTitle id="plataforma-title" label="Plataforma" title={PLATFORM.title} subtitle={PLATFORM.subtitle} />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div role="tablist" aria-label="Partes da plataforma" aria-orientation="vertical" onKeyDown={onKeyDown} className="grid grid-cols-3 gap-1.5 lg:flex lg:flex-col lg:gap-0">
            {PLATFORM.tabs.map((tab, index) => {
              const selected = tab.id === active
              return (
                <button
                  key={tab.id}
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`painel-${tab.id}`}
                  aria-labelledby={`tab-label-${tab.id}`}
                  aria-describedby={`tab-text-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(tab.id)}
                  className={`group relative rounded-[10px] px-2.5 py-2.5 text-left sm:px-4 sm:py-3 transition-colors lg:rounded-none lg:border-l-2 lg:px-6 lg:py-5 ${
                    selected ? 'bg-frost lg:border-lime lg:bg-transparent' : 'lg:border-line hover:bg-frost lg:hover:bg-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`hidden font-mono text-xs sm:inline ${selected ? 'text-carbon' : 'text-carbon-500'}`}>{String(index + 1).padStart(2, '0')}</span>
                    <span id={`tab-label-${tab.id}`} className={`text-[13px] font-semibold leading-tight tracking-tight sm:text-lg lg:whitespace-nowrap lg:text-xl ${selected ? 'text-carbon' : 'text-carbon-500 group-hover:text-carbon'}`}>
                      {tab.label}
                    </span>
                  </span>
                  <span id={`tab-text-${tab.id}`} className={`mt-2 hidden max-w-sm text-[15px] leading-relaxed text-carbon-700 ${selected ? 'lg:block' : ''}`}>{tab.text}</span>
                </button>
              )
            })}
          </div>

          <div>
            <p className="mb-4 text-[15px] leading-relaxed text-carbon-700 lg:hidden">{PLATFORM.tabs.find((tab) => tab.id === active)?.text}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                role="tabpanel"
                id={`painel-${active}`}
                aria-labelledby={`tab-${active}`}
                tabIndex={0}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <ActiveScreen passport={passport} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  )
}
