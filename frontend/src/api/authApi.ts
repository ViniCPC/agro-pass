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

// Self-service sign-up always creates a producer account (see SignupDto).
export interface SignupInput {
  name: string
  email: string
  password: string
  phone: string
  document: string
  inviteCode?: string
}

export const authApi = {
  signup: (input: SignupInput) => api.post<AuthResponse>('/auth/signup', input),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get<AuthUser>('/auth/me'),
}
