import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { traceApi } from '@/api/traceApi'
import { findDemoPassport, isDemoPublicCode } from '@/mocks/demo-store'

export class PassportNotFoundError extends Error {
  constructor(code: string) {
    super(`Passaporte "${code}" não encontrado.`)
    this.name = 'PassportNotFoundError'
  }
}

export function isPassportNotFound(error: unknown) {
  return (
    error instanceof PassportNotFoundError ||
    (error instanceof ApiError && error.status === 404)
  )
}

// Demo codes resolve from the bundled demo data whether or not demo mode is
// on, so the example passport opens on any phone without the API.
export function useTraceByCode(publicCode: string | null) {
  const isDemoCode = publicCode ? isDemoPublicCode(publicCode) : false

  return useQuery({
    queryKey: ['public-passport', publicCode],
    queryFn: async () => {
      if (isDemoCode) {
        const passport = findDemoPassport(publicCode!)
        if (!passport) throw new PassportNotFoundError(publicCode!)
        return passport
      }
      return traceApi.getByCode(publicCode!)
    },
    enabled: Boolean(publicCode),
    staleTime: isDemoCode ? 0 : 60_000,
    retry: (failureCount, error) =>
      !isDemoCode && !isPassportNotFound(error) && failureCount < 1,
  })
}
