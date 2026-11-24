import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'

// Visitors see the landing page; signed-in users and the demo go to the app.
export function HomeRoute({ landing }: { landing: ReactNode }) {
  const { user, isLoading } = useAuth()
  const { isDemoMode } = useDemoMode()

  if (isLoading) return null
  if (user || isDemoMode) return <Navigate to="/dashboard" replace />
  return landing
}
