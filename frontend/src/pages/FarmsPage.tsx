import { useMemo, useState } from 'react'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageContainer } from '@/components/PageContainer'
import { FarmCard } from '@/features/farms/FarmCard'
import { FarmsFilters, DEFAULT_FILTERS, applyFarmFilters, type FarmFilters } from '@/features/farms/FarmsFilters'
import { FarmsHeader } from '@/features/farms/FarmsHeader'
import { FarmsTable } from '@/features/farms/FarmsTable'
import { useFarms } from '@/hooks/useFarms'

export function FarmsPage() {
  const [filters, setFilters] = useState<FarmFilters>(DEFAULT_FILTERS)
  const { data, isLoading, error, refetch } = useFarms()

  const allFarms = data?.data ?? []
  const farms = useMemo(
    () => applyFarmFilters(allFarms, filters),
    [allFarms, filters],
  )

  return (
    <PageContainer className="space-y-5">
      <FarmsHeader farmCount={allFarms.length} filteredCount={farms.length} />

      <FarmsFilters filters={filters} onChange={setFilters} farms={allFarms} />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState
          description="Nao foi possivel carregar as fazendas. Verifique a conexao com o backend."
          onRetry={() => refetch()}
        />
      ) : farms.length === 0 ? (
        <FarmsTable farms={farms} />
      ) : (
        <>
          <div className="hidden sm:block">
            <FarmsTable farms={farms} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {farms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  )
}
