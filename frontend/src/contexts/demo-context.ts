import { createContext, useContext } from 'react'

export interface DemoModeContextValue {
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
}

export const DemoModeContext = createContext<DemoModeContextValue | null>(null)

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (!context) throw new Error('useDemoMode must be used inside DemoModeProvider')
  return context
}
