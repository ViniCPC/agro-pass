import { create, toCanvas, toDataURL, type QRCodeErrorCorrectionLevel } from 'qrcode'

// Medium correction survives scuffed or slightly wet labels while keeping the
// symbol small enough for 16 labels per page.
const ERROR_CORRECTION: QRCodeErrorCorrectionLevel = 'M'
// Pure black on white scans most reliably, in print and on screen.
const COLORS = { dark: '#000000', light: '#ffffff' }
// Printed codes keep the standard 4-module quiet zone.
export const PRINT_QUIET_ZONE = 4

export function renderQrDataUrl(text: string, width: number, margin = 2) {
  return toDataURL(text, {
    errorCorrectionLevel: ERROR_CORRECTION,
    margin,
    width,
    color: COLORS,
  })
}

export function createQrMatrix(text: string) {
  return create(text, { errorCorrectionLevel: ERROR_CORRECTION }).modules
}

// PNG label: the QR with the batch code under it, ready to print or paste
// into another layout.
export async function renderQrLabelPng(url: string, code: string): Promise<Blob> {
  const size = 1024
  const footer = 170

  const qrCanvas = document.createElement('canvas')
  await toCanvas(qrCanvas, url, {
    errorCorrectionLevel: ERROR_CORRECTION,
    margin: PRINT_QUIET_ZONE,
    width: size,
    color: COLORS,
  })

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size + footer
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível neste navegador.')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(qrCanvas, 0, 0, size, size)

  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#000000'
  context.font = '700 64px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  context.fillText(code, size / 2, size + 40, size - 80)
  context.fillStyle = '#4B5653'
  context.font = '400 32px system-ui, -apple-system, "Segoe UI", sans-serif'
  context.fillText('Escaneie para ver o passaporte AgroPass', size / 2, size + 110, size - 80)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar o PNG.'))),
      'image/png',
    )
  })
}
