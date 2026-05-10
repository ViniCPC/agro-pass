import type { DocumentType, TraceEventType } from '@/types/api'

export interface TimelineEventData {
  id: string
  type: TraceEventType
  actorName: string
  location: string | null
  latitude: number | null
  longitude: number | null
  eventHash: string | null
  txHash: string | null
  customStageName?: string | null
  documentId?: string | null
  document?: {
    id: string
    type: DocumentType
    fileUrl: string
    fileHash: string
    createdAt: string
  } | null
  createdAt: string
}
