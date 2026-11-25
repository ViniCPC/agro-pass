import type { CreateBatchInput } from '@/api/batchesApi'
import { nextStatus } from '@/features/batches/lifecycle'
import { sha256Hex } from '@/lib/sha256'
import type {
  Batch,
  BatchBlockchainProof,
  BatchStatus,
  Farm,
  PublicBatch,
  PublicTraceEvent,
} from '@/types/api'
import { buildDemoChain, type DemoChain, type DemoEventSpec } from './demo-chain'
import {
  cooperativeActor,
  DEMO_ADMIN_ACTOR,
  DEMO_CODE_PREFIX,
  DEMO_LOGISTICS_ACTOR,
  DEMO_SEED,
  producerActor,
  type DemoBatch,
  type DemoBatchRecord,
  type DemoProof,
} from './demo-seed'
import type { DemoActor } from './demo-chain'
import { MOCK_FARMS } from './farms.mock'

export { DEMO_LANDING_CODE, DEMO_SHOWCASE_CODE } from './demo-seed'

const CREATED_BATCHES_KEY = 'agropass.demo.createdBatches'
const PROGRESS_KEY = 'agropass.demo.progress'

interface StoredDemoBatch {
  batch: DemoBatch
  farmId: string
}

// Stages, visibility and proof recorded during the demo, applied on top of
// both the bundled and the created batches.
interface DemoProgress {
  stages: Array<{ status: BatchStatus; at: string }>
  isPublic?: boolean
  proof?: DemoProof
}

export function isDemoPublicCode(code: string) {
  return code.toUpperCase().startsWith(DEMO_CODE_PREFIX)
}

// ── Persistence of batches created during the demo ────────────────────────

function readStored(): StoredDemoBatch[] {
  try {
    const raw = window.localStorage.getItem(CREATED_BATCHES_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as StoredDemoBatch[]) : []
  } catch {
    return []
  }
}

function writeStored(items: StoredDemoBatch[]) {
  try {
    window.localStorage.setItem(CREATED_BATCHES_KEY, JSON.stringify(items))
  } catch {
    // Storage full or blocked: the batch still lives until the page reloads.
  }
}

function readProgress(): Record<string, DemoProgress> {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, DemoProgress>) : {}
  } catch {
    return {}
  }
}

function writeProgress(progress: Record<string, DemoProgress>) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Storage blocked: the change lasts until the page reloads.
  }
}

export function clearDemoData() {
  try {
    window.localStorage.removeItem(CREATED_BATCHES_KEY)
    window.localStorage.removeItem(PROGRESS_KEY)
  } catch {
    // Nothing persisted.
  }
}

// Who records each stage, like the roles enforced by the API.
function stageActor(status: BatchStatus, farm: Farm): DemoActor {
  if (status === 'HARVESTED') return producerActor(farm)
  if (status === 'RECEIVED' || status === 'PROCESSED') return cooperativeActor(farm)
  if (status === 'IN_TRANSIT' || status === 'DELIVERED') return DEMO_LOGISTICS_ACTOR
  return DEMO_ADMIN_ACTOR
}

function applyProgress(record: DemoBatchRecord, progress: DemoProgress | undefined): DemoBatchRecord {
  if (!progress) return record
  const last = progress.stages.at(-1)
  const proof = progress.proof ?? record.proof

  return {
    ...record,
    proof,
    batch: {
      ...record.batch,
      status: last?.status ?? record.batch.status,
      isPublic: progress.isPublic ?? record.batch.isPublic,
      updatedAt: last?.at ?? record.batch.updatedAt,
      closedAt: last?.status === 'CLOSED' ? last.at : record.batch.closedAt,
      tokenAddress: proof?.tokenAddress ?? record.batch.tokenAddress,
      tokenizedAt: proof?.at ?? record.batch.tokenizedAt,
    },
    events: [
      ...record.events,
      ...progress.stages.map((stage) => ({
        type: stage.status,
        actor: stageActor(stage.status, record.farm),
        at: stage.at,
      })),
    ],
  }
}

function toRecord(stored: StoredDemoBatch): DemoBatchRecord | null {
  const farm = MOCK_FARMS.find((item) => item.id === stored.farmId)
  if (!farm) return null

  const events: DemoEventSpec[] = [
    {
      type: 'CREATED',
      actor: producerActor(farm),
      at: stored.batch.createdAt,
      location: `${farm.city}, ${farm.state}`,
      latitude: farm.latitude,
      longitude: farm.longitude,
    },
  ]

  return { batch: stored.batch, farm, events, documents: [] }
}

// ── Chains are derived once per batch and memoized ────────────────────────

const chainCache = new Map<string, DemoChain>()

function chainOf(record: DemoBatchRecord): DemoChain {
  const key = `${record.batch.id}:${record.events.length}`
  let chain = chainCache.get(key)
  if (!chain) {
    chain = buildDemoChain(record.batch.id, record.events)
    chainCache.set(key, chain)
  }
  return chain
}

function allRecords(): DemoBatchRecord[] {
  const created = readStored()
    .map(toRecord)
    .filter((record): record is DemoBatchRecord => record !== null)
    .reverse()
  const progress = readProgress()
  return [...created, ...DEMO_SEED].map((record) =>
    applyProgress(record, progress[record.batch.id]),
  )
}

// Like the API: the anchored hash is the final hash of the closed chain.
// Demo transactions do not exist on-chain, so there are no explorer links.
function proofOf(record: DemoBatchRecord): BatchBlockchainProof {
  const { proof } = record
  return {
    status: proof ? 'CONFIRMED' : 'NONE',
    network: proof?.network ?? null,
    proofHash: proof ? chainOf(record).finalHash : null,
    txHash: proof?.txHash ?? null,
    attempts: proof ? 1 : 0,
    error: null,
    explorerTxUrl: null,
    explorerTokenUrl: null,
  }
}

function withIntegrity(record: DemoBatchRecord): Batch {
  return {
    ...record.batch,
    integrityHash: chainOf(record).finalHash,
    blockchain: proofOf(record),
  }
}

// ── Queries used by the hooks in demo mode ────────────────────────────────

export function listDemoBatches(): Batch[] {
  return allRecords().map(withIntegrity)
}

export function findDemoBatch(id: string): Batch | null {
  const record = allRecords().find((item) => item.batch.id === id)
  return record ? withIntegrity(record) : null
}

export function findDemoBatchEvents(batchId: string): PublicTraceEvent[] {
  const record = allRecords().find((item) => item.batch.id === batchId)
  return record ? chainOf(record).events : []
}

// The recorded data behind a demo passport's hashes. The landing page edits a
// copy of it to show the chain check catching the change.
export function findDemoEventSpecs(publicCode: string): { batchId: string; specs: DemoEventSpec[] } | null {
  const normalized = publicCode.toUpperCase()
  const record = allRecords().find((item) => item.batch.publicCode.toUpperCase() === normalized)
  return record ? { batchId: record.batch.id, specs: record.events } : null
}

// Private demo batches behave like the API: no public passport.
export function findDemoPassport(publicCode: string): PublicBatch | null {
  const normalized = publicCode.toUpperCase()
  const record = allRecords().find(
    (item) => item.batch.publicCode.toUpperCase() === normalized,
  )
  if (!record || !record.batch.isPublic) return null

  const { batch, farm, documents } = record
  const chain = chainOf(record)
  const proof = proofOf(record)

  return {
    batch: {
      id: batch.id,
      code: batch.code,
      productType: batch.productType,
      quantity: batch.quantity,
      unit: batch.unit,
      harvestDate: batch.harvestDate,
      status: batch.status,
      publicCode: batch.publicCode,
      isPublic: batch.isPublic,
      integrityHash: chain.finalHash,
      closedAt: batch.closedAt,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    },
    blockchain: {
      status: proof.status,
      network: proof.network,
      proofHash: proof.proofHash,
      tokenAddress: batch.tokenAddress,
      txHash: proof.txHash,
      tokenizedAt: batch.tokenizedAt,
      explorerTxUrl: null,
      explorerTokenUrl: null,
    },
    farm: {
      name: farm.name,
      city: farm.city,
      state: farm.state,
      latitude: Math.round(farm.latitude * 100) / 100,
      longitude: Math.round(farm.longitude * 100) / 100,
      carNumber: farm.carNumber,
      totalAreaHa: farm.totalAreaHa,
      producer: { name: farm.producerName ?? 'Produtor rural' },
    },
    traceEvents: chain.events,
    documents,
    integrity: chain.integrity,
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────

function nextDemoCode(year: number) {
  const taken = new Set(allRecords().map((record) => record.batch.code))
  const codeFor = (sequence: number) =>
    `${DEMO_CODE_PREFIX}${year}-${String(sequence).padStart(4, '0')}`
  let sequence = 101
  while (taken.has(codeFor(sequence))) sequence += 1
  return codeFor(sequence)
}

export function createDemoBatch(input: CreateBatchInput): Batch {
  const farm = MOCK_FARMS.find((item) => item.id === input.farmId)
  if (!farm) throw new Error('Fazenda não encontrada na demonstração.')

  const now = new Date().toISOString()
  const year = input.harvestDate
    ? new Date(input.harvestDate).getUTCFullYear()
    : new Date().getUTCFullYear()
  const code = nextDemoCode(year)
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `demo-batch-${Date.now()}`

  const batch: DemoBatch = {
    id,
    code,
    publicCode: code,
    productType: input.productType,
    quantity: input.quantity,
    unit: input.unit,
    harvestDate: input.harvestDate ?? null,
    status: 'CREATED',
    // Public right away so the QR flow can be shown end to end; in the real
    // product an administrator publishes the passport.
    isPublic: true,
    integrityHash: null,
    tokenAddress: null,
    tokenizedAt: null,
    closedAt: null,
    farm: { name: farm.name, latitude: farm.latitude, longitude: farm.longitude },
    createdAt: now,
    updatedAt: now,
  }

  const stored: StoredDemoBatch = { batch, farmId: farm.id }
  writeStored([...readStored(), stored])
  // If storage is blocked the batch only lives for this response.
  return findDemoBatch(id) ?? withIntegrity(toRecord(stored)!)
}

function updateProgress(batchId: string, change: (entry: DemoProgress) => void) {
  const progress = readProgress()
  const entry = progress[batchId] ?? { stages: [] }
  change(entry)
  progress[batchId] = entry
  writeProgress(progress)
}

// Records the next lifecycle stage. Closing also registers a demo proof with
// the final chain hash, as the API does in the background.
export function advanceDemoBatch(batchId: string, status: BatchStatus): Batch {
  const record = allRecords().find((item) => item.batch.id === batchId)
  if (!record) throw new Error('Lote não encontrado na demonstração.')
  if (nextStatus(record.batch.status) !== status) {
    throw new Error(`Transição de ${record.batch.status} para ${status} não permitida.`)
  }

  const at = new Date().toISOString()
  updateProgress(batchId, (entry) => {
    entry.stages.push({ status, at })
    if (status === 'CLOSED') {
      const digest = sha256Hex(`${batchId}:${at}`)
      entry.proof = {
        network: 'devnet',
        txHash: `demo-tx-${digest.slice(0, 48)}`,
        tokenAddress: `demo-token-${digest.slice(48)}`,
        at,
      }
    }
  })

  return findDemoBatch(batchId)!
}

export function setDemoBatchVisibility(batchId: string, isPublic: boolean): Batch {
  if (!findDemoBatch(batchId)) throw new Error('Lote não encontrado na demonstração.')
  updateProgress(batchId, (entry) => {
    entry.isPublic = isPublic
  })
  return findDemoBatch(batchId)!
}
