import type { Batch, PaginatedResponse, PaginationParams, TraceEvent } from '@/types/api'
import { api } from './client'

export const batchesApi = {
  list: (params: PaginationParams = {}) =>
    api.get<PaginatedResponse<Batch>>(`/batches${api.query({ page: params.page ?? 1, limit: params.limit ?? 50 })}`),

  getOne: (id: string) =>
    api.get<Batch>(`/batches/${id}`),

  getEvents: (batchId: string) =>
    api.get<TraceEvent[]>(`/batches/${batchId}/events`),
}
