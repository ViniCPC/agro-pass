import type { TraceEventType } from '@/types/api'

export interface TimelineEventData {
  id: string
  type: TraceEventType
  actorName: string
  location: string | null
  latitude: number | null
  longitude: number | null
  eventHash: string | null
  txHash: string | null
  createdAt: string
}
