import { Download } from 'lucide-react'
import { QrCodeDisplay } from './QrCodeDisplay'
import { useDownloadQr } from '@/hooks/useDownloadQr'

interface TraceQrSectionProps {
  batchCode: string
  qrCodeUrl: string | null | undefined
}

export function TraceQrSection({ batchCode, qrCodeUrl }: TraceQrSectionProps) {
  const { download, isDownloading, error, clearError } = useDownloadQr()

  async function handleDownload() {
    clearError()
    try {
      await download({
        qrCodeUrl,
        fileName: `${batchCode}-trace.png`,
      })
    } catch {
      // Error state is surfaced by hook.
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Verification QR
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-subtle)]">
          Scan this QR code to verify traceability.
        </p>
        <p className="text-sm text-[var(--color-ink-subtle)]">
          Escaneie este QR para verificar a rastreabilidade.
        </p>
      </div>

      <div className="mb-4 flex justify-center">
        <QrCodeDisplay batchCode={batchCode} qrCodeUrl={qrCodeUrl} size={280} />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-teal-100)] bg-[var(--color-teal-50)] px-3.5 py-2 text-sm font-semibold text-[var(--color-teal-700)] hover:bg-[var(--color-teal-100)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={15} />
          {isDownloading ? 'Downloading...' : 'Download QR'}
        </button>
      </div>

      {error && (
        <p className="mx-auto mt-3 max-w-md rounded-md bg-[var(--color-red-50)] px-3 py-2 text-center text-xs text-[var(--color-red-700)]">
          {error}
        </p>
      )}
    </section>
  )
}
