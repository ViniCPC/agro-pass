import type { BatchStatus, UserRole } from '@/types/api'

// Mirrors BatchLifecycleService and BatchAuthorizationService in the API,
// which remain the authority: the UI only uses this to offer the right step.
export const LIFECYCLE: BatchStatus[] = [
  'CREATED',
  'HARVESTED',
  'RECEIVED',
  'IN_TRANSIT',
  'PROCESSED',
  'DELIVERED',
  'CLOSED',
]

const STATUS_ROLE: Partial<Record<BatchStatus, UserRole>> = {
  HARVESTED: 'PRODUCER',
  RECEIVED: 'COOPERATIVE',
  IN_TRANSIT: 'OPERATOR',
  PROCESSED: 'COOPERATIVE',
  DELIVERED: 'OPERATOR',
  CLOSED: 'ADMIN',
  CANCELLED: 'ADMIN',
}

export function nextStatus(status: BatchStatus): BatchStatus | null {
  const index = LIFECYCLE.indexOf(status)
  return index >= 0 && index < LIFECYCLE.length - 1 ? LIFECYCLE[index + 1] : null
}

export function roleFor(status: BatchStatus): UserRole | undefined {
  return STATUS_ROLE[status]
}

export function canRecord(role: UserRole | undefined, status: BatchStatus) {
  return role === 'ADMIN' || (role !== undefined && role === STATUS_ROLE[status])
}
