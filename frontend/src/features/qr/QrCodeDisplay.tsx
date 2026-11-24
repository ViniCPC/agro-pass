import { useQrDataUrl } from '@/hooks/useQrDataUrl'

interface QrCodeDisplayProps {
  value: string
  label: string
  size?: number
}

export function QrCodeDisplay({ value, label, size = 220 }: QrCodeDisplayProps) {
  // Rendered at 2x so it stays crisp on high-density screens.
  const { data: src, isError } = useQrDataUrl(value, size * 2)

  return (
    <div className="inline-flex max-w-full flex-col items-center gap-2.5">
      <div className="max-w-full rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-card)]">
        {src ? (
          <img
            src={src}
            alt={`QR Code do passaporte ${label}`}
            width={size}
            height={size}
            className="mx-auto block h-auto max-w-full rounded-md bg-white"
            style={{ width: size }}
          />
        ) : (
          <div
            className="mx-auto flex max-w-full items-center justify-center rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-slate-50)] text-xs text-[var(--color-ink-subtle)]"
            style={{ width: size, aspectRatio: '1 / 1' }}
          >
            {isError ? 'Não foi possível gerar o QR' : 'Gerando QR...'}
          </div>
        )}
      </div>

      <p className="rounded bg-[var(--color-border-soft)] px-2 py-1 font-mono text-xs text-[var(--color-ink-muted)]">
        {label}
      </p>
    </div>
  )
}
