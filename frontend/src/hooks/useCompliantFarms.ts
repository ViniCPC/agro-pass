import { useMemo } from 'react'
import { useFarms } from './useFarms'

export function useCompliantFarms() {
  const farmsQuery = useFarms()

  const compliantFarms = useMemo(
    () =>
      (farmsQuery.data?.data ?? []).filter(
        (farm) => farm.lastValidationStatus === 'COMPLIANT',
      ),
    [farmsQuery.data],
  )

  return {
    ...farmsQuery,
    data: compliantFarms,
  }
}
