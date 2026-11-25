import type {
  Batch,
  BatchDocument,
  DocumentType,
  BatchStatus,
  PaginatedResponse,
  PaginationParams,
  ProductType,
  TokenizationResult,
  TraceEvent,
} from '@/types/api'
import { api } from './client'

export interface CreateBatchInput {
  farmId: string
  productType: ProductType
  quantity: number
  unit: string
  harvestDate?: string
}

// Optional information recorded with a stage. It is hashed with the event,
// so it can never be edited afterwards, only corrected by a new event.
export interface StageDetails {
  location?: string
  notes?: string
}

export interface UploadDocumentInput {
  file: File
  type: DocumentType
  isPublic: boolean
}

export interface CorrectionInput {
  correctedEventId: string
  notes: string
}

// QR codes, PNG labels and print sheets are generated in the browser from
// the batch publicCode (see features/qr), so they also work in demo mode.
export const batchesApi = {
  list: (params: PaginationParams = {}) =>
    api.get<PaginatedResponse<Batch>>(`/batches${api.query({ page: params.page ?? 1, limit: params.limit ?? 50 })}`),

  getOne: (id: string) =>
    api.get<Batch>(`/batches/${id}`),

  create: (payload: CreateBatchInput) =>
    api.post<Batch>('/batches', payload),

  // Records the next lifecycle stage; CLOSED also triggers the blockchain proof.
  updateStatus: (id: string, status: BatchStatus, details: StageDetails = {}) =>
    api.patch<Batch>(`/batches/${id}/status`, { status, ...details }),

  // Admin only. The reason goes into the CANCELLED event.
  cancel: (id: string, notes: string) =>
    api.patch<Batch>(`/batches/${id}/cancel`, { notes }),

  setVisibility: (id: string, isPublic: boolean) =>
    api.patch<Batch>(`/batches/${id}/visibility`, { isPublic }),

  // Closing a batch registers its proof automatically; this retries after a
  // failure (admin only). Idempotent: never mints twice.
  tokenize: (id: string) =>
    api.post<TokenizationResult>(`/batches/${id}/tokenize`, {}),

  getEvents: (batchId: string) =>
    api.get<TraceEvent[]>(`/batches/${batchId}/events`),

  // Admin only: a new event that points at the one it corrects. The original
  // event is never changed.
  addCorrection: (batchId: string, input: CorrectionInput) =>
    api.post<TraceEvent>(`/batches/${batchId}/events`, { type: 'CORRECTION', ...input }),

  listDocuments: (batchId: string) =>
    api.get<BatchDocument[]>(`/batches/${batchId}/documents`),

  // Cooperative or admin. Also records a DOCUMENT_ATTACHED event in the chain.
  uploadDocument: (batchId: string, { file, type, isPublic }: UploadDocumentInput) => {
    const form = new FormData()
    form.append('type', type)
    form.append('isPublic', String(isPublic))
    form.append('file', file)
    return api.upload<BatchDocument>(`/batches/${batchId}/documents`, form)
  },

  setDocumentVisibility: (batchId: string, documentId: string, isPublic: boolean) =>
    api.patch<BatchDocument>(`/batches/${batchId}/documents/${documentId}/visibility`, { isPublic }),

  downloadDocument: (batchId: string, documentId: string) =>
    api.blob(`/batches/${batchId}/documents/${documentId}/file`),
}
