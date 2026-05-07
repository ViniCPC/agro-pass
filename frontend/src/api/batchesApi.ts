import type {
  Batch,
  PaginatedResponse,
  PaginationParams,
  ProductType,
  TraceEvent,
} from '@/types/api'
import { API_BASE_URL, api } from './client'

export interface CreateBatchInput {
  farmId: string
  productType: ProductType
  quantity: number
  unit: string
  harvestDate?: string
}

export interface MintBatchResponse {
  message: string
  batchId: string
  batchCode: string
  cnftAddress: string | null
  metadataUri: string
  mintTxHash: string
  merkleTree: string
}

export interface GenerateQrResponse {
  qrCodeUrl: string
  targetUrl: string
  batchId: string
  batchCode: string
}

export const batchesApi = {
  list: (params: PaginationParams = {}) =>
    api.get<PaginatedResponse<Batch>>(`/batches${api.query({ page: params.page ?? 1, limit: params.limit ?? 50 })}`),

  getOne: (id: string) =>
    api.get<Batch>(`/batches/${id}`),

  create: (payload: CreateBatchInput) =>
    api.post<Batch>('/batches', payload),

  mint: (id: string) =>
    api.post<MintBatchResponse>(`/batches/${id}/mint`, {}),

  generateQr: (id: string) =>
    api.post<GenerateQrResponse>(`/batches/${id}/qrcode`, {}),

  downloadQrSheetPdf: async (id: string, copies: 4 | 8 | 16 = 8) => {
    const response = await fetch(
      `${API_BASE_URL}/batches/${id}/qrcode/print-sheet${api.query({ copies })}`,
      {
        method: 'GET',
        headers: { Accept: 'application/pdf' },
      },
    )

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      throw new Error(text || response.statusText)
    }

    return response.blob()
  },

  getEvents: (batchId: string) =>
    api.get<TraceEvent[]>(`/batches/${batchId}/events`),
}
