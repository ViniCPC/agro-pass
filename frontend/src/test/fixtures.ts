import type { Batch, PublicBatch } from '@/types/api'

const FINAL_HASH = 'a'.repeat(64)

export function makePublicBatch(overrides: Partial<PublicBatch> = {}): PublicBatch {
  return {
    batch: {
      id: 'batch-1',
      code: 'AGP-2026-0002',
      productType: 'COFFEE',
      quantity: 240,
      unit: 'sacas',
      harvestDate: '2026-05-20T00:00:00Z',
      status: 'CLOSED',
      publicCode: 'AGP-2026-0002',
      isPublic: true,
      integrityHash: FINAL_HASH,
      closedAt: '2026-06-12T15:00:00Z',
      createdAt: '2026-05-20T09:00:00Z',
      updatedAt: '2026-06-12T15:00:00Z',
    },
    blockchain: {
      status: 'NONE',
      network: null,
      proofHash: null,
      tokenAddress: null,
      txHash: null,
      tokenizedAt: null,
      explorerTxUrl: null,
      explorerTokenUrl: null,
    },
    farm: {
      name: 'Fazenda Santa Fé',
      city: 'Rio Verde',
      state: 'GO',
      latitude: -17.8,
      longitude: -50.94,
      carNumber: 'GO-5214-X',
      totalAreaHa: 500,
      producer: { name: 'Carlos Alberto Mendes' },
    },
    traceEvents: [],
    documents: [],
    integrity: {
      valid: true,
      eventCount: 7,
      finalHash: FINAL_HASH,
      checkedAt: '2026-06-12T16:00:00Z',
      errors: [],
    },
    ...overrides,
  }
}

export function makeBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'batch-1',
    code: 'AGP-2026-0003',
    productType: 'COFFEE',
    quantity: 100,
    unit: 'sacas',
    harvestDate: null,
    status: 'CREATED',
    publicCode: 'AGP-2026-0003',
    isPublic: false,
    integrityHash: null,
    tokenAddress: null,
    tokenizedAt: null,
    closedAt: null,
    blockchain: {
      status: 'NONE',
      network: null,
      proofHash: null,
      txHash: null,
      attempts: 0,
      error: null,
      explorerTxUrl: null,
      explorerTokenUrl: null,
    },
    farm: { name: 'Fazenda Santa Fé', latitude: -17.8, longitude: -50.94 },
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z',
    ...overrides,
  }
}

export { FINAL_HASH }
