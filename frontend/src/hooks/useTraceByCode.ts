import { useQuery } from '@tanstack/react-query'
import { traceApi } from '@/api/traceApi'
import { useDemoMode } from '@/contexts/demo'
import { MOCK_PUBLIC_BATCHES } from '@/mocks/publicBatch.mock'

export function useTraceByCode(code: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['trace-by-code', isDemoMode ? 'demo' : 'live', code],
    queryFn: isDemoMode
      ? async () => {
          const data = MOCK_PUBLIC_BATCHES[code ?? '']
          if (!data) {
            throw new Error(`Lote "${code}" nao encontrado na demo.`)
          }
          return data
        }
      : () => traceApi.getByCode(code!),
    enabled: Boolean(code),
    staleTime: isDemoMode ? Infinity : 60_000,
    retry: isDemoMode ? false : 1,
  })
}
