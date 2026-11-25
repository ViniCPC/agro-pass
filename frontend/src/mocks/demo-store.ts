import type {
  CorrectionInput,
  CreateBatchInput,
  StageDetails,
  UploadDocumentInput,
} from '@/api/batchesApi'
import { checkDocumentFile, readBytes } from '@/features/batches/document-upload'
import { canRecord, LIFECYCLE, nextStatus, roleFor } from '@/features/batches/lifecycle'
import { sha256Hex, sha256HexBytes } from '@/lib/sha256'
import type {
  Batch,
  BatchBlockchainProof,
  BatchDocument,
  BatchStatus,
  DocumentType,
  Farm,
  PublicBatch,
  PublicDocument,
  PublicEventDocument,
  PublicTraceEvent,
  TraceEventType,
  UserRole,
} from '@/types/api'
import { buildDemoChain, type DemoActor, type DemoChain, type DemoEventSpec } from './demo-chain'
import { clearDemoFarms, findDemoFarm } from './demo-farms'
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

export { DEMO_LANDING_CODE, DEMO_SHOWCASE_CODE } from './demo-seed'

const CREATED_BATCHES_KEY = 'agropass.demo.createdBatches'
const PROGRESS_KEY = 'agropass.demo.progress'
const FILE_KEY_PREFIX = 'agropass.demo.file.'
// Larger files stay only in memory: browser storage holds a few MB in all.
const MAX_STORED_FILE_BYTES = 1024 * 1024

interface StoredDemoBatch {
  batch: DemoBatch
  farmId: string
  // Who created it; older entries were always the producer.
  role?: UserRole
}

// An event recorded during the demo: a lifecycle stage, a document or a
// correction, with the role the visitor was acting as.
interface DemoRecordedEvent {
  type: TraceEventType
  at: string
  role?: UserRole
  location?: string
  notes?: string
  documentIds?: string[]
  correctedEventId?: string
}

interface DemoStoredDocument {
  id: string
  type: DocumentType
  originalName: string
  size: number
  mimeType: string
  fileHash: string
  isPublic: boolean
  createdAt: string
}

// Everything recorded during the demo, applied on top of both the bundled
// and the created batches.
interface DemoProgress {
  events?: DemoRecordedEvent[]
  // Earlier versions stored only the lifecycle stages.
  stages?: Array<{ status: BatchStatus; at: string }>
  isPublic?: boolean
  proof?: DemoProof
  documents?: DemoStoredDocument[]
  // Visibility is not part of the hash, so it can change at any time.
  documentVisibility?: Record<string, boolean>
}

const STATUS_EVENTS = new Set<TraceEventType>([...LIFECYCLE, 'CANCELLED'])
const TERMINAL = new Set<BatchStatus>(['CLOSED', 'CANCELLED'])

export function isDemoPublicCode(code: string) {
  return code.toUpperCase().startsWith(DEMO_CODE_PREFIX)
}

function newId(prefix: string) {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// ── Persistence ───────────────────────────────────────────────────────────

function readJson<T>(key: string, fallback: T, valid: (value: unknown) => boolean): T {
  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : fallback
    return valid(parsed) ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the change lasts until the page reloads.
  }
}

const readStored = () => readJson<StoredDemoBatch[]>(CREATED_BATCHES_KEY, [], Array.isArray)
const writeStored = (items: StoredDemoBatch[]) => writeJson(CREATED_BATCHES_KEY, items)
const readProgress = () =>
  readJson<Record<string, DemoProgress>>(PROGRESS_KEY, {}, (value) => Boolean(value) && typeof value === 'object')
const writeProgress = (progress: Record<string, DemoProgress>) => writeJson(PROGRESS_KEY, progress)

// Uploaded files: a link for this visit, and a copy in storage when small.
const sessionFiles = new Map<string, string>()

function fileUrlOf(documentId: string): string | null {
  const session = sessionFiles.get(documentId)
  if (session) return session
  try {
    return window.localStorage.getItem(FILE_KEY_PREFIX + documentId)
  } catch {
    return null
  }
}

function toDataUrl(bytes: Uint8Array, mimeType: string) {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return `data:${mimeType};base64,${btoa(binary)}`
}

function keepFile(documentId: string, file: File, bytes: Uint8Array) {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    sessionFiles.set(documentId, URL.createObjectURL(file))
  }
  if (bytes.length > MAX_STORED_FILE_BYTES) return
  try {
    window.localStorage.setItem(FILE_KEY_PREFIX + documentId, toDataUrl(bytes, file.type))
  } catch {
    // No room: the file opens only during this visit.
  }
}

export function clearDemoData() {
  for (const url of sessionFiles.values()) {
    if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url)
  }
  sessionFiles.clear()
  chainCache.clear()
  clearDemoFarms()
  try {
    window.localStorage.removeItem(CREATED_BATCHES_KEY)
    window.localStorage.removeItem(PROGRESS_KEY)
    const fileKeys = Object.keys(window.localStorage).filter((key) => key.startsWith(FILE_KEY_PREFIX))
    for (const key of fileKeys) window.localStorage.removeItem(key)
  } catch {
    // Nothing persisted.
  }
}

// ── Records: bundled data plus what the visitor recorded ──────────────────

// The person who records an event, from the role the visitor acts as.
function actorFor(role: UserRole, farm: Farm): DemoActor {
  if (role === 'PRODUCER') return producerActor(farm)
  if (role === 'COOPERATIVE') return cooperativeActor(farm)
  if (role === 'OPERATOR') return DEMO_LOGISTICS_ACTOR
  return DEMO_ADMIN_ACTOR
}

// For entries saved without a role: whoever the API requires for the stage.
function defaultRole(type: TraceEventType): UserRole {
  if (type === 'DOCUMENT_ATTACHED') return 'COOPERATIVE'
  return STATUS_EVENTS.has(type) ? (roleFor(type as BatchStatus) ?? 'ADMIN') : 'ADMIN'
}

function recordedEvents(progress: DemoProgress): DemoRecordedEvent[] {
  return progress.events ?? progress.stages?.map((stage) => ({ type: stage.status, at: stage.at })) ?? []
}

function storedToPublic(document: DemoStoredDocument): PublicDocument {
  return { ...document, scope: 'BATCH', fileUrl: fileUrlOf(document.id) }
}

function applyProgress(record: DemoBatchRecord, progress: DemoProgress | undefined): DemoBatchRecord {
  if (!progress) return record
  const events = recordedEvents(progress)
  const visibility = progress.documentVisibility ?? {}
  const documents = [...record.documents, ...(progress.documents ?? []).map(storedToPublic)].map((document) => ({
    ...document,
    isPublic: visibility[document.id] ?? document.isPublic,
  }))
  const documentById = new Map(documents.map((document) => [document.id, document]))
  const withVisibility = (attached: PublicEventDocument[] | undefined) =>
    attached?.map((document) => documentById.get(document.id) ?? document)

  const lastStatus = [...events].reverse().find((event) => STATUS_EVENTS.has(event.type))
  const proof = progress.proof ?? record.proof

  return {
    ...record,
    proof,
    documents,
    batch: {
      ...record.batch,
      status: (lastStatus?.type as BatchStatus | undefined) ?? record.batch.status,
      isPublic: progress.isPublic ?? record.batch.isPublic,
      updatedAt: events.at(-1)?.at ?? record.batch.updatedAt,
      closedAt: lastStatus?.type === 'CLOSED' ? lastStatus.at : record.batch.closedAt,
      tokenAddress: proof?.tokenAddress ?? record.batch.tokenAddress,
      tokenizedAt: proof?.at ?? record.batch.tokenizedAt,
    },
    events: [
      ...record.events.map((spec) => ({ ...spec, documents: withVisibility(spec.documents) })),
      ...events.map((event) => ({
        type: event.type,
        actor: actorFor(event.role ?? defaultRole(event.type), record.farm),
        at: event.at,
        location: event.location,
        notes: event.notes,
        correctedEventId: event.correctedEventId,
        documents: event.documentIds
          ?.map((id) => documentById.get(id))
          .filter((document): document is PublicDocument => document !== undefined),
      })),
    ],
  }
}

function toRecord(stored: StoredDemoBatch): DemoBatchRecord | null {
  const farm = findDemoFarm(stored.farmId)
  if (!farm) return null

  const events: DemoEventSpec[] = [
    {
      type: 'CREATED',
      actor: actorFor(stored.role ?? 'PRODUCER', farm),
      at: stored.batch.createdAt,
      location: `${farm.city}, ${farm.state}`,
      latitude: farm.latitude,
      longitude: farm.longitude,
    },
  ]

  return { batch: stored.batch, farm, events, documents: [] }
}

// ── Chains are derived once per batch state and memoized ──────────────────

const chainCache = new Map<string, DemoChain>()

function chainOf(record: DemoBatchRecord): DemoChain {
  // Keyed by the full content: two histories of the same length must not
  // share a chain. Visibility is not hashed but is shown on the events.
  const visibility = record.documents.map((document) => (document.isPublic ? 1 : 0)).join('')
  // File links (possibly large data URLs) are left out of the key.
  const content = JSON.stringify(record.events, (field, value: unknown) => (field === 'fileUrl' ? undefined : value))
  const key = `${record.batch.id}:${visibility}:${content}`
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
  return [...created, ...DEMO_SEED].map((record) => applyProgress(record, progress[record.batch.id]))
}

function recordOf(batchId: string): DemoBatchRecord {
  const record = allRecords().find((item) => item.batch.id === batchId)
  if (!record) throw new Error('Lote não encontrado na demonstração.')
  return record
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

// What the public passport may show of a restricted document: its hash.
function publicView<T extends PublicEventDocument>(document: T): T {
  return document.isPublic ? document : { ...document, originalName: null, fileUrl: null }
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

// Batches created during the demo live only in this browser; the bundled
// ones open on any device.
export function isCreatedDemoBatch(batchId: string) {
  return readStored().some((stored) => stored.batch.id === batchId)
}

// The name shown as "responsável" for the role the visitor acts as.
export function demoActorName(batchId: string, role: UserRole): string | null {
  const record = allRecords().find((item) => item.batch.id === batchId)
  return record ? actorFor(role, record.farm).name : null
}

export function listDemoDocuments(batchId: string): BatchDocument[] {
  const record = allRecords().find((item) => item.batch.id === batchId)
  if (!record) return []
  return record.documents
    .map((document) => ({
      id: document.id,
      type: document.type,
      originalName: document.originalName,
      fileUrl: document.fileUrl,
      size: document.size,
      mimeType: document.mimeType,
      fileHash: document.fileHash,
      isPublic: document.isPublic,
      batchId: document.scope === 'BATCH' ? batchId : null,
      traceEventId: null,
      createdAt: document.createdAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
    traceEvents: chain.events.map((event) => ({
      ...event,
      documents: event.documents.map(publicView),
      document: event.document ? publicView(event.document) : null,
    })),
    documents: documents.map(publicView),
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

function assertRole(role: UserRole | undefined, allowed: UserRole[], message: string) {
  if (role !== undefined && !allowed.includes(role)) throw new Error(message)
}

function assertMutable(record: DemoBatchRecord) {
  if (TERMINAL.has(record.batch.status)) {
    throw new Error('Lote encerrado ou cancelado não recebe alterações.')
  }
}

export function createDemoBatch(input: CreateBatchInput, role: UserRole = 'PRODUCER'): Batch {
  assertRole(role, ['PRODUCER', 'ADMIN'], 'Lotes são criados pelo produtor ou por um administrador.')
  const farm = findDemoFarm(input.farmId)
  if (!farm) throw new Error('Fazenda não encontrada na demonstração.')

  const now = new Date().toISOString()
  const year = input.harvestDate
    ? new Date(input.harvestDate).getUTCFullYear()
    : new Date().getUTCFullYear()
  const code = nextDemoCode(year)
  const id = newId('demo-batch')

  const batch: DemoBatch = {
    id,
    code,
    publicCode: code,
    productType: input.productType,
    quantity: input.quantity,
    unit: input.unit,
    harvestDate: input.harvestDate ?? null,
    status: 'CREATED',
    // Private until an administrator publishes it, as in the API.
    isPublic: false,
    integrityHash: null,
    tokenAddress: null,
    tokenizedAt: null,
    closedAt: null,
    farm: { name: farm.name, latitude: farm.latitude, longitude: farm.longitude },
    createdAt: now,
    updatedAt: now,
  }

  const stored: StoredDemoBatch = { batch, farmId: farm.id, role }
  writeStored([...readStored(), stored])
  // If storage is blocked the batch only lives for this response.
  return findDemoBatch(id) ?? withIntegrity(toRecord(stored)!)
}

function updateProgress(batchId: string, change: (entry: DemoProgress) => void) {
  const progress = readProgress()
  const entry = progress[batchId] ?? {}
  // Older entries move to the event list on their first change.
  entry.events = recordedEvents(entry)
  delete entry.stages
  change(entry)
  progress[batchId] = entry
  writeProgress(progress)
}

const trimmed = (value: string | undefined) => value?.trim() || undefined

// Records the next lifecycle stage. Closing also registers a demo proof with
// the final chain hash, as the API does in the background. Without a role,
// the stage is recorded by the role the API requires for it.
export function advanceDemoBatch(
  batchId: string,
  status: BatchStatus,
  details: StageDetails = {},
  role?: UserRole,
): Batch {
  const record = recordOf(batchId)
  if (nextStatus(record.batch.status) !== status) {
    throw new Error(`Transição de ${record.batch.status} para ${status} não permitida.`)
  }
  if (role !== undefined && !canRecord(role, status)) {
    throw new Error('O papel escolhido não registra esta etapa.')
  }

  const at = new Date().toISOString()
  updateProgress(batchId, (entry) => {
    entry.events!.push({
      type: status,
      at,
      role,
      location: trimmed(details.location),
      notes: trimmed(details.notes),
    })
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

export function cancelDemoBatch(batchId: string, notes: string, role: UserRole = 'ADMIN'): Batch {
  assertRole(role, ['ADMIN'], 'Somente um administrador cancela lotes.')
  const record = recordOf(batchId)
  assertMutable(record)
  const at = new Date().toISOString()
  updateProgress(batchId, (entry) => {
    entry.events!.push({ type: 'CANCELLED', at, role, notes: trimmed(notes) })
  })
  return findDemoBatch(batchId)!
}

export function correctDemoEvent(batchId: string, input: CorrectionInput, role: UserRole = 'ADMIN'): PublicTraceEvent {
  assertRole(role, ['ADMIN'], 'Somente administradores registram correções.')
  const record = recordOf(batchId)
  assertMutable(record)
  const notes = trimmed(input.notes)
  if (!notes) throw new Error('Explique o que está sendo corrigido.')
  if (!chainOf(record).events.some((event) => event.id === input.correctedEventId)) {
    throw new Error('O evento corrigido não pertence a este lote.')
  }
  const at = new Date().toISOString()
  updateProgress(batchId, (entry) => {
    entry.events!.push({ type: 'CORRECTION', at, role, notes, correctedEventId: input.correctedEventId })
  })
  return findDemoBatchEvents(batchId).at(-1)!
}

export function setDemoBatchVisibility(batchId: string, isPublic: boolean): Batch {
  recordOf(batchId)
  updateProgress(batchId, (entry) => {
    entry.isPublic = isPublic
  })
  return findDemoBatch(batchId)!
}

// Like the API: the file's SHA-256 goes into a DOCUMENT_ATTACHED event, and
// the same file cannot be attached twice.
export async function attachDemoDocument(
  batchId: string,
  { file, type, isPublic }: UploadDocumentInput,
  role: UserRole = 'COOPERATIVE',
): Promise<BatchDocument> {
  assertRole(role, ['COOPERATIVE', 'ADMIN'], 'Documentos são anexados pela cooperativa ou por um administrador.')
  assertMutable(recordOf(batchId))
  const problem = await checkDocumentFile(file)
  if (problem) throw new Error(problem)

  const bytes = await readBytes(file)
  const fileHash = sha256HexBytes(bytes)
  const duplicate = allRecords().some((record) => record.documents.some((document) => document.fileHash === fileHash))
  if (duplicate) throw new Error('Este documento já foi enviado anteriormente.')

  const id = newId('demo-doc')
  const at = new Date().toISOString()
  keepFile(id, file, bytes)
  updateProgress(batchId, (entry) => {
    entry.documents = [
      ...(entry.documents ?? []),
      { id, type, originalName: file.name, size: file.size, mimeType: file.type, fileHash, isPublic, createdAt: at },
    ]
    entry.events!.push({
      type: 'DOCUMENT_ATTACHED',
      at,
      role,
      notes: `Documento anexado: ${file.name}`,
      documentIds: [id],
    })
  })
  return listDemoDocuments(batchId).find((document) => document.id === id)!
}

export function setDemoDocumentVisibility(batchId: string, documentId: string, isPublic: boolean): BatchDocument {
  const record = recordOf(batchId)
  if (!record.documents.some((document) => document.id === documentId)) {
    throw new Error('Documento não encontrado neste lote.')
  }
  updateProgress(batchId, (entry) => {
    entry.documentVisibility = { ...entry.documentVisibility, [documentId]: isPublic }
  })
  return listDemoDocuments(batchId).find((document) => document.id === documentId)!
}
