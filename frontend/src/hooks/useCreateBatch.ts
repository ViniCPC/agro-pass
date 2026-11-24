import { useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi, type CreateBatchInput, type MintBatchResponse } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo-context'
import { createDemoBatch, mintDemoBatch } from '@/mocks/demo-store'

export function useCreateBatch() {
  const queryClient = useQueryClient()
  const { isDemoMode } = useDemoMode()

  return useMutation({
    mutationFn: async (payload: CreateBatchInput) =>
      isDemoMode ? createDemoBatch(payload) : batchesApi.create(payload),
    onSuccess: (createdBatch) => {
      queryClient.setQueryData(
        ['batches', isDemoMode ? 'demo' : 'live', createdBatch.id],
        createdBatch,
      )
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}

export function useMintBatch() {
  const queryClient = useQueryClient()
  const { isDemoMode } = useDemoMode()

  return useMutation({
    mutationFn: async (batchId: string): Promise<MintBatchResponse> => {
      if (isDemoMode) {
        const minted = mintDemoBatch(batchId)
        return {
          message: 'Prova de demonstração registrada',
          batchId,
          batchCode: minted.batch?.code ?? '',
          tokenAddress: minted.tokenAddress,
          tokenizedAt: minted.tokenizedAt,
          metadataUri: '',
          mintTxHash: minted.txHash,
          merkleTree: '',
        }
      }

      return batchesApi.mint(batchId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['batch-events'] })
      queryClient.invalidateQueries({ queryKey: ['public-passport'] })
    },
  })
}
