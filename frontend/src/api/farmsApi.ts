import type { Farm, PaginatedResponse, PaginationParams } from '@/types/api'
import { api } from './client'

export interface CreateFarmInput {
  name: string
  city: string
  state: string
  latitude: number
  longitude: number
  carNumber?: string
  totalAreaHa?: number
  // The producer account the property belongs to. A producer can only
  // register properties for their own account; an admin picks one.
  producerId: string
}

export const farmsApi = {
  list: (params: PaginationParams = {}) =>
    api.get<PaginatedResponse<Farm>>(`/farms${api.query({ page: params.page ?? 1, limit: params.limit ?? 50 })}`),

  getOne: (id: string) =>
    api.get<Farm>(`/farms/${id}`),

  create: (payload: CreateFarmInput) =>
    api.post<Farm>('/farms', payload),
}
