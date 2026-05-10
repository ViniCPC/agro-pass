import { useQuery } from '@tanstack/react-query'
import { batchesApi } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo'
import { MOCK_BATCHES, MOCK_BATCHES_RESPONSE } from '@/mocks/batches.mock'
import type { PaginationParams } from '@/types/api'

export function useBatches(params?: PaginationParams) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['batches', isDemoMode ? 'demo' : 'live', params],
    queryFn: isDemoMode
      ? async () => MOCK_BATCHES_RESPONSE
      : () => batchesApi.list(params),
    staleTime: isDemoMode ? Infinity : 30_000,
  })
}

export function useBatch(id: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['batches', isDemoMode ? 'demo' : 'live', id],
    queryFn: isDemoMode
      ? async () => {
          const batch = MOCK_BATCHES.find((b) => b.id === id)
          if (!batch) throw new Error('Lote não encontrado')
          return batch
        }
      : () => batchesApi.getOne(id!),
    enabled: Boolean(id),
    staleTime: isDemoMode ? Infinity : 30_000,
  })
}
