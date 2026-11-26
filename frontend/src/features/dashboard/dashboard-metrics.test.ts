import { describe, expect, it } from 'vitest'
import { describeTraceability, type DashboardMetrics } from './dashboard-metrics'

const metrics = (totalBatches: number, tracedBatches: number, blockchainProofBatches: number): DashboardMetrics => ({
  totalFarms: 1,
  totalBatches,
  tracedBatches,
  blockchainProofBatches,
  batchesInTransit: 0,
  deliveredBatches: 0,
})

describe('describeTraceability', () => {
  it('concorda singular e plural com as contagens', () => {
    expect(describeTraceability(metrics(3, 2, 1))).toBe(
      '2 de 3 lotes já têm etapas registradas na cadeia, e 1 conta com prova blockchain.',
    )
    expect(describeTraceability(metrics(3, 1, 2))).toBe(
      '1 de 3 lotes já tem etapas registradas na cadeia, e 2 contam com prova blockchain.',
    )
    expect(describeTraceability(metrics(4, 0, 0))).toBe(
      'Nenhum dos 4 lotes tem etapas registradas na cadeia ainda, e nenhum conta com prova blockchain.',
    )
  })

  it('trata um unico lote e nenhum lote', () => {
    expect(describeTraceability(metrics(1, 1, 1))).toBe(
      'O único lote já tem etapas registradas na cadeia e conta com prova blockchain.',
    )
    expect(describeTraceability(metrics(1, 0, 0))).toBe(
      'O único lote ainda não tem etapas registradas na cadeia e ainda não tem prova blockchain.',
    )
    expect(describeTraceability(metrics(0, 0, 0))).toMatch(/^Nenhum lote cadastrado/)
  })
})
