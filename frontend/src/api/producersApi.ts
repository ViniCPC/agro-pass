import type { PaginatedResponse, Producer } from '@/types/api'
import { api } from './client'

// Cooperatives and admins only: used when an admin registers a property.
export const producersApi = {
  list: () => api.get<PaginatedResponse<Producer>>(`/producers${api.query({ page: 1, limit: 100 })}`),
}
