import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Loader2, Printer, X } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { downloadBlobAsFile } from './qr.utils'
import { buildQrSheetPdf, LABEL_COPIES, type LabelCopies } from './qr-sheet'
import { QrSheetPreview } from './QrSheetPreview'

interface PrintQrSheetDialogProps {
  isOpen: boolean
  url: string
  batchCode: string
  caption: string
  onClose: () => void
}

type PendingAction = 'download' | 'print' | null

export function PrintQrSheetDialog({
  isOpen,
  url,
  batchCode,
  caption,
  onClose,
}: PrintQrSheetDialogProps) {
  const isMobile = useIsMobile()
  const [copies, setCopies] = useState<LabelCopies>(8)
  const [pending, setPending] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  function buildPdf() {
    return buildQrSheetPdf({ url, code: batchCode, caption, copies })
  }

  async function handleDownload() {
    setError(null)
    setPending('download')
    try {
      downloadBlobAsFile(await buildPdf(), `${batchCode}-etiquetas-${copies}.pdf`)
    } catch {
      setError('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setPending(null)
    }
  }

  // The tab is opened synchronously, inside the click, so pop-up blockers
  // allow it; the PDF is loaded into it once generated.
  async function handlePrint() {
    setError(null)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setError('O navegador bloqueou a nova aba. Use "Baixar PDF" e imprima o arquivo.')
      return
    }

    setPending('print')
    try {
      const objectUrl = URL.createObjectURL(await buildPdf())
      printWindow.location.href = objectUrl
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch {
      printWindow.close()
      setError('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setPending(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 z-50 bg-black/40 ${
            isMobile ? 'flex items-end justify-center p-0' : 'flex items-center justify-center p-4'
          }`}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-sheet-title"
            onClick={(event) => event.stopPropagation()}
            initial={isMobile ? { opacity: 0, y: 140 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 0, y: 140 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`w-full overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)] ${
              isMobile ? 'max-h-[92vh] rounded-t-[18px]' : 'max-h-[92vh] max-w-3xl rounded-[16px]'
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="qr-sheet-title" className="text-lg font-semibold text-[var(--color-ink)]">
                  Folha de etiquetas para impressão
                </h3>
                <p className="text-sm text-[var(--color-ink-subtle)]">
                  A4 com cortes tracejados. Cole uma etiqueta em cada saca ou fardo do lote.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-ink-subtle)] hover:bg-[var(--color-page)]"
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-start">
              <div className="space-y-4">
                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                    Etiquetas por folha
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {LABEL_COPIES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={copies === option}
                        onClick={() => setCopies(option)}
                        className={`min-h-[44px] rounded-lg px-2 text-sm font-semibold transition-colors ${
                          copies === option
                            ? 'bg-[var(--color-teal-700)] text-white'
                            : 'border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-teal-600)]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <p className="break-all rounded-lg bg-[var(--color-page)] p-3 font-mono text-[11px] leading-5 text-[var(--color-ink-muted)]">
                  {url}
                </p>

                {error && (
                  <p className="rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
                    {error}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={pending !== null}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending === 'download' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {pending === 'download' ? 'Gerando PDF...' : 'Baixar PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={pending !== null}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending === 'print' ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                    Abrir para imprimir
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--color-slate-100)] p-3">
                <p className="mb-2 text-center text-xs font-medium text-[var(--color-ink-subtle)]">
                  Pré-visualização · {copies} etiquetas
                </p>
                <QrSheetPreview url={url} code={batchCode} caption={caption} copies={copies} />
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
