import type { Batch, BatchStatus, ProductType } from '@/types/api'

export interface BatchFilters {
  product: ProductType | ''
  status: BatchStatus | ''
  farmName: string
  onChainOnly: boolean
}

export const DEFAULT_BATCH_FILTERS: BatchFilters = {
  product: '',
  status: '',
  farmName: '',
  onChainOnly: false,
}

export function applyBatchFilters(batches: Batch[], filters: BatchFilters): Batch[] {
  return batches.filter((batch) => {
    if (filters.product && batch.productType !== filters.product) return false
    if (filters.status && batch.status !== filters.status) return false
    if (filters.farmName && batch.farm.name !== filters.farmName) return false
    if (filters.onChainOnly) {
      const onChain = Boolean(batch.tokenAddress)
      if (!onChain) return false
    }
    return true
  })
}
