import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { authApi, type AuthResponse, type AuthUser, type SignupInput } from '@/api/authApi'
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setAuthStorage,
} from '@/auth/auth-storage'
import { AuthContext } from './auth-context'
import { useDemoMode } from './demo-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, disableDemoMode } = useDemoMode()
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>())
  const [isLoading, setIsLoading] = useState(Boolean(getAccessToken()))

  useEffect(() => {
    if (!getAccessToken()) {
      return
    }

    authApi.me()
      .then((currentUser) => {
        setUser(currentUser)
        const token = getAccessToken()
        if (token) setAuthStorage(token, currentUser)
      })
      .catch(() => {
        clearAuthStorage()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // A real session replaces the demo, otherwise the hooks keep serving mocks.
  const startSession = useCallback((result: AuthResponse) => {
    setAuthStorage(result.accessToken, result.user)
    if (isDemoMode) disableDemoMode()
    setUser(result.user)
  }, [isDemoMode, disableDemoMode])

  const login = useCallback(async (email: string, password: string) => {
    startSession(await authApi.login(email, password))
  }, [startSession])

  const signup = useCallback(async (input: SignupInput) => {
    startSession(await authApi.signup(input))
  }, [startSession])

  const logout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
  }, [])

  return (
    <AuthContext value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext>
  )
}
