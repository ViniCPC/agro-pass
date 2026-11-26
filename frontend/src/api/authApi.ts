import { api } from './client'

export type UserRole = 'PRODUCER' | 'COOPERATIVE' | 'OPERATOR' | 'ADMIN'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  producerId: string | null
  cooperativeId: string | null
  // Set on the accounts of a server demo visit.
  demoSessionId?: string | null
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

// "Entrar na demo": an isolated visit with one signed-in account per role.
export interface DemoSessionResponse {
  expiresAt: string
  accounts: Record<UserRole, AuthResponse>
}

export const authApi = {
  demo: () => api.post<DemoSessionResponse>('/auth/demo', {}),
  signup: (input: SignupInput) => api.post<AuthResponse>('/auth/signup', input),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get<AuthUser>('/auth/me'),
}
