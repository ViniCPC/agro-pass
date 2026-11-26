import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  authApi,
  type AuthResponse,
  type AuthUser,
  type DemoSessionResponse,
  type SignupInput,
  type UserRole,
} from '@/api/authApi'
import {
  clearAuthStorage,
  getAccessToken,
  getStoredDemoSession,
  getStoredUser,
  setAuthStorage,
  setStoredDemoSession,
} from '@/auth/auth-storage'
import { AuthContext } from './auth-context'
import { useDemoMode } from './demo-context'

function liveDemoSession() {
  const stored = getStoredDemoSession<DemoSessionResponse>()
  if (!stored) return null
  if (new Date(stored.expiresAt).getTime() <= Date.now()) {
    clearAuthStorage()
    return null
  }
  return stored
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, disableDemoMode } = useDemoMode()
  const queryClient = useQueryClient()
  const [demoSession, setDemoSession] = useState<DemoSessionResponse | null>(liveDemoSession)
  const [user, setUser] = useState<AuthUser | null>(() =>
    // An expired demo visit was cleared above: its user goes with it.
    getStoredUser<AuthUser>(),
  )
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
        setDemoSession(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // A real session replaces the offline demo, otherwise the hooks keep
  // serving mocks. Cached queries belong to the previous account: drop them.
  const startSession = useCallback((result: AuthResponse) => {
    setAuthStorage(result.accessToken, result.user)
    if (isDemoMode) disableDemoMode()
    setUser(result.user)
    queryClient.removeQueries()
  }, [isDemoMode, disableDemoMode, queryClient])

  const login = useCallback(async (email: string, password: string) => {
    clearAuthStorage()
    setDemoSession(null)
    startSession(await authApi.login(email, password))
  }, [startSession])

  const signup = useCallback(async (input: SignupInput) => {
    clearAuthStorage()
    setDemoSession(null)
    startSession(await authApi.signup(input))
  }, [startSession])

  // Server demo: an isolated visit; starts as the admin, who can do every step.
  const startDemoSession = useCallback(async () => {
    const session = await authApi.demo()
    setStoredDemoSession(session)
    setDemoSession(session)
    startSession(session.accounts.ADMIN)
  }, [startSession])

  const switchDemoRole = useCallback((role: UserRole) => {
    const account = demoSession?.accounts[role]
    if (!account) return
    setAuthStorage(account.accessToken, account.user)
    setUser(account.user)
    // Each role sees different records: refetch everything as the new one.
    void queryClient.resetQueries()
  }, [demoSession, queryClient])

  const logout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
    setDemoSession(null)
    queryClient.removeQueries()
  }, [queryClient])

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        demoSession: demoSession && user?.demoSessionId ? { expiresAt: demoSession.expiresAt } : null,
        startDemoSession,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext>
  )
}
