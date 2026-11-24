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
    refetchInterval: (query) => proofPollInterval(query.state.data),
  })
}

// The proof is registered in the background after closing: keep polling while
// it is pending, and briefly right after closing (the close response can come
// back before the registration has started). With the blockchain disabled the
// status stays NONE and polling stops after that window.
const JUST_CLOSED_WINDOW_MS = 30_000

function proofPollInterval(batch: Batch | undefined) {
  if (!batch) return false
  if (batch.blockchain.status === 'PENDING') return 2_000
  const justClosed =
    batch.status === 'CLOSED' &&
    batch.blockchain.status === 'NONE' &&
    batch.closedAt !== null &&
    Date.now() - new Date(batch.closedAt).getTime() < JUST_CLOSED_WINDOW_MS
  return justClosed ? 1_500 : false
}
