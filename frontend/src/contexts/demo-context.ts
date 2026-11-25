import { createContext, useContext } from 'react'
import type { UserRole } from '@/types/api'

export interface DemoModeContextValue {
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
  // The role the visitor plays in the demo. Each stage is recorded by one
  // role, as in the API; switching roles shows who does what.
  demoRole: UserRole
  setDemoRole: (role: UserRole) => void
}

export const DemoModeContext = createContext<DemoModeContextValue | null>(null)

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (!context) throw new Error('useDemoMode must be used inside DemoModeProvider')
  return context
}
