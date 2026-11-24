import { useQrDataUrl } from '@/hooks/useQrDataUrl'
import { SHEET, SHEET_LAYOUT, type LabelCopies } from './qr-sheet'

interface QrSheetPreviewProps {
  url: string
  code: string
  caption: string
  copies: LabelCopies
}

// Percentages of the A4 width, so the preview scales like the printed page.
const pct = (mm: number) => `${(mm / SHEET.width) * 100}%`

export function QrSheetPreview({ url, code, caption, copies }: QrSheetPreviewProps) {
  const { data: src } = useQrDataUrl(url, 256)
  const { columns, rows } = SHEET_LAYOUT[copies]
  const compact = copies === 16

  return (
    <div
      className="mx-auto w-full max-w-[360px] rounded-md bg-white shadow-[var(--shadow-card-hover)]"
      style={{ aspectRatio: `${SHEET.width} / ${SHEET.height}`, containerType: 'inline-size' }}
      aria-label={`Pré-visualização A4 com ${copies} etiquetas`}
      role="img"
    >
      <div className="flex h-full flex-col" style={{ padding: pct(SHEET.margin) }}>
        <div style={{ height: `${(SHEET.header / SHEET.width) * 100}cqw` }}>
          <p className="truncate font-semibold text-[var(--color-ink)]" style={{ fontSize: '3.4cqw' }}>
            AgroPass · Etiquetas do lote {code}
          </p>
          <p className="truncate text-[var(--color-ink-muted)]" style={{ fontSize: '2.3cqw' }}>
            Cada QR abre o passaporte público: {url}
          </p>
        </div>

        <div
          className="grid min-h-0 flex-1"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            gap: `${(SHEET.gap / SHEET.width) * 100}cqw`,
          }}
        >
          {Array.from({ length: copies }, (_, index) => (
            <div
              key={index}
              className="flex min-h-0 flex-col items-center justify-center border border-dashed border-[var(--color-slate-400)]"
              style={{ padding: '1cqw' }}
            >
              {src ? (
                <img src={src} alt="" className="aspect-square min-h-0 max-w-full flex-1 object-contain" />
              ) : (
                <div className="aspect-square min-h-0 flex-1 bg-[var(--color-slate-100)]" />
              )}
              <p className="max-w-full truncate font-mono font-bold text-black" style={{ fontSize: compact ? '2.1cqw' : '2.9cqw' }}>
                {code}
              </p>
              <p className="max-w-full truncate text-[var(--color-ink-muted)]" style={{ fontSize: compact ? '1.5cqw' : '2.1cqw' }}>
                {caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
