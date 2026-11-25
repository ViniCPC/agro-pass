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
  // A CORRECTION points at the event it corrects; the original is kept.
  correctedEventId?: string
}

// Demo event ids follow the sequence, so a correction can point at one.
export function demoEventId(batchId: string, sequence: number) {
  return `${batchId}-event-${sequence}`
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
      correctedEventId: spec.correctedEventId ?? null,
    }),
  )
}

export interface DemoChainCheck {
  sequence: number
  // The stored previousHash points at the event before it.
  linked: boolean
  // Recomputing the hash from the (possibly edited) data gives the stored one.
  hashMatches: boolean
  recalculatedHash: string
  storedHash: string
}

// Mirror of the API's EventChainService.verify: recompute each event's hash
// from its data and compare it with the stored hash and the next link. The
// landing page uses it to show what happens when a record is edited.
export function verifyDemoChain(
  batchId: string,
  specs: DemoEventSpec[],
  stored: Pick<PublicTraceEvent, 'previousHash' | 'eventHash'>[],
): DemoChainCheck[] {
  let expectedPrevious: string | null = null
  return stored.map((event, index) => {
    const recalculatedHash = hashEvent(batchId, index + 1, specs[index], event.previousHash)
    const check = {
      sequence: index + 1,
      linked: event.previousHash === expectedPrevious,
      hashMatches: recalculatedHash === event.eventHash,
      recalculatedHash,
      storedHash: event.eventHash,
    }
    expectedPrevious = event.eventHash
    return check
  })
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
      id: demoEventId(batchId, sequence),
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
      correctedEventId: spec.correctedEventId ?? null,
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
