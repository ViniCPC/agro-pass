import type { Batch, Farm } from '@/types/api'

export type DashboardMetrics = {
  totalFarms: number
  compliantFarms: number
  farmsNeedingReview: number
  farmsAtRisk: number
  totalBatches: number
  tracedBatches: number
  blockchainProofBatches: number
}

export function deriveDashboardMetrics(
  farms: Farm[],
  batches: Batch[],
): DashboardMetrics {
  const compliantFarms = farms.filter(
    (farm) => farm.lastValidationStatus === 'COMPLIANT',
  ).length
  const farmsNeedingReview = farms.filter(
    (farm) => farm.lastValidationStatus === 'NEEDS_REVIEW',
  ).length
  const farmsAtRisk = farms.filter(
    (farm) => farm.lastValidationStatus === 'NON_COMPLIANT',
  ).length

  const tracedBatches = batches.filter((batch) => batch.status !== 'CREATED').length
  const blockchainProofBatches = batches.filter((batch) =>
    ['MINTED', 'IN_TRANSIT', 'EXPORTED'].includes(batch.status),
  ).length

  return {
    totalFarms: farms.length,
    compliantFarms,
    farmsNeedingReview,
    farmsAtRisk,
    totalBatches: batches.length,
    tracedBatches,
    blockchainProofBatches,
  }
}
