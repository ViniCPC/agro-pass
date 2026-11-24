import type { Farm } from '@/types/api'

export interface FarmFilters {
  state: string
}

export const DEFAULT_FILTERS: FarmFilters = {
  state: '',
}

export function applyFarmFilters(farms: Farm[], filters: FarmFilters): Farm[] {
  return farms.filter((farm) => {
    if (filters.state && farm.state !== filters.state) return false
    return true
  })
}
