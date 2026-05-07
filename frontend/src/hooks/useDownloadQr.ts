import { useCallback, useState } from 'react'
import { downloadUrlAsFile, resolveAssetUrl } from '@/features/qr/qr.utils'

interface DownloadQrOptions {
  qrCodeUrl: string | null | undefined
  fileName: string
}

export function useDownloadQr() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = useCallback(async ({ qrCodeUrl, fileName }: DownloadQrOptions) => {
    const resolvedUrl = resolveAssetUrl(qrCodeUrl)
    if (!resolvedUrl) {
      setError('QR code is not available for download yet.')
      return
    }

    setIsDownloading(true)
    setError(null)

    try {
      await downloadUrlAsFile(resolvedUrl, fileName)
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : 'Could not download QR image.'
      setError(message)
      throw downloadError
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return {
    download,
    isDownloading,
    error,
    clearError: () => setError(null),
  }
}
