import type {
  Batch,
  PaginatedResponse,
  PaginationParams,
  ProductType,
  TraceEvent,
} from '@/types/api'
import { api } from './client'

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
  tokenAddress: string | null
  tokenizedAt: string
  metadataUri: string
  mintTxHash: string
  merkleTree: string
}

// QR codes, PNG labels and print sheets are generated in the browser from
// the batch publicCode (see features/qr), so they also work in demo mode.
export const batchesApi = {
  list: (params: PaginationParams = {}) =>
    api.get<PaginatedResponse<Batch>>(`/batches${api.query({ page: params.page ?? 1, limit: params.limit ?? 50 })}`),

  getOne: (id: string) =>
    api.get<Batch>(`/batches/${id}`),

  create: (payload: CreateBatchInput) =>
    api.post<Batch>('/batches', payload),

  mint: (id: string) =>
    api.post<MintBatchResponse>(`/batches/${id}/mint`, {}),

  getEvents: (batchId: string) =>
    api.get<TraceEvent[]>(`/batches/${batchId}/events`),
}
