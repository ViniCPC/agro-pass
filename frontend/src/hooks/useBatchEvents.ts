import { useQuery } from '@tanstack/react-query'
import { batchesApi } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo-context'
import type { TimelineEventData } from '@/features/trace/timeline.types'
import { findDemoBatchEvents } from '@/mocks/demo-store'

// Live and demo events have different payloads; both satisfy the timeline.
export function useBatchEvents(batchId: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery<TimelineEventData[]>({
    queryKey: ['batch-events', isDemoMode ? 'demo' : 'live', batchId],
    queryFn: isDemoMode
      ? async () => findDemoBatchEvents(batchId ?? '')
      : () => batchesApi.getEvents(batchId!),
    enabled: Boolean(batchId),
    staleTime: isDemoMode ? 0 : 30_000,
  })
}
