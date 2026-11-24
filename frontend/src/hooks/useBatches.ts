import { useQuery } from '@tanstack/react-query'
import { batchesApi } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo-context'
import { findDemoBatch, listDemoBatches } from '@/mocks/demo-store'
import type { Batch, PaginatedResponse, PaginationParams } from '@/types/api'

function demoBatchesResponse(): PaginatedResponse<Batch> {
  const data = listDemoBatches()
  return {
    data,
    pagination: { page: 1, limit: 50, totalItems: data.length, totalPages: 1 },
  }
}

// The demo store is local and cheap to read, so demo queries never go stale:
// batches created during the demo show up on the next read.
export function useBatches(params?: PaginationParams) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['batches', isDemoMode ? 'demo' : 'live', params],
    queryFn: isDemoMode
      ? async () => demoBatchesResponse()
      : () => batchesApi.list(params),
    staleTime: isDemoMode ? 0 : 30_000,
  })
}

export function useBatch(id: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['batches', isDemoMode ? 'demo' : 'live', id],
    queryFn: isDemoMode
      ? async () => {
          const batch = findDemoBatch(id ?? '')
          if (!batch) throw new Error('Lote não encontrado')
          return batch
        }
      : () => batchesApi.getOne(id!),
    enabled: Boolean(id),
    staleTime: isDemoMode ? 0 : 30_000,
    retry: isDemoMode ? false : 1,
  })
}
