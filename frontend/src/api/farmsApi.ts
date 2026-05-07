import type { Farm, PaginatedResponse, PaginationParams } from '@/types/api'
import { api } from './client'

export const farmsApi = {
  list: (params: PaginationParams = {}) =>
    api.get<PaginatedResponse<Farm>>(`/farms${api.query({ page: params.page ?? 1, limit: params.limit ?? 50 })}`),

  getOne: (id: string) =>
    api.get<Farm>(`/farms/${id}`),
}
