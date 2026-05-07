import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DemoModeContextValue {
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null)

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() =>
    localStorage.getItem('agropass:demo') === 'true'
  )

  const enableDemoMode = useCallback(() => {
    localStorage.setItem('agropass:demo', 'true')
    setIsDemoMode(true)
  }, [])

  const disableDemoMode = useCallback(() => {
    localStorage.removeItem('agropass:demo')
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
