import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { authApi, type AuthUser } from '@/api/authApi'
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
  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password)
    setAuthStorage(result.accessToken, result.user)
    if (isDemoMode) disableDemoMode()
    setUser(result.user)
  }, [isDemoMode, disableDemoMode])

  const logout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
  }, [])

  return (
    <AuthContext value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext>
  )
}
