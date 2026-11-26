import { createContext, useContext } from 'react'
import type { AuthUser, SignupInput, UserRole } from '@/api/authApi'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => void
  // Server demo visit in progress (isolated data, deleted when it expires).
  demoSession: { expiresAt: string } | null
  startDemoSession: () => Promise<void>
  switchDemoRole: (role: UserRole) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
