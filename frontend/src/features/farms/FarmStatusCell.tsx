import { StatusBadge } from '@/components/StatusBadge'
import type { FarmStatus } from '@/types/api'

interface FarmStatusCellProps {
  status: FarmStatus
}

export function FarmStatusCell({ status }: FarmStatusCellProps) {
  return <StatusBadge status={status} />
}
