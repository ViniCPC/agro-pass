import {
  AlertTriangle,
  BadgeCheck,
  Blocks,
  CheckCircle2,
  Sprout,
} from 'lucide-react'
import { motion } from 'framer-motion'
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

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} transition={{ duration: 0.25 }}>
        <MetricCard
          label="Total farms"
          value={v(metrics.totalFarms, farmsLoading)}
          icon={Sprout}
          accent="default"
        />
      </motion.div>
      <motion.div variants={item} transition={{ duration: 0.25 }}>
        <MetricCard
          label="Compliant farms"
          value={v(metrics.compliantFarms, farmsLoading)}
          icon={CheckCircle2}
          accent="green"
          emphasis="primary"
        />
      </motion.div>
      <motion.div variants={item} transition={{ duration: 0.25 }}>
        <MetricCard
          label="Traced batches"
          value={v(metrics.tracedBatches, batchesLoading)}
          icon={BadgeCheck}
          accent="amber"
          emphasis="primary"
        />
      </motion.div>
      <motion.div variants={item} transition={{ duration: 0.25 }}>
        <MetricCard
          label="Blockchain proof"
          value={v(metrics.blockchainProofBatches, batchesLoading)}
          icon={Blocks}
          accent="teal"
          emphasis="primary"
        />
      </motion.div>
      <motion.div variants={item} transition={{ duration: 0.25 }}>
        <MetricCard
          label="Need review"
          value={v(metrics.farmsNeedingReview + metrics.farmsAtRisk, farmsLoading)}
          icon={AlertTriangle}
          accent="red"
        />
      </motion.div>
    </motion.div>
  )
}
