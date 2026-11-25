import { useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi, type CreateBatchInput } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo-context'
import { createDemoBatch } from '@/mocks/demo-store'

export function useCreateBatch() {
  const queryClient = useQueryClient()
  const { isDemoMode, demoRole } = useDemoMode()

  return useMutation({
    mutationFn: async (payload: CreateBatchInput) =>
      isDemoMode ? createDemoBatch(payload, demoRole) : batchesApi.create(payload),
    onSuccess: (createdBatch) => {
      queryClient.setQueryData(
        ['batches', isDemoMode ? 'demo' : 'live', createdBatch.id],
        createdBatch,
      )
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}

// Manual retry of a failed proof (admin). Live API only: demo proofs are
// part of the bundled data.
export function useTokenizeBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (batchId: string) => batchesApi.tokenize(batchId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['public-passport'] })
    },
  })
}
