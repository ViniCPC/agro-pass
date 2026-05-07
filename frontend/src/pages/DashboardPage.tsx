import { DashboardMetricsGrid }   from '@/features/dashboard/DashboardMetricsGrid'
import { DashboardNarrative }     from '@/features/dashboard/DashboardNarrative'
import { ComplianceOverview }      from '@/features/dashboard/ComplianceOverview'
import { BlockchainProofSummary }  from '@/features/dashboard/BlockchainProofSummary'
import { RecentFarmsCard }         from '@/features/dashboard/RecentFarmsCard'
import { RecentBatchesCard }       from '@/features/dashboard/RecentBatchesCard'
import { MotionWrapper } from '@/components/MotionWrapper'
import { PageContainer } from '@/components/PageContainer'

export function DashboardPage() {
  return (
    <PageContainer className="space-y-6">
      <MotionWrapper variant="fade">
        <DashboardNarrative />
      </MotionWrapper>

      <DashboardMetricsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MotionWrapper variant="slide-left">
          <ComplianceOverview />
        </MotionWrapper>
        <MotionWrapper variant="scale">
          <BlockchainProofSummary />
        </MotionWrapper>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentFarmsCard />
        <RecentBatchesCard />
      </div>
    </PageContainer>
  )
}
