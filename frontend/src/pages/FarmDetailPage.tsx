import { useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageContainer } from '@/components/PageContainer'
import { FarmAreaCard } from '@/features/farms/FarmAreaCard'
import { FarmComplianceCard } from '@/features/farms/FarmComplianceCard'
import { FarmDetailHeader } from '@/features/farms/FarmDetailHeader'
import { FarmIdentityCard } from '@/features/farms/FarmIdentityCard'
import { FarmSatelliteComparison } from '@/features/farms/FarmSatelliteComparison'
import { FarmValidationHistoryList } from '@/features/farms/FarmValidationHistoryList'
import { useFarm } from '@/hooks/useFarms'
import { useFarmLastValidation, useFarmValidationHistory } from '@/hooks/useFarmValidations'

export function FarmDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: farm, isLoading: farmLoading, error: farmError, refetch } = useFarm(id ?? null)
  const { data: lastValidation, isLoading: validationLoading } = useFarmLastValidation(id ?? null)
  const { data: historyData } = useFarmValidationHistory(id ?? null)

  const history = historyData?.data ?? []

  if (farmLoading) {
    return (
      <PageContainer>
        <LoadingState rows={6} />
      </PageContainer>
    )
  }

  if (farmError || !farm) {
    return (
      <PageContainer>
        <ErrorState
          description="Farm not found or connection to backend failed."
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

      <FarmComplianceCard
        validation={lastValidation ?? null}
        isLoading={validationLoading}
      />

      <FarmSatelliteComparison validation={lastValidation ?? null} />

      <FarmValidationHistoryList items={history} />
    </PageContainer>
  )
}
