import { useState, useMemo } from 'react'
import { useFarms } from '@/hooks/useFarms'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { FarmsHeader } from '@/features/farms/FarmsHeader'
import { FarmsFilters, DEFAULT_FILTERS, applyFarmFilters, type FarmFilters } from '@/features/farms/FarmsFilters'
import { FarmsTable } from '@/features/farms/FarmsTable'
import { FarmCard } from '@/features/farms/FarmCard'
import { PageContainer } from '@/components/PageContainer'

export function FarmsPage() {
  const [filters, setFilters] = useState<FarmFilters>(DEFAULT_FILTERS)
  const { data, isLoading, error, refetch } = useFarms()

  const allFarms = data?.data ?? []
  const farms = useMemo(() => applyFarmFilters(allFarms, filters), [allFarms, filters])

  return (
    <PageContainer className="space-y-5">
      <FarmsHeader farmCount={allFarms.length} filteredCount={farms.length} />

      <FarmsFilters filters={filters} onChange={setFilters} farms={allFarms} />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState
          description="Não foi possível carregar as fazendas. Verifique a conexão com o backend."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {/* Tabela — desktop */}
          <div className="hidden sm:block">
            <FarmsTable farms={farms} />
          </div>

          {/* Cards — mobile */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {farms.map(farm => <FarmCard key={farm.id} farm={farm} />)}
          </div>
        </>
      )}
    </PageContainer>
  )
}
