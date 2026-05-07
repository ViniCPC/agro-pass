import { StatusBadge } from '@/components/StatusBadge'
import type { BatchStatus } from '@/types/api'

export function BatchStatusCell({ status }: { status: BatchStatus }) {
  return <StatusBadge status={status} />
}
