import { useCallback, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clearDemoData } from '@/mocks/demo-store'
import type { UserRole } from '@/types/api'
import { DemoModeContext } from './demo-context'

const DEMO_MODE_KEY = 'agropass.demoMode'
const DEMO_ROLE_KEY = 'agropass.demo.role'
const ROLES: UserRole[] = ['PRODUCER', 'COOPERATIVE', 'OPERATOR', 'ADMIN']
// The demo starts where a batch starts: with the producer.
const DEFAULT_ROLE: UserRole = 'PRODUCER'

function readStoredRole(): UserRole {
  try {
    const stored = window.localStorage.getItem(DEMO_ROLE_KEY) as UserRole | null
    return stored && ROLES.includes(stored) ? stored : DEFAULT_ROLE
  } catch {
    return DEFAULT_ROLE
  }
}

function readStoredDemoMode() {
  try {
    return window.localStorage.getItem(DEMO_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

function storeDemoMode(enabled: boolean) {
  try {
    if (enabled) window.localStorage.setItem(DEMO_MODE_KEY, 'true')
    else window.localStorage.removeItem(DEMO_MODE_KEY)
  } catch {
    // Storage blocked (private mode): the demo still works for this visit.
  }
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isDemoMode, setIsDemoMode] = useState(readStoredDemoMode)
  const [demoRole, setDemoRoleState] = useState(readStoredRole)

  const setDemoRole = useCallback((role: UserRole) => {
    try {
      window.localStorage.setItem(DEMO_ROLE_KEY, role)
    } catch {
      // Storage blocked: the role lasts for this visit.
    }
    setDemoRoleState(role)
  }, [])

  // Switching data source drops cached results from the other source.
  const enableDemoMode = useCallback(() => {
    storeDemoMode(true)
    queryClient.removeQueries()
    setIsDemoMode(true)
  }, [queryClient])

  // Leaving the demo also discards batches created during it.
  const disableDemoMode = useCallback(() => {
    storeDemoMode(false)
    clearDemoData()
    try {
      window.localStorage.removeItem(DEMO_ROLE_KEY)
    } catch {
      // Nothing persisted.
    }
    queryClient.removeQueries()
    setIsDemoMode(false)
    setDemoRoleState(DEFAULT_ROLE)
  }, [queryClient])

  return (
    <DemoModeContext value={{ isDemoMode, enableDemoMode, disableDemoMode, demoRole, setDemoRole }}>
      {children}
    </DemoModeContext>
  )
}
