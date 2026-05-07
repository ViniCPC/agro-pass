import type { PublicBatch } from '@/types/api'
import { api } from './client'

export const traceApi = {
  getByCode: (code: string) =>
    api.get<PublicBatch>(`/public/batches/${encodeURIComponent(code)}`),
}
