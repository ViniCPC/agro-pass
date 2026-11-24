import { useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo-context'
import { advanceDemoBatch, setDemoBatchVisibility } from '@/mocks/demo-store'
import type { BatchStatus } from '@/types/api'

function useRefreshBatch() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['batches'] })
    queryClient.invalidateQueries({ queryKey: ['batch-events'] })
    queryClient.invalidateQueries({ queryKey: ['public-passport'] })
  }
}

export function useAdvanceBatch() {
  const { isDemoMode } = useDemoMode()
  const refresh = useRefreshBatch()

  return useMutation({
    mutationFn: async ({ batchId, status }: { batchId: string; status: BatchStatus }) =>
      isDemoMode ? advanceDemoBatch(batchId, status) : batchesApi.updateStatus(batchId, status),
    onSuccess: refresh,
  })
}

export function useSetBatchVisibility() {
  const { isDemoMode } = useDemoMode()
  const refresh = useRefreshBatch()

  return useMutation({
    mutationFn: async ({ batchId, isPublic }: { batchId: string; isPublic: boolean }) =>
      isDemoMode
        ? setDemoBatchVisibility(batchId, isPublic)
        : batchesApi.setVisibility(batchId, isPublic),
    onSuccess: refresh,
  })
}
