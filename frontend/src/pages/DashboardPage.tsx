import { MotionWrapper } from '@/components/MotionWrapper'
import { PageContainer } from '@/components/PageContainer'
import { BlockchainProofSummary } from '@/features/dashboard/BlockchainProofSummary'
import { DashboardMetricsGrid } from '@/features/dashboard/DashboardMetricsGrid'
import { DashboardNarrative } from '@/features/dashboard/DashboardNarrative'
import { RecentBatchesCard } from '@/features/dashboard/RecentBatchesCard'
import { RecentFarmsCard } from '@/features/dashboard/RecentFarmsCard'

export function DashboardPage() {
  return (
    <PageContainer className="space-y-6">
      <MotionWrapper variant="fade">
        <DashboardNarrative />
      </MotionWrapper>
      <DashboardMetricsGrid />
      <BlockchainProofSummary />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentFarmsCard />
        <RecentBatchesCard />
      </div>
    </PageContainer>
  )
}
