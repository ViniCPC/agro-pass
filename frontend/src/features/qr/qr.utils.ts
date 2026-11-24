import { API_BASE_URL } from '@/api/client'

function normalizeBaseUrl(value: string | undefined) {
  const trimmed = value?.trim().replace(/\/+$/, '')
  return trimmed || null
}

const CONFIGURED_PUBLIC_APP_URL = normalizeBaseUrl(
  import.meta.env.VITE_PUBLIC_APP_URL as string | undefined,
)

export function resolveAssetUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null
  if (/^(https?:|data:|blob:)/i.test(pathOrUrl)) return pathOrUrl
  return `${API_BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

// Base URL printed in QR codes. A configured canonical URL wins over the
// current origin, so labels printed from a preview or staging host still
// open the production passport after the next deploy.
export function getPublicAppUrl() {
  if (CONFIGURED_PUBLIC_APP_URL) return CONFIGURED_PUBLIC_APP_URL
  return typeof window === 'undefined' ? '' : window.location.origin
}

export function getPublicTraceLink(publicCode: string) {
  return `${getPublicAppUrl()}/trace/${encodeURIComponent(publicCode)}`
}

// A QR that encodes localhost only opens on the computer that printed it.
export function isLocalOnlyUrl(url: string) {
  try {
    const { hostname } = new URL(url)
    return (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    )
  } catch {
    return false
  }
}

export function downloadBlobAsFile(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking synchronously can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
}
