import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { farmsApi, type CreateFarmInput } from '@/api/farmsApi'
import { producersApi } from '@/api/producersApi'
import { useDemoMode } from '@/contexts/demo-context'
import { createDemoFarm, demoFarmsResponse, findDemoFarm, type CreateDemoFarmInput } from '@/mocks/demo-farms'
import type { PaginationParams } from '@/types/api'

// Demo properties live in this browser, so demo reads never go stale:
// a property registered during the demo shows up on the next read.
export function useFarms(params?: PaginationParams) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['farms', isDemoMode ? 'demo' : 'live', params],
    queryFn: isDemoMode
      ? async () => demoFarmsResponse()
      : () => farmsApi.list(params),
    staleTime: isDemoMode ? 0 : 30_000,
  })
}

export function useFarm(id: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['farms', isDemoMode ? 'demo' : 'live', id],
    queryFn: isDemoMode
      ? async () => {
          const farm = findDemoFarm(id ?? '')
          if (!farm) throw new Error('Fazenda não encontrada')
          return farm
        }
      : () => farmsApi.getOne(id!),
    enabled: Boolean(id),
    staleTime: isDemoMode ? 0 : 30_000,
    retry: isDemoMode ? false : 1,
  })
}

export type CreateFarmPayload =
  | { mode: 'live'; input: CreateFarmInput }
  | { mode: 'demo'; input: CreateDemoFarmInput }

export function useCreateFarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateFarmPayload) =>
      payload.mode === 'demo' ? createDemoFarm(payload.input) : farmsApi.create(payload.input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farms'] }),
  })
}

// Admins pick the producer a property belongs to.
export function useProducers(enabled: boolean) {
  return useQuery({
    queryKey: ['producers'],
    queryFn: () => producersApi.list(),
    enabled,
    staleTime: 60_000,
  })
}
