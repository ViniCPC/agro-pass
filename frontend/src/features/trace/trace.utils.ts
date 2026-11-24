import type {
  BatchStatus,
  DocumentType,
  ProductType,
  TraceEventType,
  UserRole,
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

export function formatQuantity(quantity: number, unit: string) {
  return `${new Intl.NumberFormat('pt-BR').format(quantity)} ${unit}`
}

export function shortHash(value: string | null, start = 10, end = 8) {
  if (!value) return '-'
  if (value.length <= start + end + 3) return value
  return value.slice(0, start) + '...' + value.slice(-end)
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

export const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  CREATED: 'Criado',
  HARVESTED: 'Colhido',
  RECEIVED: 'Recebido',
  IN_TRANSIT: 'Em trânsito',
  PROCESSED: 'Processado',
  DELIVERED: 'Entregue',
  CLOSED: 'Encerrado',
  CANCELLED: 'Cancelado',
}

export const TRACE_EVENT_LABEL: Record<TraceEventType, string> = {
  CREATED: 'Lote criado',
  HARVESTED: 'Colheita registrada',
  RECEIVED: 'Recebido',
  IN_TRANSIT: 'Em trânsito',
  PROCESSED: 'Processado',
  DELIVERED: 'Entregue',
  CLOSED: 'Passaporte encerrado',
  CANCELLED: 'Cancelado',
  MINTED_ONCHAIN: 'Registrado na blockchain',
  DOCUMENT_ATTACHED: 'Documento anexado',
  CORRECTION: 'Correção auditável',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  PRODUCER: 'Produtor',
  COOPERATIVE: 'Cooperativa',
  OPERATOR: 'Operador logístico',
  ADMIN: 'AgroPass',
}

export const DOCUMENT_LABEL: Record<DocumentType, string> = {
  CAR: 'Cadastro Ambiental Rural (CAR)',
  INVOICE: 'Nota fiscal',
  WAREHOUSE_RECEIPT: 'Recibo de armazém',
  OTHER: 'Outra evidência',
}

export const DOCUMENT_SHORT_LABEL: Record<DocumentType, string> = {
  CAR: 'CAR',
  INVOICE: 'Nota fiscal',
  WAREHOUSE_RECEIPT: 'Recibo de armazém',
  OTHER: 'Evidência',
}

export function trustMessage(batchStatus: BatchStatus) {
  if (batchStatus === 'CLOSED') {
    return 'Passaporte encerrado com a cadeia completa de eventos.'
  }
  if (batchStatus === 'DELIVERED') {
    return 'Lote entregue com histórico público de rastreabilidade.'
  }
  if (batchStatus === 'IN_TRANSIT') {
    return 'Lote em trânsito com histórico público de eventos.'
  }
  if (batchStatus === 'CANCELLED') {
    return 'Passaporte cancelado; nenhuma nova etapa pode ser registrada.'
  }
  if (batchStatus !== 'CREATED') {
    return 'Registro de origem com etapas de rastreabilidade verificáveis.'
  }
  return 'Registro de rastreabilidade iniciado na fazenda de origem.'
}
