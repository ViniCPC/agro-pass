import { useMemo, useState } from 'react'
import { Plus, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageContainer } from '@/components/PageContainer'
import { FarmCard } from '@/features/farms/FarmCard'
import { FarmsFilters } from '@/features/farms/FarmsFilters'
import {
  DEFAULT_FILTERS,
  applyFarmFilters,
  type FarmFilters,
} from '@/features/farms/farm-filters'
import { FarmsHeader } from '@/features/farms/FarmsHeader'
import { FarmsTable } from '@/features/farms/FarmsTable'
import { RoleHandoff } from '@/features/auth/RoleHandoff'
import { canCreateFarm } from '@/features/auth/roles'
import { useActingRole } from '@/hooks/useActingRole'
import { useFarms } from '@/hooks/useFarms'

export function FarmsPage() {
  const [filters, setFilters] = useState<FarmFilters>(DEFAULT_FILTERS)
  const { data, isLoading, error, refetch } = useFarms()
  const { role } = useActingRole()
  const canCreate = canCreateFarm(role)

  const allFarms = useMemo(() => data?.data ?? [], [data?.data])
  const farms = useMemo(
    () => applyFarmFilters(allFarms, filters),
    [allFarms, filters],
  )

  return (
    <PageContainer className="space-y-5">
      <FarmsHeader farmCount={allFarms.length} filteredCount={farms.length} canCreate={canCreate} />

      {!isLoading && !error && allFarms.length > 0 && (
        <FarmsFilters filters={filters} onChange={setFilters} farms={allFarms} />
      )}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState
          description="Não foi possível carregar as fazendas. Verifique a conexão com o servidor."
          onRetry={() => refetch()}
        />
      ) : allFarms.length === 0 ? (
        // Starting from zero: a batch needs a property first.
        <EmptyState
          icon={Sprout}
          title="Nenhuma propriedade cadastrada"
          description="Todo lote nasce em uma propriedade. Cadastre a primeira para poder criar lotes."
          action={
            canCreate ? (
              <Link
                to="/farms/new"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--color-teal-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
              >
                <Plus size={15} aria-hidden />
                Cadastrar propriedade
              </Link>
            ) : (
              <RoleHandoff role="PRODUCER">Propriedades são cadastradas pelo produtor ou por um administrador.</RoleHandoff>
            )
          }
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
