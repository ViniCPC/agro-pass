import {
  AlertTriangle,
  BadgeCheck,
  Blocks,
  CheckCircle2,
  Sprout,
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { useFarms } from '@/hooks/useFarms'
import { useBatches } from '@/hooks/useBatches'
import { deriveDashboardMetrics } from './dashboard-metrics'

export function DashboardMetricsGrid() {
  const { data: farmsData, isLoading: farmsLoading } = useFarms()
  const { data: batchesData, isLoading: batchesLoading } = useBatches()

  const farms   = farmsData?.data   ?? []
  const batches = batchesData?.data ?? []
  const metrics = deriveDashboardMetrics(farms, batches)

  const v = (n: number, loading: boolean) => loading ? '…' : n

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard
        label="Total farms"
        value={v(metrics.totalFarms, farmsLoading)}
        icon={Sprout}
        accent="default"
      />
      <MetricCard
        label="Compliant farms"
        value={v(metrics.compliantFarms, farmsLoading)}
        icon={CheckCircle2}
        accent="green"
        emphasis="primary"
      />
      <MetricCard
        label="Traced batches"
        value={v(metrics.tracedBatches, batchesLoading)}
        icon={BadgeCheck}
        accent="amber"
        emphasis="primary"
      />
      <MetricCard
        label="Blockchain proof"
        value={v(metrics.blockchainProofBatches, batchesLoading)}
        icon={Blocks}
        accent="teal"
        emphasis="primary"
      />
      <MetricCard
        label="Need review"
        value={v(metrics.farmsNeedingReview + metrics.farmsAtRisk, farmsLoading)}
        icon={AlertTriangle}
        accent="red"
      />
    </div>
  )
}
