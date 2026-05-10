import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DemoModeContextValue {
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null)

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)

  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true)
  }, [])

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false)
  }, [])

  return (
    <DemoModeContext value={{ isDemoMode, enableDemoMode, disableDemoMode }}>
      {children}
    </DemoModeContext>
  )
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext)
  if (!ctx) throw new Error('useDemoMode must be used inside DemoModeProvider')
  return ctx
}
