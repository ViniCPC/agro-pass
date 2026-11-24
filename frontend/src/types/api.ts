export type BatchStatus =
  | 'CREATED'
  | 'HARVESTED'
  | 'RECEIVED'
  | 'IN_TRANSIT'
  | 'PROCESSED'
  | 'DELIVERED'
  | 'CLOSED'
  | 'CANCELLED'
export type ProductType = 'COFFEE' | 'SOY' | 'CATTLE' | 'COCOA' | 'PALM_OIL' | 'RUBBER' | 'WOOD'
export type TraceEventType =
  | 'CREATED'
  | 'HARVESTED'
  | 'RECEIVED'
  | 'IN_TRANSIT'
  | 'PROCESSED'
  | 'DELIVERED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'MINTED_ONCHAIN'
  | 'DOCUMENT_ATTACHED'
  | 'CORRECTION'
export type DocumentType = 'CAR' | 'INVOICE' | 'WAREHOUSE_RECEIPT' | 'OTHER'
export type PublicDocumentScope = 'BATCH' | 'FARM'
export type UserRole = 'PRODUCER' | 'COOPERATIVE' | 'OPERATOR' | 'ADMIN'

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

export interface Farm {
  id: string
  name: string
  city: string
  state: string
  latitude: number
  longitude: number
  carNumber: string | null
  polygonGeoJson: object | null
  totalAreaHa: number | null
  producerName: string | null
  cooperativeName: string | null
  producerId: string
  createdAt: string
}

export interface Batch {
  id: string
  code: string
  productType: ProductType
  quantity: number
  unit: string
  harvestDate: string | null
  status: BatchStatus
  publicCode: string
  isPublic: boolean
  integrityHash: string | null
  tokenAddress: string | null
  tokenizedAt: string | null
  closedAt: string | null
  farm: {
    name: string
    latitude: number
    longitude: number
  }
  qrCodeUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface TraceEventDocument {
  id: string
  type: DocumentType
  originalName: string
  fileUrl: string
  size: number
  mimeType: string
  fileHash: string
  createdAt: string
}

export interface TraceEvent {
  id: string
  type: TraceEventType
  sequence: number
  notes: string | null
  previousHash: string | null
  recordedById: string
  recordedAt: string
  correctedEventId: string | null
  documents: TraceEventDocument[]
  actorName: string
  recordedBy?: { id: string; name: string; role: UserRole }
  cooperativeId: string | null
  exporterId: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  eventHash: string
  txHash: string | null
  customStageName?: string | null
  documentId?: string | null
  document?: TraceEventDocument | null
  userId: string | null
  batchId: string
  createdAt: string
}

// Restricted documents keep their hash public but never their name or link.
export interface PublicEventDocument {
  id: string
  type: DocumentType
  isPublic: boolean
  originalName: string | null
  fileUrl: string | null
  size: number
  mimeType: string
  fileHash: string
  createdAt: string
}

export interface PublicDocument extends PublicEventDocument {
  scope: PublicDocumentScope
}

export interface PublicTraceEvent {
  id: string
  type: TraceEventType
  sequence: number
  location: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  previousHash: string | null
  eventHash: string
  txHash: string | null
  recordedAt: string
  correctedEventId: string | null
  actor: { name: string; role: UserRole }
  documents: PublicEventDocument[]
  // Aliases of the previous payload.
  actorName: string
  createdAt: string
  customStageName?: string | null
  documentId?: string | null
  document?: PublicEventDocument | null
}

export interface PassportIntegrity {
  valid: boolean
  eventCount: number
  finalHash: string | null
  checkedAt: string
  errors: Array<{ sequence: number | null; code: string; message: string }>
}

export interface PublicBatch {
  batch: {
    id: string
    code: string
    productType: ProductType
    quantity: number
    unit: string
    harvestDate: string | null
    status: BatchStatus
    publicCode: string
    isPublic: boolean
    integrityHash: string | null
    closedAt: string | null
    createdAt: string
    updatedAt: string
  }
  blockchain: {
    tokenAddress: string | null
    tokenizedAt: string | null
  }
  farm: {
    name: string
    city: string
    state: string
    latitude: number | null
    longitude: number | null
    carNumber: string | null
    totalAreaHa: number | null
    producer: { name: string }
  }
  traceEvents: PublicTraceEvent[]
  documents: PublicDocument[]
  // Optional so a frontend deployed ahead of the API still renders.
  integrity?: PassportIntegrity
}
