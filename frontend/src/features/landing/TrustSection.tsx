import { useMemo, useState } from 'react'
import { ExternalLink, Link2, Loader2 } from 'lucide-react'
import { resolveAssetUrl } from '@/features/qr/qr.utils'
import { DOCUMENT_LABEL, shortHash } from '@/features/trace/trace.utils'
import { sha256HexBytes } from '@/lib/sha256'
import { verifyDemoChain } from '@/mocks/demo-chain'
import { findDemoEventSpecs } from '@/mocks/demo-store'
import type { PublicBatch, PublicDocument } from '@/types/api'
import { TRUST } from './landing-content'
import { stageShort } from './landing-format'
import { Container, SectionTitle } from './landing-ui'

const PANEL = 'rounded-[12px] border border-white/10 bg-white/[0.04]'
const SMALL_BUTTON =
  'inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border border-white/25 px-3.5 text-[13px] font-semibold text-white transition-colors hover:border-white disabled:opacity-40'

type Check =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'done'; hash: string; matches: boolean }
  | { state: 'error' }

// Downloads the file and recomputes its SHA-256 in the browser, the same
// check anyone can run on a document attached to a passport.
function DocumentRow({ document }: { document: PublicDocument }) {
  const href = resolveAssetUrl(document.fileUrl)
  const [check, setCheck] = useState<Check>({ state: 'idle' })

  async function verify() {
    if (!href) return
    setCheck({ state: 'checking' })
    try {
      const response = await fetch(href)
      if (!response.ok) throw new Error(String(response.status))
      const hash = sha256HexBytes(new Uint8Array(await response.arrayBuffer()))
      setCheck({ state: 'done', hash, matches: hash === document.fileHash })
    } catch {
      setCheck({ state: 'error' })
    }
  }

  return (
    <li className="border-b border-white/10 py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold">{DOCUMENT_LABEL[document.type]}</p>
        <p className="font-mono text-[11px] text-white/50">{document.originalName}</p>
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-white/70" title={document.fileHash}>
        SHA-256 registrado {shortHash(document.fileHash, 14, 10)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {href && (
          <button type="button" onClick={verify} disabled={check.state === 'checking'} className={SMALL_BUTTON}>
            {check.state === 'checking' && <Loader2 size={12} className="animate-spin" aria-hidden />}
            Conferir arquivo
          </button>
        )}
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-[38px] items-center gap-1 text-[13px] font-semibold text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white">
            Abrir PDF
            <ExternalLink size={12} aria-hidden />
          </a>
        )}
      </div>
      <p aria-live="polite" className="mt-2 font-mono text-[11px]">
        {check.state === 'done' &&
          (check.matches ? (
            <span className="text-lime">Confere: o arquivo baixado tem o mesmo hash registrado.</span>
          ) : (
            <span className="text-alert-300">Não confere: o arquivo baixado tem hash {shortHash(check.hash, 10, 8)}.</span>
          ))}
        {check.state === 'error' && <span className="text-alert-300">Não foi possível baixar o arquivo agora.</span>}
      </p>
    </li>
  )
}

// The reader edits a copy of the data recorded at the receiving stage, and
// the chain is checked again exactly like the API does: recompute each hash
// from its data and compare it with the stored one.
function useTamperCheck(passport: PublicBatch) {
  const { traceEvents } = passport
  const recorded = useMemo(() => findDemoEventSpecs(passport.batch.publicCode), [passport.batch.publicCode])
  const target = recorded?.specs.findIndex((spec) => spec.type === 'RECEIVED') ?? -1
  const original = target >= 0 ? (recorded?.specs[target].notes ?? '') : ''
  const [note, setNote] = useState(original)

  const checks = useMemo(() => {
    if (!recorded) return null
    const specs = recorded.specs.map((spec, index) => (index === target ? { ...spec, notes: note } : spec))
    return verifyDemoChain(recorded.batchId, specs, traceEvents)
  }, [recorded, target, note, traceEvents])

  return { editable: Boolean(recorded) && target >= 0, original, note, setNote, checks }
}

export function TrustSection({ passport }: { passport: PublicBatch }) {
  const { traceEvents, documents } = passport
  const { editable, original, note, setNote, checks } = useTamperCheck(passport)
  const broken = checks?.find((check) => !check.hashMatches || !check.linked)
  const passing = checks?.filter((check) => check.hashMatches && check.linked).length ?? traceEvents.length

  return (
    <section id="integridade" aria-labelledby="integridade-title" className="scroll-mt-16 bg-deep py-20 text-white sm:py-28">
      <Container>
        <SectionTitle id="integridade-title" label="Documentos e integridade" title={TRUST.title} tone="dark" />

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-2">
          <div id="documentos" className={`${PANEL} scroll-mt-20 p-6`}>
            <h3 className="text-xl font-semibold tracking-tight">{TRUST.docsTitle}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70">{TRUST.docsText}</p>
            <ul aria-label="Documentos do lote" className="mt-3">
              {documents.map((document) => (
                <DocumentRow key={document.id} document={document} />
              ))}
            </ul>
          </div>

          <div className={`${PANEL} p-6`}>
            <h3 className="text-xl font-semibold tracking-tight">{TRUST.integrityTitle}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70">{TRUST.integrityText}</p>
            {editable && (
              <div className="mt-5">
                <label htmlFor="tamper-note" className="block font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                  {TRUST.field}
                </label>
                <input
                  id="tamper-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  spellCheck={false}
                  className="mt-2 w-full rounded-[8px] border border-white/20 bg-black/20 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-lime focus:ring-2 focus:ring-lime/25"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setNote(TRUST.tamperTo)} disabled={note === TRUST.tamperTo} className={SMALL_BUTTON}>
                    Trocar 120 por 150 sacas
                  </button>
                  <button type="button" onClick={() => setNote(original)} disabled={note === original} className={SMALL_BUTTON}>
                    Restaurar o registro original
                  </button>
                </div>
              </div>
            )}

            <div aria-live="polite" className="mt-5">
              {broken ? (
                <div className="rounded-[10px] bg-alert/20 p-4 ring-1 ring-alert-300/40">
                  <p className="text-[15px] font-semibold">
                    Inconsistência na etapa #{broken.sequence}: os dados armazenados não correspondem ao hash do evento.
                  </p>
                  <dl className="mt-3 space-y-1 font-mono text-[11px]">
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-white/55">registrado</dt>
                      <dd className="break-all">{shortHash(broken.storedHash, 16, 12)}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-white/55">recalculado</dt>
                      <dd className="break-all text-alert-300">{shortHash(broken.recalculatedHash, 16, 12)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">{TRUST.hide}</p>
                </div>
              ) : (
                <p className="flex items-center gap-2 rounded-[10px] bg-lime/10 p-4 font-mono text-sm font-semibold text-lime ring-1 ring-lime/30">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-lime" />
                  Cadeia íntegra: {passing} de {traceEvents.length} etapas conferem.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* The chain, left to right: each block's "anterior" is the hash of the one before. */}
        <ol aria-label="Cadeia de hashes do lote" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {traceEvents.map((event, index) => {
            const check = checks?.[index]
            const failed = check && (!check.hashMatches || !check.linked)
            return (
              <li key={event.id} className={`${PANEL} p-3.5 ${failed ? 'border-alert-300/60 bg-alert/20' : ''}`}>
                <p className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-white/50">{String(event.sequence).padStart(2, '0')}</span>
                  <span className={`font-mono text-[10px] font-semibold uppercase ${failed ? 'text-alert-300' : 'text-lime'}`}>
                    {failed ? 'Não confere' : 'Confere'}
                  </span>
                </p>
                <p className="mt-2 truncate text-sm font-semibold">{stageShort(event.type)}</p>
                <dl className="mt-2 space-y-0.5 font-mono text-[10px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-white/45">anterior</dt>
                    <dd className="text-white/70">{event.previousHash ? shortHash(event.previousHash, 4, 3) : 'início'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-white/45">hash</dt>
                    <dd className={failed ? 'text-alert-300' : 'text-white'}>{shortHash(event.eventHash, 4, 3)}</dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>

        <p className="mt-10 flex max-w-2xl gap-3 text-sm text-white/65">
          <Link2 size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold text-white">{TRUST.extraTitle}. </span>
            {TRUST.extra}
          </span>
        </p>
      </Container>
    </section>
  )
}
