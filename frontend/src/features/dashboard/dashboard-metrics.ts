import type { Batch, Farm } from '@/types/api'

export type DashboardMetrics = {
  totalFarms: number
  totalBatches: number
  tracedBatches: number
  blockchainProofBatches: number
  batchesInTransit: number
  deliveredBatches: number
}

export function deriveDashboardMetrics(
  farms: Farm[],
  batches: Batch[],
): DashboardMetrics {
  return {
    totalFarms: farms.length,
    totalBatches: batches.length,
    tracedBatches: batches.filter((batch) => batch.status !== 'CREATED').length,
    blockchainProofBatches: batches.filter((batch) => batch.blockchain.status === 'CONFIRMED').length,
    batchesInTransit: batches.filter((batch) => batch.status === 'IN_TRANSIT').length,
    deliveredBatches: batches.filter((batch) =>
      ['DELIVERED', 'CLOSED'].includes(batch.status),
    ).length,
  }
}
