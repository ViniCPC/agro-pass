import type { DocumentType, TraceEventType, UserRole } from '@/types/api'

export interface TimelineDocument {
  id: string
  type: DocumentType
  // Null when the document is restricted on the public passport.
  fileUrl: string | null
  fileHash: string
  isPublic?: boolean
  createdAt: string
}

// Accepts both the public passport events (actor) and the internal
// /batches/:id/events payload (recordedBy).
export interface TimelineEventData {
  id: string
  type: TraceEventType
  sequence?: number
  actorName: string
  actor?: { name: string; role: UserRole }
  recordedBy?: { name: string; role: UserRole }
  location: string | null
  latitude: number | null
  longitude: number | null
  eventHash: string | null
  txHash: string | null
  customStageName?: string | null
  documents?: TimelineDocument[]
  document?: TimelineDocument | null
  // Set on a CORRECTION: the event it points at.
  correctedEventId?: string | null
  createdAt: string
}
