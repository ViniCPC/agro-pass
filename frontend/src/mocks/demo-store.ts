import type { CreateBatchInput } from '@/api/batchesApi'
import type { Batch, PublicBatch, PublicTraceEvent } from '@/types/api'
import { buildDemoChain, type DemoChain, type DemoEventSpec } from './demo-chain'
import {
  DEMO_ADMIN_ACTOR,
  DEMO_CODE_PREFIX,
  DEMO_SEED,
  producerActor,
  type DemoBatchRecord,
} from './demo-seed'
import { MOCK_FARMS } from './farms.mock'

export { DEMO_SHOWCASE_CODE } from './demo-seed'

const CREATED_BATCHES_KEY = 'agropass.demo.createdBatches'

interface StoredDemoBatch {
  batch: Batch
  farmId: string
  mint?: { tokenAddress: string; txHash: string; at: string }
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

export function clearDemoData() {
  try {
    window.localStorage.removeItem(CREATED_BATCHES_KEY)
  } catch {
    // Nothing persisted.
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
  if (stored.mint) {
    events.push({
      type: 'MINTED_ONCHAIN',
      actor: DEMO_ADMIN_ACTOR,
      at: stored.mint.at,
      notes: 'Prova registrada na Solana (devnet)',
      txHash: stored.mint.txHash,
    })
  }

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
  return [...created, ...DEMO_SEED]
}

function withIntegrity(record: DemoBatchRecord): Batch {
  return { ...record.batch, integrityHash: chainOf(record).finalHash }
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

// Private demo batches behave like the API: no public passport.
export function findDemoPassport(publicCode: string): PublicBatch | null {
  const normalized = publicCode.toUpperCase()
  const record = allRecords().find(
    (item) => item.batch.publicCode.toUpperCase() === normalized,
  )
  if (!record || !record.batch.isPublic) return null

  const { batch, farm, documents } = record
  const chain = chainOf(record)

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
      tokenAddress: batch.tokenAddress,
      tokenizedAt: batch.tokenizedAt,
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

  const batch: Batch = {
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

  writeStored([...readStored(), { batch, farmId: farm.id }])
  return findDemoBatch(id) ?? batch
}

function demoBase58(seed: string, length: number) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let output = ''
  let state = 0
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0
  while (output.length < length) {
    state = (state * 1103515245 + 12345) >>> 0
    output += alphabet[state % alphabet.length]
  }
  return output
}

export function mintDemoBatch(batchId: string) {
  const items = readStored()
  const target = items.find((item) => item.batch.id === batchId)
  const at = new Date().toISOString()
  const tokenAddress = `AgPDemo${demoBase58(batchId, 37)}`
  const txHash = `5DemoTx${demoBase58(`${batchId}:tx`, 81)}`

  if (target && !target.mint) {
    target.mint = { tokenAddress, txHash, at }
    target.batch = { ...target.batch, tokenAddress, tokenizedAt: at, updatedAt: at }
    writeStored(items)
  }

  const minted = target?.mint ?? { tokenAddress, txHash, at }
  return {
    batch: findDemoBatch(batchId),
    tokenAddress: minted.tokenAddress,
    txHash: minted.txHash,
    tokenizedAt: minted.at,
  }
}
