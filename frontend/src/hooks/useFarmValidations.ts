import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eudrApi } from '@/api/eudrApi'
import { useDemoMode } from '@/contexts/demo'
import { MOCK_LAST_VALIDATION, MOCK_VALIDATION_HISTORY } from '@/mocks/eudrValidation.mock'
import type { EudrValidation, PaginationParams } from '@/types/api'

export function useFarmLastValidation(farmId: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['eudr', farmId, 'last-validation'],
    queryFn: isDemoMode
      ? async (): Promise<EudrValidation | null> =>
          MOCK_LAST_VALIDATION[farmId!] ?? null
      : () => eudrApi.getLastValidation(farmId!),
    enabled: Boolean(farmId),
    staleTime: isDemoMode ? Infinity : 60_000,
  })
}

export function useFarmValidationHistory(
  farmId: string | null,
  params?: PaginationParams,
) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['eudr', farmId, 'validations', params],
    queryFn: isDemoMode
      ? async () => MOCK_VALIDATION_HISTORY[farmId!] ?? { data: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } }
      : () => eudrApi.getValidationHistory(farmId!, params),
    enabled: Boolean(farmId),
    staleTime: isDemoMode ? Infinity : 60_000,
  })
}

export function useRunEudrValidation(farmId: string) {
  const { isDemoMode } = useDemoMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      eudrApi.validateFarm(
        farmId,
        isDemoMode ? { mode: 'MOCK', mockHectaresDeforested: 0 } : { mode: 'SEMI_AUTOMATIC' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', farmId] })
      queryClient.invalidateQueries({ queryKey: ['eudr', farmId] })
    },
  })
}
