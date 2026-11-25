import type { UserRole } from '@/types/api'

// Mirrors the @Roles guards and BatchAuthorizationService in the API, which
// remain the authority: the UI only uses this to offer the right action.
export const ROLES: UserRole[] = ['PRODUCER', 'COOPERATIVE', 'OPERATOR', 'ADMIN']

export const ROLE_TITLE: Record<UserRole, string> = {
  PRODUCER: 'Produtor',
  COOPERATIVE: 'Cooperativa',
  OPERATOR: 'Operador logístico',
  ADMIN: 'Administrador',
}

// "registrada pelo produtor", "pela cooperativa"...
export const ROLE_BY: Record<UserRole, string> = {
  PRODUCER: 'pelo produtor',
  COOPERATIVE: 'pela cooperativa',
  OPERATOR: 'pelo operador logístico',
  ADMIN: 'por um administrador',
}

export const ROLE_DUTIES: Record<UserRole, string> = {
  PRODUCER: 'Cadastra propriedades, cria lotes e registra a colheita.',
  COOPERATIVE: 'Registra recebimento e processamento e anexa documentos.',
  OPERATOR: 'Registra o transporte e a entrega.',
  ADMIN: 'Encerra, publica e cancela lotes e registra correções.',
}

export const canCreateFarm = (role?: UserRole) => role === 'PRODUCER' || role === 'ADMIN'
export const canCreateBatch = canCreateFarm
export const canManageDocuments = (role?: UserRole) => role === 'COOPERATIVE' || role === 'ADMIN'
export const isAdmin = (role?: UserRole) => role === 'ADMIN'
