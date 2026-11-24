import { useState } from 'react'
import { AlertTriangle, Check, Copy, Download, ExternalLink, Loader2, Lock, Printer } from 'lucide-react'
import { QrCodeDisplay } from './QrCodeDisplay'
import { PrintQrSheetDialog } from './PrintQrSheetDialog'
import { downloadBlobAsFile, getPublicTraceLink, isLocalOnlyUrl } from './qr.utils'
import { renderQrLabelPng } from './qr-render'

interface BatchQrCardProps {
  batchCode: string
  publicCode: string
  isPublic: boolean
  caption: string
  className?: string
}

export function BatchQrCard({
  batchCode,
  publicCode,
  isPublic,
  caption,
  className,
}: BatchQrCardProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const traceLink = getPublicTraceLink(publicCode)
  const isLocalOnly = isLocalOnlyUrl(traceLink)

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(traceLink)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 1600)
    } catch {
      setIsCopied(false)
    }
  }

  async function handleDownloadPng() {
    setError(null)
    setIsDownloading(true)
    try {
      downloadBlobAsFile(await renderQrLabelPng(traceLink, batchCode), `${batchCode}-qr.png`)
    } catch {
      setError('Não foi possível gerar o PNG. Tente novamente.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] ${
        className ?? ''
      }`}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[var(--color-ink)]">QR do passaporte público</h2>
        <p className="mt-0.5 text-sm text-[var(--color-ink-subtle)]">
          Qualquer pessoa que escanear abre a página pública do lote, sem login.
        </p>
      </div>

      <div className="mb-4 flex justify-center">
        <QrCodeDisplay value={traceLink} label={batchCode} size={200} />
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-lg bg-[var(--color-page)] p-2.5">
        <p className="min-w-0 flex-1 break-all font-mono text-[11px] leading-5 text-[var(--color-ink-muted)]">
          {traceLink}
        </p>
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-teal-700)]"
          aria-label={isCopied ? 'Link copiado' : 'Copiar link público'}
          title={isCopied ? 'Copiado' : 'Copiar link'}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {!isPublic && (
        <p className="mb-3 flex gap-2 rounded-lg bg-[var(--color-amber-50)] px-3 py-2 text-xs leading-5 text-[var(--color-amber-700)]">
          <Lock size={14} className="mt-0.5 shrink-0" />
          Lote privado: quem escanear verá “passaporte não encontrado” até um administrador publicá-lo.
        </p>
      )}

      {isLocalOnly && (
        <p className="mb-3 flex gap-2 rounded-lg bg-[var(--color-amber-50)] px-3 py-2 text-xs leading-5 text-[var(--color-amber-700)]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Este QR aponta para <strong>localhost</strong> e só abre neste computador. Para testar no
            celular, abra o app pelo IP da rede (<code>npm run dev:lan</code>); antes de imprimir
            etiquetas reais, defina <code>VITE_PUBLIC_APP_URL</code> com o domínio definitivo.
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={isDownloading}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[var(--color-teal-700)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Baixar PNG
        </button>
        <button
          type="button"
          onClick={() => setIsPrintOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
        >
          <Printer size={14} />
          Folha PDF
        </button>
        <a
          href={traceLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
        >
          <ExternalLink size={14} />
          Abrir página
        </a>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
          {error}
        </p>
      )}

      <PrintQrSheetDialog
        isOpen={isPrintOpen}
        url={traceLink}
        batchCode={batchCode}
        caption={caption}
        onClose={() => setIsPrintOpen(false)}
      />
    </section>
  )
}
