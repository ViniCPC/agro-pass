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
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
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
  COFFEE: 'Café',
  SOY: 'Soja',
  CATTLE: 'Bovino',
  COCOA: 'Cacau',
  PALM_OIL: 'Óleo de palma',
  RUBBER: 'Borracha',
  WOOD: 'Madeira',
}

export const BIOME_LABEL: Record<Biome, string> = {
  AMAZON: 'Amazônia',
  CERRADO: 'Cerrado',
  ATLANTIC_FOREST: 'Mata Atlântica',
  CAATINGA: 'Caatinga',
  PAMPA: 'Pampa',
  PANTANAL: 'Pantanal',
}

export const TRACE_EVENT_LABEL: Record<TraceEventType, string> = {
  CREATED: 'Criado',
  HARVESTED: 'Colhido',
  RECEIVED_BY_COOPERATIVE: 'Recebido pela cooperativa',
  TRANSPORTED: 'Transportado',
  PROCESSED: 'Processado',
  EXPORTED: 'Exportado',
  MINTED_ONCHAIN: 'Registrado on-chain',
  EUDR_VALIDATED: 'Validado EUDR',
}

export const DOCUMENT_LABEL: Record<DocumentType, string> = {
  CAR: 'Cadastro Ambiental Rural (CAR)',
  INVOICE: 'Nota fiscal',
  WAREHOUSE_RECEIPT: 'Recibo de armazém',
  ENVIRONMENTAL_REPORT: 'Relatório ambiental',
  SATELLITE_IMAGE: 'Imagem de satélite',
  OTHER: 'Outra evidência',
}

export function trustMessage(
  batchStatus: BatchStatus,
  validationStatus: ValidationStatus | null | undefined,
) {
  if (validationStatus === 'COMPLIANT' && (batchStatus === 'VERIFIED' || batchStatus === 'MINTED' || batchStatus === 'EXPORTED')) {
    return 'Registro de rastreabilidade agrícola verificado.'
  }

  if (validationStatus === 'NON_COMPLIANT') {
    return 'Registro público disponível com evidência ambiental não conforme.'
  }

  if (validationStatus === 'NEEDS_REVIEW') {
    return 'Registro público disponível e atualmente em revisão ambiental.'
  }

  return 'Registro de rastreabilidade gerado pelas operações AgroPass.'
}
