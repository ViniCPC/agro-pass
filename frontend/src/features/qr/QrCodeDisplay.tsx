import { resolveAssetUrl } from './qr.utils'

interface QrCodeDisplayProps {
  qrCodeUrl: string | null | undefined
  batchCode: string
  size?: number
}

export function QrCodeDisplay({
  qrCodeUrl,
  batchCode,
  size = 240,
}: QrCodeDisplayProps) {
  const src = resolveAssetUrl(qrCodeUrl)
  const imageSize = Math.max(200, size)

  return (
    <div className="inline-flex flex-col items-center gap-2.5">
      <div
        className="rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-card)]"
        style={{ width: imageSize + 24, minWidth: 224 }}
      >
        {src ? (
          <img
            src={src}
            alt={`QR code for ${batchCode}`}
            width={imageSize}
            height={imageSize}
            className="mx-auto block rounded-md bg-white object-contain"
          />
        ) : (
          <div
            className="mx-auto flex items-center justify-center rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-slate-50)] text-xs text-[var(--color-ink-subtle)]"
            style={{ width: imageSize, height: imageSize }}
          >
            QR not generated yet
          </div>
        )}
      </div>

      <p className="rounded bg-[var(--color-border-soft)] px-2 py-1 font-mono text-xs text-[var(--color-ink-muted)]">
        {batchCode}
      </p>
    </div>
  )
}
