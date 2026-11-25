import type { DocumentType } from '@/types/api'

// Same rules as the API (backend/src/batches/document-upload.constants.ts and
// common/file-signature.ts), checked before sending so the visitor gets the
// message right away. The API checks again.
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024

export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const

export const ACCEPT_ATTRIBUTE = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string; hint: string }> = [
  { value: 'INVOICE', label: 'Nota fiscal', hint: 'Venda ou remessa do lote.' },
  { value: 'WAREHOUSE_RECEIPT', label: 'Recibo de armazém', hint: 'Entrada do lote no armazém.' },
  { value: 'CAR', label: 'Cadastro Ambiental Rural (CAR)', hint: 'Contém dados pessoais: mantenha privado.' },
  { value: 'OTHER', label: 'Outra evidência', hint: 'Laudo, certificado, foto da carga.' },
]

const SIGNATURES: Array<{ mimeType: string; bytes: number[] }> = [
  { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
]

export function detectMimeType(bytes: Uint8Array): string | null {
  const match = SIGNATURES.find(({ bytes: signature }) =>
    bytes.length >= signature.length && signature.every((byte, index) => bytes[index] === byte),
  )
  return match?.mimeType ?? null
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

// Blob.arrayBuffer is missing in some test environments; FileReader is not.
export function readBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

// Returns the problem with the file, or null when it can be sent.
export async function checkDocumentFile(file: File): Promise<string | null> {
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `Arquivo de ${formatFileSize(file.size)}: o máximo é 5 MB.`
  }
  if (!(ACCEPTED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    return 'Formato não aceito. Envie PDF, JPG ou PNG.'
  }
  const head = await readBytes(file.slice(0, 8))
  if (detectMimeType(head) !== file.type) {
    return 'O conteúdo do arquivo não corresponde a um PDF, JPG ou PNG válido.'
  }
  return null
}
