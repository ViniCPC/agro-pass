import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Printer, X } from 'lucide-react'
import { batchesApi } from '@/api/batchesApi'
import { downloadBlobAsFile, resolveAssetUrl } from './qr.utils'
import { useDemoMode } from '@/contexts/demo'
import { useIsMobile } from '@/hooks/useIsMobile'

interface PrintQrSheetDialogProps {
  isOpen: boolean
  batchId: string
  batchCode: string
  qrCodeUrl: string | null | undefined
  onClose: () => void
}

const COPIES_OPTIONS = [4, 8, 16] as const
type CopiesOption = (typeof COPIES_OPTIONS)[number]

function getGridColumns(copies: CopiesOption) {
  if (copies === 4) return 2
  if (copies === 8) return 4
  return 4
}

export function PrintQrSheetDialog({
  isOpen,
  batchId,
  batchCode,
  qrCodeUrl,
  onClose,
}: PrintQrSheetDialogProps) {
  const { isDemoMode } = useDemoMode()
  const isMobile = useIsMobile()
  const [copies, setCopies] = useState<CopiesOption>(8)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const qrSrc = resolveAssetUrl(qrCodeUrl)
  const previewItems = useMemo(
    () => Array.from({ length: copies }, (_, index) => index),
    [copies],
  )
  const gridColumns = getGridColumns(copies)

  async function handleDownloadPdf() {
    if (isDemoMode) {
      handlePrintSheet()
      return
    }

    setError(null)
    setIsDownloading(true)
    try {
      const blob = await batchesApi.downloadQrSheetPdf(batchId, copies)
      downloadBlobAsFile(blob, `${batchCode}-qr-sheet-${copies}.pdf`)
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : 'Could not download PDF sheet.'
      setError(message)
    } finally {
      setIsDownloading(false)
    }
  }

  function handlePrintSheet() {
    if (!qrSrc) {
      setError('Generate QR first to print the sheet.')
      return
    }

    const itemsHtml = previewItems
      .map(
        () => `
          <div class="cell">
            <img src="${qrSrc}" alt="QR code ${batchCode}" />
            <div class="code">${batchCode}</div>
          </div>
        `,
      )
      .join('')

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=980,height=760')
    if (!printWindow) {
      setError('Popup blocked. Allow popups to print.')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${batchCode} QR sheet</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { margin: 0; font-family: Arial, sans-serif; color: #1a2120; }
            .sheet { padding: 8mm; }
            .header { margin-bottom: 6mm; }
            .title { font-size: 16px; font-weight: 700; margin-bottom: 2mm; }
            .subtitle { font-size: 11px; color: #4b5653; }
            .grid {
              display: grid;
              grid-template-columns: repeat(${gridColumns}, 1fr);
              gap: 4mm;
            }
            .cell {
              border: 1px dashed #94a3b8;
              padding: 3mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: ${copies === 16 ? '36mm' : '48mm'};
              background: #fff;
            }
            .cell img {
              width: ${copies === 16 ? '24mm' : '30mm'};
              height: ${copies === 16 ? '24mm' : '30mm'};
              object-fit: contain;
              background: #fff;
            }
            .code {
              margin-top: 2mm;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 8.5px;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div class="title">AgroPass QR Sheet - ${batchCode}</div>
              <div class="subtitle">Cole esses QR codes nos fardos antes de entregar pra cooperativa.</div>
            </div>
            <div class="grid">${itemsHtml}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 bg-black/40 ${
            isMobile ? 'flex items-end justify-center p-0' : 'flex items-center justify-center p-4'
          }`}
        >
          <motion.section
            initial={
              isMobile
                ? { opacity: 0, y: 140 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            animate={
              isMobile
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              isMobile
                ? { opacity: 0, y: 140 }
                : { opacity: 0, y: 10, scale: 0.98 }
            }
            transition={
              isMobile
                ? { type: 'spring', stiffness: 320, damping: 30 }
                : { type: 'spring', stiffness: 300, damping: 25 }
            }
            className={`w-full border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)] ${
              isMobile ? 'max-h-[90vh] overflow-y-auto rounded-t-[18px]' : 'max-w-4xl rounded-[16px]'
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                  Print QR sheet
                </h3>
                <p className="text-sm text-[var(--color-ink-subtle)]">
                  Cole esses QR codes nos fardos antes de entregar pra cooperativa.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-ink-subtle)] hover:bg-[var(--color-page)]"
                aria-label="Close print dialog"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2">
              {COPIES_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCopies(option)}
                  className={`min-h-[44px] rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                    copies === option
                      ? 'bg-[var(--color-teal-700)] text-white'
                      : 'border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-teal-600)]'
                  }`}
                >
                  {option} copies
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
              <div className="mb-3 border-b border-dashed border-[var(--color-border)] pb-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  A4 preview - {batchCode}
                </p>
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
              >
                {previewItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-dashed border-[var(--color-border)] p-2"
                  >
                    <div className="rounded border border-[var(--color-border-soft)] bg-white p-1.5">
                      {qrSrc ? (
                        <img
                          src={qrSrc}
                          alt={`QR preview ${item + 1}`}
                          className="mx-auto h-20 w-20 object-contain"
                        />
                      ) : (
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded border border-dashed border-[var(--color-border)] text-[10px] text-[var(--color-ink-subtle)]">
                          QR
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-center font-mono text-[10px] text-[var(--color-ink-muted)]">
                      {batchCode}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={14} />
                {isDownloading
                  ? 'Downloading...'
                  : isDemoMode
                    ? 'Save as PDF'
                    : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={handlePrintSheet}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
