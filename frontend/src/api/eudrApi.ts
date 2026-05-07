import type {
  EudrValidateResult,
  EudrValidation,
  EudrValidationMode,
  PaginatedResponse,
  PaginationParams,
} from '@/types/api'
import { api } from './client'

export interface RunValidationParams {
  mode?: EudrValidationMode
  mockHectaresDeforested?: number
}

export const eudrApi = {
  getLastValidation: (farmId: string) =>
    api.get<EudrValidation | null>(`/eudr/farms/${farmId}/last-validation`),

  getValidationHistory: (farmId: string, params: PaginationParams = {}) =>
    api.get<PaginatedResponse<EudrValidation>>(
      `/eudr/farms/${farmId}/validations${api.query({ page: params.page ?? 1, limit: params.limit ?? 20 })}`,
    ),

  validateFarm: (farmId: string, params: RunValidationParams = {}) =>
    api.post<EudrValidateResult>(`/eudr/farms/${farmId}/validate`, {
      mode: params.mode ?? 'SEMI_AUTOMATIC',
      ...(params.mockHectaresDeforested !== undefined && {
        mockHectaresDeforested: params.mockHectaresDeforested,
      }),
    }),
}
