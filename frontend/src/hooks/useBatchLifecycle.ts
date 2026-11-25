import { useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi, type CorrectionInput, type StageDetails } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo-context'
import {
  advanceDemoBatch,
  cancelDemoBatch,
  correctDemoEvent,
  setDemoBatchVisibility,
} from '@/mocks/demo-store'
import type { BatchStatus } from '@/types/api'

export function useRefreshBatch() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['batches'] })
    queryClient.invalidateQueries({ queryKey: ['batch-events'] })
    queryClient.invalidateQueries({ queryKey: ['batch-documents'] })
    queryClient.invalidateQueries({ queryKey: ['public-passport'] })
  }
}

export function useAdvanceBatch() {
  const { isDemoMode, demoRole } = useDemoMode()
  const refresh = useRefreshBatch()

  return useMutation({
    mutationFn: async ({
      batchId,
      status,
      details = {},
    }: {
      batchId: string
      status: BatchStatus
      details?: StageDetails
    }) =>
      isDemoMode
        ? advanceDemoBatch(batchId, status, details, demoRole)
        : batchesApi.updateStatus(batchId, status, details),
    onSuccess: refresh,
  })
}

export function useCancelBatch() {
  const { isDemoMode, demoRole } = useDemoMode()
  const refresh = useRefreshBatch()

  return useMutation({
    mutationFn: async ({ batchId, notes }: { batchId: string; notes: string }) =>
      isDemoMode ? cancelDemoBatch(batchId, notes, demoRole) : batchesApi.cancel(batchId, notes),
    onSuccess: refresh,
  })
}

export function useCorrectEvent() {
  const { isDemoMode, demoRole } = useDemoMode()
  const refresh = useRefreshBatch()

  return useMutation({
    mutationFn: async ({ batchId, ...input }: CorrectionInput & { batchId: string }) =>
      isDemoMode ? correctDemoEvent(batchId, input, demoRole) : batchesApi.addCorrection(batchId, input),
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
