import { useCallback, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clearDemoData } from '@/mocks/demo-store'
import { DemoModeContext } from './demo-context'

const DEMO_MODE_KEY = 'agropass.demoMode'

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
    queryClient.removeQueries()
    setIsDemoMode(false)
  }, [queryClient])

  return (
    <DemoModeContext value={{ isDemoMode, enableDemoMode, disableDemoMode }}>
      {children}
    </DemoModeContext>
  )
}
