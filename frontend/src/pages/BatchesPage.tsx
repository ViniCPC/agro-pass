import { useState, useMemo } from 'react'
import { useBatches } from '@/hooks/useBatches'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { BatchesHeader } from '@/features/batches/BatchesHeader'
import { BatchCard } from '@/features/batches/BatchCard'
import { BatchesFilters, DEFAULT_BATCH_FILTERS, applyBatchFilters, type BatchFilters } from '@/features/batches/BatchesFilters'
import { BatchesTable } from '@/features/batches/BatchesTable'
import { PageContainer } from '@/components/PageContainer'

export function BatchesPage() {
  const [filters, setFilters] = useState<BatchFilters>(DEFAULT_BATCH_FILTERS)
  const { data, isLoading, error, refetch } = useBatches()

  const allBatches = data?.data ?? []
  const batches = useMemo(() => applyBatchFilters(allBatches, filters), [allBatches, filters])

  return (
    <PageContainer className="space-y-5">
      <BatchesHeader totalCount={allBatches.length} filteredCount={batches.length} />

      <BatchesFilters filters={filters} onChange={setFilters} batches={allBatches} />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState
          description="Não foi possível carregar os lotes. Verifique a conexão com o backend."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {batches.length === 0 ? (
            <BatchesTable batches={batches} />
          ) : (
            <>
              <div className="hidden sm:block">
                <BatchesTable batches={batches} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {batches.map((batch) => (
                  <BatchCard key={batch.id} batch={batch} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PageContainer>
  )
}
