import { useDemoMode } from '@/contexts/demo-context'
import { Blocks, Package, Route, Sprout, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { MetricCard } from '@/components/MetricCard'
import { useFarms } from '@/hooks/useFarms'
import { useBatches } from '@/hooks/useBatches'
import { deriveDashboardMetrics } from './dashboard-metrics'

export function DashboardMetricsGrid() {
  const { isDemoMode } = useDemoMode()
  const { data: farmsData, isLoading: farmsLoading } = useFarms()
  const { data: batchesData, isLoading: batchesLoading } = useBatches()
  const metrics = deriveDashboardMetrics(farmsData?.data ?? [], batchesData?.data ?? [])
  const value = (count: number, loading: boolean) => loading ? '…' : count

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <MetricCard
        label="Fazendas de origem"
        value={value(metrics.totalFarms, farmsLoading)}
        icon={Sprout}
        accent="default"
      />
      <MetricCard
        label="Total de lotes"
        value={value(metrics.totalBatches, batchesLoading)}
        icon={Package}
        accent="green"
      />
      <MetricCard
        label="Lotes rastreados"
        value={value(metrics.tracedBatches, batchesLoading)}
        icon={Route}
        accent="amber"
        emphasis="primary"
      />
      <MetricCard
        label={isDemoMode ? 'Provas simuladas' : 'Prova blockchain'}
        value={value(metrics.blockchainProofBatches, batchesLoading)}
        icon={Blocks}
        accent="teal"
        emphasis="primary"
      />
      <MetricCard
        label="Em trânsito"
        value={value(metrics.batchesInTransit, batchesLoading)}
        icon={Truck}
        accent="red"
      />
    </motion.div>
  )
}
