import { useQuery } from '@tanstack/react-query'
import { batchesApi } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo'
import { MOCK_PUBLIC_BATCHES } from '@/mocks/publicBatch.mock'
import { MOCK_BATCHES } from '@/mocks/batches.mock'

export function useBatchEvents(batchId: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['batch-events', batchId],
    queryFn: isDemoMode
      ? async () => {
          const batch = MOCK_BATCHES.find((b) => b.id === batchId)
          const pub = batch ? MOCK_PUBLIC_BATCHES[batch.code] : undefined
          return pub?.traceEvents ?? []
        }
      : () => batchesApi.getEvents(batchId!),
    enabled: Boolean(batchId),
    staleTime: isDemoMode ? Infinity : 30_000,
  })
}
