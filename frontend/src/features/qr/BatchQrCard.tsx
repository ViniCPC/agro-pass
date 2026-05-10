import { useState } from 'react'
import { Check, Copy, Download, Printer } from 'lucide-react'
import { QrCodeDisplay } from './QrCodeDisplay'
import { PrintQrSheetDialog } from './PrintQrSheetDialog'
import { getPublicTraceLink } from './qr.utils'
import { useDownloadQr } from '@/hooks/useDownloadQr'

interface BatchQrCardProps {
  batchId: string
  batchCode: string
  qrCodeUrl: string | null | undefined
  publicLink?: string | null
  className?: string
}

export function BatchQrCard({
  batchId,
  batchCode,
  qrCodeUrl,
  publicLink,
  className,
}: BatchQrCardProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const { download, isDownloading, error: downloadError, clearError } = useDownloadQr()

  const traceLink = publicLink ?? getPublicTraceLink(batchCode)

  async function handleCopyPublicLink() {
    try {
      await navigator.clipboard.writeText(traceLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1600)
    } catch {
      setIsCopied(false)
    }
  }

  async function handleDownload() {
    clearError()
    try {
      await download({
        qrCodeUrl,
        fileName: `${batchCode}.png`,
      })
    } catch {
      // Error state is surfaced by hook.
    }
  }

  return (
    <section
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] ${
        className ?? ''
      }`}
    >
      <div className="mb-4 flex flex-col items-center text-center">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Passaporte de rastreabilidade QR
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-subtle)]">
          Escaneie para verificar a rastreabilidade
        </p>
      </div>

      <div className="mb-4 flex justify-center">
        <QrCodeDisplay batchCode={batchCode} qrCodeUrl={qrCodeUrl} size={260} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-teal-700)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={14} />
          {isDownloading ? 'Baixando...' : 'Baixar PNG'}
        </button>
        <button
          type="button"
          onClick={() => setIsPrintOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
        >
          <Printer size={14} />
          Imprimir folha
        </button>
        <button
          type="button"
          onClick={handleCopyPublicLink}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? 'Copiado' : 'Copiar link público'}
        </button>
      </div>

      {downloadError && (
        <p className="mt-3 rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
          {downloadError}
        </p>
      )}

      <PrintQrSheetDialog
        isOpen={isPrintOpen}
        batchId={batchId}
        batchCode={batchCode}
        qrCodeUrl={qrCodeUrl}
        onClose={() => setIsPrintOpen(false)}
      />
    </section>
  )
}
