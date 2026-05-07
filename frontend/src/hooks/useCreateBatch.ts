import { useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi, type CreateBatchInput, type MintBatchResponse } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo'
import { MOCK_FARMS } from '@/mocks/farms.mock'
import type { Batch, PaginatedResponse } from '@/types/api'

function makeDemoBatch(payload: CreateBatchInput): Batch {
  const farm = MOCK_FARMS.find((item) => item.id === payload.farmId)
  if (!farm) {
    throw new Error('Fazenda nao encontrada no demo mode.')
  }

  const year = new Date().getFullYear()
  const sequence = Math.floor(1000 + Math.random() * 9000)
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `batch-demo-${Date.now()}`

  return {
    id,
    code: `CAF-${year}-${sequence}`,
    productType: payload.productType,
    quantity: payload.quantity,
    unit: payload.unit,
    harvestDate: payload.harvestDate ?? null,
    status: 'CREATED',
    farm: {
      name: farm.name,
      latitude: farm.latitude,
      longitude: farm.longitude,
    },
    cnftAddress: null,
    mintTxHash: null,
    qrCodeUrl: null,
    createdAt: new Date().toISOString(),
  }
}

function upsertBatchResponse(
  current: PaginatedResponse<Batch>,
  nextBatch: Batch,
): PaginatedResponse<Batch> {
  const alreadyExists = current.data.some((batch) => batch.id === nextBatch.id)
  if (alreadyExists) return current

  return {
    ...current,
    data: [nextBatch, ...current.data],
    pagination: {
      ...current.pagination,
      totalItems: current.pagination.totalItems + 1,
      totalPages: Math.max(
        current.pagination.totalPages,
        Math.ceil((current.pagination.totalItems + 1) / current.pagination.limit),
      ),
    },
  }
}

export function useCreateBatch() {
  const queryClient = useQueryClient()
  const { isDemoMode } = useDemoMode()

  return useMutation({
    mutationFn: async (payload: CreateBatchInput) =>
      isDemoMode ? makeDemoBatch(payload) : batchesApi.create(payload),
    onSuccess: (createdBatch) => {
      queryClient.setQueriesData(
        { queryKey: ['batches'] },
        (current: unknown) => {
          if (
            !current ||
            typeof current !== 'object' ||
            !('data' in current) ||
            !Array.isArray((current as PaginatedResponse<Batch>).data)
          ) {
            return current
          }

          return upsertBatchResponse(
            current as PaginatedResponse<Batch>,
            createdBatch,
          )
        },
      )

      queryClient.setQueryData(['batches', createdBatch.id], createdBatch)
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
        return {
          message: 'cNFT minted successfully',
          batchId,
          batchCode: `CAF-${new Date().getFullYear()}-DEMO`,
          cnftAddress: 'DemoCnftAddress11111111111111111111111111111',
          metadataUri: 'https://demo.agropass.local/metadata.json',
          mintTxHash: 'DemoMintTxHash111111111111111111111111111111111111',
          merkleTree: 'DemoMerkleTree111111111111111111111111111111111111',
        }
      }

      return batchesApi.mint(batchId)
    },
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['batches', batchId] })
    },
  })
}
