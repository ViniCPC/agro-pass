import { ApiError } from '@/api/client'

// The API answers errors as JSON with a message (string or validation list).
export function apiErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { message?: string | string[] }
      const message = Array.isArray(body.message) ? body.message.join(' ') : body.message
      if (message) return message
    } catch {
      // Not a JSON body.
    }
    return error.message || fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}
