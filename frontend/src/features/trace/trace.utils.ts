import type {
  BatchStatus,
  Biome,
  DocumentType,
  ProductType,
  TraceEventType,
  ValidationStatus,
} from '@/types/api'

export function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function shortHash(value: string | null, start = 10, end = 8) {
  if (!value) return '-'
  if (value.length <= start + end + 3) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

export const PRODUCT_LABEL: Record<ProductType, string> = {
  COFFEE: 'Coffee',
  SOY: 'Soy',
  CATTLE: 'Cattle',
  COCOA: 'Cocoa',
  PALM_OIL: 'Palm oil',
  RUBBER: 'Rubber',
  WOOD: 'Wood',
}

export const BIOME_LABEL: Record<Biome, string> = {
  AMAZON: 'Amazon',
  CERRADO: 'Cerrado',
  ATLANTIC_FOREST: 'Atlantic Forest',
  CAATINGA: 'Caatinga',
  PAMPA: 'Pampa',
  PANTANAL: 'Pantanal',
}

export const TRACE_EVENT_LABEL: Record<TraceEventType, string> = {
  CREATED: 'Created',
  HARVESTED: 'Harvested',
  RECEIVED_BY_COOPERATIVE: 'Received by cooperative',
  TRANSPORTED: 'Transported',
  PROCESSED: 'Processed',
  EXPORTED: 'Exported',
  MINTED_ONCHAIN: 'Minted on-chain',
  EUDR_VALIDATED: 'EUDR validated',
}

export const DOCUMENT_LABEL: Record<DocumentType, string> = {
  CAR: 'Rural Environmental Registry (CAR)',
  INVOICE: 'Invoice',
  WAREHOUSE_RECEIPT: 'Warehouse receipt',
  ENVIRONMENTAL_REPORT: 'Environmental report',
  SATELLITE_IMAGE: 'Satellite image',
  OTHER: 'Other evidence',
}

export function trustMessage(
  batchStatus: BatchStatus,
  validationStatus: ValidationStatus | null | undefined,
) {
  if (validationStatus === 'COMPLIANT' && (batchStatus === 'VERIFIED' || batchStatus === 'MINTED' || batchStatus === 'EXPORTED')) {
    return 'Verified agricultural traceability record.'
  }

  if (validationStatus === 'NON_COMPLIANT') {
    return 'Public record available with non-compliant environmental evidence.'
  }

  if (validationStatus === 'NEEDS_REVIEW') {
    return 'Public record available and currently under environmental review.'
  }

  return 'Public traceability record generated from AgroPass operations.'
}
