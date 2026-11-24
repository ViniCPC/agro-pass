import { useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageContainer } from '@/components/PageContainer'
import { FarmAreaCard } from '@/features/farms/FarmAreaCard'
import { FarmDetailHeader } from '@/features/farms/FarmDetailHeader'
import { FarmIdentityCard } from '@/features/farms/FarmIdentityCard'
import { useFarm } from '@/hooks/useFarms'

export function FarmDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: farm, isLoading, error, refetch } = useFarm(id ?? null)

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState rows={6} />
      </PageContainer>
    )
  }

  if (error || !farm) {
    return (
      <PageContainer>
        <ErrorState
          description="Fazenda não encontrada ou conexão com o backend indisponível."
          onRetry={() => refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-5">
      <FarmDetailHeader farm={farm} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FarmIdentityCard farm={farm} />
        <FarmAreaCard farm={farm} />
      </div>
    </PageContainer>
  )
}
