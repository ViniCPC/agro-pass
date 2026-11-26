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

// The dashboard sentence, with singular and plural agreeing with the counts.
export function describeTraceability({ totalBatches, tracedBatches, blockchainProofBatches }: DashboardMetrics) {
  if (totalBatches === 0) return 'Nenhum lote cadastrado ainda. Crie o primeiro para começar a cadeia de eventos.'

  if (totalBatches === 1) {
    const traced = tracedBatches === 1 ? 'já tem etapas registradas' : 'ainda não tem etapas registradas'
    const proof = blockchainProofBatches === 1 ? 'e conta com prova blockchain' : 'e ainda não tem prova blockchain'
    return `O único lote ${traced} na cadeia ${proof}.`
  }

  const traced =
    tracedBatches === 0
      ? `Nenhum dos ${totalBatches} lotes tem etapas registradas na cadeia ainda`
      : `${tracedBatches} de ${totalBatches} lotes já ${tracedBatches === 1 ? 'tem' : 'têm'} etapas registradas na cadeia`
  const proof =
    blockchainProofBatches === 0
      ? 'nenhum conta com prova blockchain'
      : `${blockchainProofBatches} ${blockchainProofBatches === 1 ? 'conta' : 'contam'} com prova blockchain`
  return `${traced}, e ${proof}.`
}
