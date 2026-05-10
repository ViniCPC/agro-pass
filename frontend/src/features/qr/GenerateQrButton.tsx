import { useEffect, useState } from 'react'
import { Loader2, QrCode } from 'lucide-react'
import type { GenerateQrResponse } from '@/api/batchesApi'
import { useGenerateQr } from '@/hooks/useGenerateQr'

interface GenerateQrButtonProps {
  batchId: string
  batchCode: string
  onGenerated?: (result: GenerateQrResponse) => void
}

export function GenerateQrButton({
  batchId,
  batchCode,
  onGenerated,
}: GenerateQrButtonProps) {
  const generateQr = useGenerateQr()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (generateQr.isPending) {
      setToast('Gerando QR...')
      return
    }

    if (generateQr.isSuccess) {
      setToast('QR gerado com sucesso')
      const timeoutId = window.setTimeout(() => setToast(null), 1800)
      return () => window.clearTimeout(timeoutId)
    }

    if (generateQr.isError) {
      setToast('Não foi possível gerar o QR')
      const timeoutId = window.setTimeout(() => setToast(null), 2200)
      return () => window.clearTimeout(timeoutId)
    }
  }, [generateQr.isPending, generateQr.isSuccess, generateQr.isError])

  async function handleGenerate() {
    try {
      const result = await generateQr.mutateAsync({ batchId, batchCode })
      onGenerated?.(result)
    } catch {
      // Error feedback is handled by toast state from mutation status.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generateQr.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {generateQr.isPending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <QrCode size={15} />
        )}
        {generateQr.isPending ? 'Gerando QR...' : 'Gerar QR'}
      </button>

      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-ink)] shadow-[var(--shadow-card-hover)]">
          {toast}
        </div>
      )}
    </>
  )
}
