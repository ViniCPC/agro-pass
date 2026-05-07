import { API_BASE_URL } from '@/api/client'

export function resolveAssetUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null
  if (/^(https?:|data:|blob:)/i.test(pathOrUrl)) return pathOrUrl
  return `${API_BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export function getPublicTraceLink(code: string) {
  const encodedCode = encodeURIComponent(code)
  if (typeof window === 'undefined') return `/trace/${encodedCode}`
  return `${window.location.origin}/trace/${encodedCode}`
}

export async function downloadUrlAsFile(url: string, fileName: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Could not download file.')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export function downloadBlobAsFile(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
