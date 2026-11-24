import { sha256Hex } from '@/lib/sha256'
import type {
  PassportIntegrity,
  PublicEventDocument,
  PublicTraceEvent,
  TraceEventType,
  UserRole,
} from '@/types/api'

export interface DemoActor {
  // Internal id: part of the hash, like recordedById in the API, but never
  // exposed in the public events.
  id: string
  name: string
  role: UserRole
}

export interface DemoEventSpec {
  type: TraceEventType
  actor: DemoActor
  at: string
  location?: string
  latitude?: number
  longitude?: number
  notes?: string
  txHash?: string
  documents?: PublicEventDocument[]
}

export interface DemoChain {
  events: PublicTraceEvent[]
  finalHash: string | null
  integrity: PassportIntegrity
}

// Same precision the API publishes.
function roundCoordinate(value: number | undefined) {
  return value == null ? null : Math.round(value * 100) / 100
}

// Same canonical payload as the API's EventHashService, so demo hashes are
// real SHA-256 values computed exactly like production ones.
function hashEvent(
  batchId: string,
  sequence: number,
  spec: DemoEventSpec,
  previousHash: string | null,
) {
  return sha256Hex(
    JSON.stringify({
      batchId,
      sequence,
      type: spec.type,
      recordedById: spec.actor.id,
      recordedAt: new Date(spec.at).toISOString(),
      location: spec.location ?? null,
      latitude: spec.latitude ?? null,
      longitude: spec.longitude ?? null,
      notes: spec.notes ?? null,
      previousHash,
      documentHashes: (spec.documents ?? []).map((doc) => doc.fileHash).sort(),
      txHash: spec.txHash ?? null,
      correctedEventId: null,
    }),
  )
}

export function buildDemoChain(batchId: string, specs: DemoEventSpec[]): DemoChain {
  const events: PublicTraceEvent[] = []
  let previousHash: string | null = null

  specs.forEach((spec, index) => {
    const sequence = index + 1
    const eventHash = hashEvent(batchId, sequence, spec, previousHash)
    const documents = spec.documents ?? []
    const notes = spec.notes ?? null

    events.push({
      id: `${batchId}-event-${sequence}`,
      type: spec.type,
      sequence,
      location: spec.location ?? null,
      latitude: roundCoordinate(spec.latitude),
      longitude: roundCoordinate(spec.longitude),
      notes,
      previousHash,
      eventHash,
      txHash: spec.txHash ?? null,
      recordedAt: spec.at,
      correctedEventId: null,
      actor: { name: spec.actor.name, role: spec.actor.role },
      documents,
      actorName: spec.actor.name,
      createdAt: spec.at,
      customStageName: notes,
      documentId: documents[0]?.id ?? null,
      document: documents[0] ?? null,
    })
    previousHash = eventHash
  })

  return {
    events,
    finalHash: previousHash,
    // The chain was just derived from its own specs, so it is consistent by
    // construction; the real check runs on the API.
    integrity: {
      valid: events.length > 0,
      eventCount: events.length,
      finalHash: previousHash,
      checkedAt: new Date().toISOString(),
      errors: [],
    },
  }
}
