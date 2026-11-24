import { sha256Hex } from '@/lib/sha256'
import type {
  Batch,
  Farm,
  PublicDocument,
  PublicEventDocument,
} from '@/types/api'
import type { DemoActor, DemoEventSpec } from './demo-chain'
import { MOCK_FARMS } from './farms.mock'

// Demo public codes use a prefix the API never generates (it issues
// AGP-YYYY-NNNN), so they resolve locally on any device without colliding
// with real passports.
export const DEMO_CODE_PREFIX = 'DEMO-'
export const DEMO_SHOWCASE_CODE = 'DEMO-2025-0001'
// Batch shown on the landing page: in transit, so it shows a live chain.
export const DEMO_LANDING_CODE = 'DEMO-2026-0001'

// The proof is derived from the chain at runtime, so batches are stored
// without it.
export type DemoBatch = Omit<Batch, 'blockchain'>

// Registered after closing, like the real flow: the anchored hash is the
// final chain hash, computed when the passport is built.
export interface DemoProof {
  network: string
  txHash: string
  tokenAddress: string
  at: string
}

export interface DemoBatchRecord {
  batch: DemoBatch
  farm: Farm
  events: DemoEventSpec[]
  documents: PublicDocument[]
  proof?: DemoProof
}

export const DEMO_LOGISTICS_ACTOR: DemoActor = {
  id: 'demo-user-operator',
  name: 'TransCerrado Logística',
  role: 'OPERATOR',
}

export const DEMO_ADMIN_ACTOR: DemoActor = {
  id: 'demo-user-admin',
  name: 'Equipe AgroPass',
  role: 'ADMIN',
}

export function producerActor(farm: Farm): DemoActor {
  return {
    id: `demo-user-producer-${farm.id}`,
    name: farm.producerName ?? 'Produtor rural',
    role: 'PRODUCER',
  }
}

export function cooperativeActor(farm: Farm): DemoActor {
  return {
    id: `demo-user-cooperative-${farm.id}`,
    name: farm.cooperativeName ?? 'Cooperativa Regional do Cerrado',
    role: 'COOPERATIVE',
  }
}

function demoFileUrl(fileName: string) {
  const path = `${import.meta.env.BASE_URL}demo/${fileName}`
  return typeof window === 'undefined' ? path : new URL(path, window.location.origin).href
}

function farmById(id: string): Farm {
  const farm = MOCK_FARMS.find((item) => item.id === id)
  if (!farm) throw new Error(`Fazenda demo ${id} não encontrada.`)
  return farm
}

function farmSummary(farm: Farm): DemoBatch['farm'] {
  return { name: farm.name, latitude: farm.latitude, longitude: farm.longitude }
}

// ── Showcase: one complete passport, every lifecycle stage ────────────────

const saoJoao = farmById('farm-001')
const saoJoaoProducer = producerActor(saoJoao)
const saoJoaoCooperative = cooperativeActor(saoJoao)

// Hashes are the real SHA-256 of the files in public/demo/.
const invoiceDocument: PublicEventDocument = {
  id: 'demo-doc-invoice-0001',
  type: 'INVOICE',
  isPublic: true,
  originalName: 'nota-fiscal-produtor-demo.pdf',
  fileUrl: demoFileUrl('nota-fiscal-produtor-demo.pdf'),
  size: 2282,
  mimeType: 'application/pdf',
  fileHash: '1f6f2574129e600876e6e7ba5fc14289b1dea4d76c920c2b119ecc28785a4dac',
  createdAt: '2025-06-18T16:05:00Z',
}

const warehouseReceiptDocument: PublicEventDocument = {
  id: 'demo-doc-receipt-0001',
  type: 'WAREHOUSE_RECEIPT',
  isPublic: true,
  originalName: 'recibo-armazem-demo.pdf',
  fileUrl: demoFileUrl('recibo-armazem-demo.pdf'),
  size: 2243,
  mimeType: 'application/pdf',
  fileHash: '9090ddeba06eeb80177863a154404debf1efd7c58c49782b6dcc914128aa72f4',
  createdAt: '2025-06-18T16:32:00Z',
}

// A CAR receipt carries the owner's CPF, so it stays restricted: the passport
// shows only its hash.
const carDocument: PublicDocument = {
  id: 'demo-doc-car-0001',
  type: 'CAR',
  scope: 'FARM',
  isPublic: false,
  originalName: null,
  fileUrl: null,
  size: 184_320,
  mimeType: 'application/pdf',
  fileHash: sha256Hex('demo:car-receipt:fazenda-sao-joao'),
  createdAt: '2025-01-10T08:00:00Z',
}

const SHOWCASE: DemoBatchRecord = {
  farm: saoJoao,
  batch: {
    id: 'demo-batch-0001',
    code: DEMO_SHOWCASE_CODE,
    publicCode: DEMO_SHOWCASE_CODE,
    productType: 'COFFEE',
    quantity: 7200,
    unit: 'kg',
    harvestDate: '2025-06-14T00:00:00Z',
    status: 'CLOSED',
    isPublic: true,
    integrityHash: null,
    tokenAddress: 'AgPDemo7mQ3kLp9NzXwR2sYtUeA4BcDfJnKoP8WmVqE',
    tokenizedAt: '2025-07-04T12:20:00Z',
    closedAt: '2025-07-04T12:00:00Z',
    farm: farmSummary(saoJoao),
    createdAt: '2025-06-12T12:15:00Z',
    updatedAt: '2025-07-04T12:20:00Z',
  },
  proof: {
    network: 'devnet',
    txHash:
      '5DemoTxkLp9NzXwR2sYtUeA4BcDfJnKoP8WmVqE7mQ3kLp9NzXwR2sYtUeA4BcDfJnKoP8WmVqE7mQ3kLp9NzXw',
    tokenAddress: 'AgPDemo7mQ3kLp9NzXwR2sYtUeA4BcDfJnKoP8WmVqE',
    at: '2025-07-04T12:20:00Z',
  },
  events: [
    {
      type: 'CREATED',
      actor: saoJoaoProducer,
      at: '2025-06-12T12:15:00Z',
      location: 'Araguari, MG',
      latitude: saoJoao.latitude,
      longitude: saoJoao.longitude,
    },
    {
      type: 'HARVESTED',
      actor: saoJoaoProducer,
      at: '2025-06-14T14:40:00Z',
      location: 'Fazenda São João, talhão 3',
      latitude: saoJoao.latitude,
      longitude: saoJoao.longitude,
      notes: 'Colheita seletiva de café arábica',
    },
    {
      type: 'DOCUMENT_ATTACHED',
      actor: saoJoaoCooperative,
      at: '2025-06-18T16:05:00Z',
      notes: 'Documento anexado: nota-fiscal-produtor-demo.pdf',
      documents: [invoiceDocument],
    },
    {
      type: 'RECEIVED',
      actor: saoJoaoCooperative,
      at: '2025-06-18T16:20:00Z',
      location: 'Patrocínio, MG',
      latitude: -18.9439,
      longitude: -46.9925,
      notes: 'Recebido no armazém 2: 120 sacas de 60 kg',
    },
    {
      type: 'DOCUMENT_ATTACHED',
      actor: saoJoaoCooperative,
      at: '2025-06-18T16:32:00Z',
      notes: 'Documento anexado: recibo-armazem-demo.pdf',
      documents: [warehouseReceiptDocument],
    },
    {
      type: 'IN_TRANSIT',
      actor: DEMO_LOGISTICS_ACTOR,
      at: '2025-06-25T10:00:00Z',
      location: 'Patrocínio, MG → Varginha, MG',
      notes: 'Carga lacrada, lacre nº 004512',
    },
    {
      type: 'PROCESSED',
      actor: saoJoaoCooperative,
      at: '2025-06-27T19:45:00Z',
      location: 'Varginha, MG',
      latitude: -21.5517,
      longitude: -45.4303,
      notes: 'Rebenefício e classificação: peneira 17/18',
    },
    {
      type: 'DELIVERED',
      actor: DEMO_LOGISTICS_ACTOR,
      at: '2025-07-03T13:30:00Z',
      location: 'Porto de Santos, SP',
      latitude: -23.9608,
      longitude: -46.3336,
      notes: 'Entregue no terminal de exportação',
    },
    {
      type: 'CLOSED',
      actor: DEMO_ADMIN_ACTOR,
      at: '2025-07-04T12:00:00Z',
      notes: 'Passaporte encerrado com a cadeia completa',
    },
  ],
  documents: [
    { ...warehouseReceiptDocument, scope: 'BATCH' },
    { ...invoiceDocument, scope: 'BATCH' },
    carDocument,
  ],
}

// ── Other demo batches, at different stages ───────────────────────────────

const boaVista = farmById('farm-002')
const recantoVerde = farmById('farm-004')
const boaEsperanca = farmById('farm-005')

// ── Landing page batch: a coffee lot on its way, chain still growing ──────

const LANDING: DemoBatchRecord = {
  farm: boaEsperanca,
  batch: {
    id: 'demo-batch-landing',
    code: 'AGP-2026-0001',
    publicCode: DEMO_LANDING_CODE,
    productType: 'COFFEE',
    quantity: 800,
    unit: 'sacas',
    harvestDate: '2026-11-08T00:00:00Z',
    status: 'IN_TRANSIT',
    isPublic: true,
    integrityHash: null,
    tokenAddress: null,
    tokenizedAt: null,
    closedAt: null,
    farm: farmSummary(boaEsperanca),
    createdAt: '2026-11-10T11:30:00Z',
    updatedAt: '2026-11-20T10:15:00Z',
  },
  events: [
    {
      type: 'CREATED',
      actor: producerActor(boaEsperanca),
      at: '2026-11-10T11:30:00Z',
      location: 'Patrocínio, MG',
      latitude: boaEsperanca.latitude,
      longitude: boaEsperanca.longitude,
    },
    {
      type: 'HARVESTED',
      actor: producerActor(boaEsperanca),
      at: '2026-11-11T13:00:00Z',
      location: 'Fazenda Boa Esperança',
      notes: 'Café arábica, colheita seletiva',
    },
    {
      type: 'RECEIVED',
      actor: cooperativeActor(boaEsperanca),
      at: '2026-11-14T17:40:00Z',
      location: 'Patrocínio, MG',
      notes: 'Recebimento confirmado: 800 sacas',
    },
    {
      type: 'IN_TRANSIT',
      actor: DEMO_LOGISTICS_ACTOR,
      at: '2026-11-20T10:15:00Z',
      location: 'Patrocínio, MG → Varginha, MG',
      notes: 'Transporte iniciado',
    },
  ],
  documents: [],
}

function stageEvents(
  farm: Farm,
  stages: Array<[DemoEventSpec['type'], string]>,
): DemoEventSpec[] {
  return stages.map(([type, at]) => ({
    type,
    at,
    actor:
      type === 'CREATED' || type === 'HARVESTED'
        ? producerActor(farm)
        : type === 'IN_TRANSIT'
          ? DEMO_LOGISTICS_ACTOR
          : cooperativeActor(farm),
    ...(type === 'CREATED'
      ? {
          location: `${farm.city}, ${farm.state}`,
          latitude: farm.latitude,
          longitude: farm.longitude,
        }
      : {}),
  }))
}

function simpleBatch(
  id: string,
  farm: Farm,
  batch: Pick<DemoBatch, 'productType' | 'quantity' | 'harvestDate' | 'status' | 'isPublic'>,
  stages: Array<[DemoEventSpec['type'], string]>,
): DemoBatchRecord {
  const code = `${DEMO_CODE_PREFIX}2025-${id}`
  return {
    farm,
    batch: {
      ...batch,
      id: `demo-batch-${id}`,
      code,
      publicCode: code,
      unit: 'kg',
      integrityHash: null,
      tokenAddress: null,
      tokenizedAt: null,
      closedAt: null,
      farm: farmSummary(farm),
      createdAt: stages[0][1],
      updatedAt: stages[stages.length - 1][1],
    },
    events: stageEvents(farm, stages),
    documents: [],
  }
}

export const DEMO_SEED: DemoBatchRecord[] = [
  SHOWCASE,
  LANDING,
  simpleBatch(
    '0002',
    boaVista,
    { productType: 'SOY', quantity: 12000, harvestDate: '2025-02-01T00:00:00Z', status: 'RECEIVED', isPublic: true },
    [
      ['CREATED', '2025-02-05T13:00:00Z'],
      ['HARVESTED', '2025-02-08T15:00:00Z'],
      ['RECEIVED', '2025-02-12T17:30:00Z'],
    ],
  ),
  simpleBatch(
    '0003',
    recantoVerde,
    { productType: 'COFFEE', quantity: 3200, harvestDate: '2025-04-10T00:00:00Z', status: 'IN_TRANSIT', isPublic: true },
    [
      ['CREATED', '2025-04-11T10:30:00Z'],
      ['HARVESTED', '2025-04-12T12:00:00Z'],
      ['RECEIVED', '2025-04-15T18:10:00Z'],
      ['IN_TRANSIT', '2025-04-18T09:00:00Z'],
    ],
  ),
  // Private on purpose: its QR shows the "not published yet" state.
  simpleBatch(
    '0004',
    saoJoao,
    { productType: 'COFFEE', quantity: 4500, harvestDate: null, status: 'CREATED', isPublic: false },
    [['CREATED', '2025-05-01T14:00:00Z']],
  ),
]
