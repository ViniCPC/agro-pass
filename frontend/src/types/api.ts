// ── Enums ────────────────────────────────────────────────────────────────────

export type FarmStatus       = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ValidationStatus = 'PENDING' | 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW' | 'EXPIRED'
export type BatchStatus      = 'CREATED' | 'VERIFIED' | 'MINTED' | 'IN_TRANSIT' | 'EXPORTED'
export type ProductType      = 'COFFEE' | 'SOY' | 'CATTLE' | 'COCOA' | 'PALM_OIL' | 'RUBBER' | 'WOOD'
export type TraceEventType   =
  | 'CREATED'
  | 'HARVESTED'
  | 'RECEIVED_BY_COOPERATIVE'
  | 'TRANSPORTED'
  | 'PROCESSED'
  | 'EXPORTED'
  | 'MINTED_ONCHAIN'
  | 'EUDR_VALIDATED'
export type Biome        = 'AMAZON' | 'CERRADO' | 'ATLANTIC_FOREST' | 'CAATINGA' | 'PAMPA' | 'PANTANAL'
export type DocumentType = 'CAR' | 'INVOICE' | 'WAREHOUSE_RECEIPT' | 'ENVIRONMENTAL_REPORT' | 'SATELLITE_IMAGE' | 'OTHER'
export type PublicDocumentScope = 'BATCH' | 'FARM'
export type EudrValidationMode = 'MOCK' | 'SEMI_AUTOMATIC'

// ── Pagination ────────────────────────────────────────────────────────────────

export interface Pagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

export interface PaginationParams {
  page?: number
  limit?: number
}

// ── Farm ─────────────────────────────────────────────────────────────────────

export interface Farm {
  id: string
  name: string
  city: string
  state: string
  latitude: number
  longitude: number
  carNumber: string | null
  polygonGeoJson: object | null
  carRawJson: object | null
  totalAreaHa: number | null
  legalReserveAreaHa: number | null
  appAreaHa: number | null
  consolidatedAreaHa: number | null
  biome: Biome | null
  isAmazonLegal: boolean
  lastValidationId: string | null
  lastValidationStatus: ValidationStatus | null
  lastValidatedAt: string | null
  lastValidationHash: string | null
  // Populated only by GET /farms/:id (null in list responses)
  producerName: string | null
  cooperativeName: string | null
  status: FarmStatus
  producerId: string
  createdAt: string
}

// ── Batch ─────────────────────────────────────────────────────────────────────

export interface Batch {
  id: string
  code: string
  productType: ProductType
  quantity: number
  unit: string
  harvestDate: string | null
  status: BatchStatus
  farm: {
    name: string
    latitude: number
    longitude: number
  }
  // Optional — backend may expose in future; always present in mock data for on-chain batches
  cnftAddress?: string | null
  qrCodeUrl?: string | null
  mintTxHash?: string | null
  createdAt: string
}

// ── Trace event ───────────────────────────────────────────────────────────────

export interface TraceEvent {
  id: string
  type: TraceEventType
  actorName: string
  cooperativeId: string | null
  exporterId: string | null
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
  batchId: string
  createdAt: string
}

// ── EUDR Validation ───────────────────────────────────────────────────────────

export interface EudrValidation {
  id: string
  status: ValidationStatus
  cutoffDate: string | null
  hectaresDeforested: number | null
  satelliteImageBeforeUrl: string | null
  satelliteImageAfterUrl: string | null
  ndviBefore: number | null
  ndviAfter: number | null
  evidenceHash: string | null
  validatedAt: string | null
  validUntil: string | null
}

export interface EudrValidateResult {
  message: string
  validationId: string
  farmId: string
  farmName: string
  status: ValidationStatus
  farmStatus: FarmStatus
  hectaresDeforested: number
  cutoffDate: string
  validUntil: string
  evidenceHash: string
  satelliteImageBeforeUrl: string | null
  satelliteImageAfterUrl: string | null
  ndviBefore: number | null
  ndviAfter: number | null
  ndviDelta: number | null
}

export interface PublicDocument {
  id: string
  type: DocumentType
  scope: PublicDocumentScope
  fileUrl: string
  fileHash: string
  createdAt: string
}

// ── Public batch (page /trace) ────────────────────────────────────────────────

export interface PublicBatch {
  batch: {
    id: string
    code: string
    productType: ProductType
    quantity: number
    unit: string
    harvestDate: string | null
    status: BatchStatus
    qrCodeUrl: string | null
    createdAt: string
    updatedAt: string
  }
  blockchain: {
    cnftAddress: string | null
    merkleTree: string | null
    metadataUri: string | null
    mintTxHash: string | null
  }
  farm: {
    id: string
    name: string
    city: string
    state: string
    latitude: number
    longitude: number
    carNumber: string | null
    totalAreaHa: number | null
    legalReserveAreaHa: number | null
    appAreaHa: number | null
    consolidatedAreaHa: number | null
    biome: Biome | null
    isAmazonLegal: boolean
    lastValidation: EudrValidation | null
    producer: {
      name: string
      reputationScore: number
    }
  }
  traceEvents: Array<{
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
  }>
  documents: PublicDocument[]
}
