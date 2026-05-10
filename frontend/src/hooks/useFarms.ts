import { useQuery } from '@tanstack/react-query'
import { farmsApi } from '@/api/farmsApi'
import { useDemoMode } from '@/contexts/demo'
import { MOCK_FARMS, MOCK_FARMS_RESPONSE } from '@/mocks/farms.mock'
import type { PaginationParams } from '@/types/api'

export function useFarms(params?: PaginationParams) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['farms', isDemoMode ? 'demo' : 'live', params],
    queryFn: isDemoMode
      ? async () => MOCK_FARMS_RESPONSE
      : () => farmsApi.list(params),
    staleTime: isDemoMode ? Infinity : 30_000,
  })
}

export function useFarm(id: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['farms', isDemoMode ? 'demo' : 'live', id],
    queryFn: isDemoMode
      ? async () => {
          const farm = MOCK_FARMS.find((f) => f.id === id)
          if (!farm) throw new Error('Fazenda não encontrada')
          return farm
        }
      : () => farmsApi.getOne(id!),
    enabled: Boolean(id),
    staleTime: isDemoMode ? Infinity : 30_000,
  })
}
