import type { jsPDF as JsPdf } from 'jspdf'
import { createQrMatrix, PRINT_QUIET_ZONE } from './qr-render'

export const LABEL_COPIES = [4, 8, 16] as const
export type LabelCopies = (typeof LABEL_COPIES)[number]

// Shared by the PDF and its on-screen preview, so the preview is what prints.
export const SHEET_LAYOUT: Record<LabelCopies, { columns: number; rows: number }> = {
  4: { columns: 2, rows: 2 },
  8: { columns: 2, rows: 4 },
  16: { columns: 4, rows: 4 },
}

// A4 portrait, in millimetres.
export const SHEET = {
  width: 210,
  height: 297,
  margin: 12,
  header: 16,
  gap: 4,
}

export interface QrSheetInput {
  url: string
  code: string
  caption: string
  copies: LabelCopies
}

type QrMatrix = ReturnType<typeof createQrMatrix>

// Vector modules print sharp at any label size. Horizontal runs are merged
// into one rectangle, slightly taller than a module, so viewers do not show
// hairline gaps between rows.
function drawQr(doc: JsPdf, matrix: QrMatrix, x: number, y: number, size: number) {
  const count = matrix.size
  const moduleSize = size / (count + PRINT_QUIET_ZONE * 2)
  const origin = PRINT_QUIET_ZONE * moduleSize

  doc.setFillColor(0, 0, 0)
  for (let row = 0; row < count; row += 1) {
    let column = 0
    while (column < count) {
      if (!matrix.get(row, column)) {
        column += 1
        continue
      }
      const start = column
      while (column < count && matrix.get(row, column)) column += 1
      doc.rect(
        x + origin + start * moduleSize,
        y + origin + row * moduleSize,
        (column - start) * moduleSize,
        moduleSize + 0.02,
        'F',
      )
    }
  }
}

export async function buildQrSheetPdf({ url, code, caption, copies }: QrSheetInput) {
  // Loaded on demand: jsPDF is only needed when someone downloads a sheet.
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  doc.setProperties({ title: `Etiquetas QR - ${code}`, creator: 'AgroPass' })

  const matrix = createQrMatrix(url)
  const { margin, header, gap } = SHEET
  const contentWidth = SHEET.width - margin * 2
  const contentHeight = SHEET.height - margin * 2 - header

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(26, 33, 32)
  doc.text(`AgroPass · Etiquetas do lote ${code}`, margin, margin + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(75, 86, 83)
  doc.text(`Cada QR abre o passaporte público: ${url}`, margin, margin + 9.5, {
    maxWidth: contentWidth,
  })

  const { columns, rows } = SHEET_LAYOUT[copies]
  const cellWidth = (contentWidth - gap * (columns - 1)) / columns
  const cellHeight = (contentHeight - gap * (rows - 1)) / rows
  const compact = copies === 16
  const textBlock = compact ? 10 : 14
  const top = margin + header

  for (let index = 0; index < copies; index += 1) {
    const x = margin + (index % columns) * (cellWidth + gap)
    const y = top + Math.floor(index / columns) * (cellHeight + gap)

    doc.setLineDashPattern([1.5, 1.5], 0)
    doc.setLineWidth(0.2)
    doc.setDrawColor(148, 163, 184)
    doc.rect(x, y, cellWidth, cellHeight, 'S')
    doc.setLineDashPattern([], 0)

    const qrSize = Math.min(cellWidth - 4, cellHeight - textBlock - 2)
    const qrX = x + (cellWidth - qrSize) / 2
    const qrY = y + (cellHeight - qrSize - textBlock) / 2
    drawQr(doc, matrix, qrX, qrY, qrSize)

    const centerX = x + cellWidth / 2
    const textTop = qrY + qrSize
    doc.setFont('courier', 'bold')
    doc.setFontSize(compact ? 8 : 10.5)
    doc.setTextColor(0, 0, 0)
    doc.text(code, centerX, textTop + (compact ? 2.5 : 4), { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(compact ? 5.5 : 7.5)
    doc.setTextColor(75, 86, 83)
    doc.text(caption, centerX, textTop + (compact ? 5.5 : 8.5), {
      align: 'center',
      maxWidth: cellWidth - 4,
    })
  }

  return doc.output('blob')
}
