import { api } from './client'

export type UserRole = 'PRODUCER' | 'COOPERATIVE' | 'OPERATOR' | 'ADMIN'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  producerId: string | null
  cooperativeId: string | null
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get<AuthUser>('/auth/me'),
}
