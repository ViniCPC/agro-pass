import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'

// Visitors without a session land on the demo page, not on a login form.
export function RootRedirect() {
  const { user, isLoading } = useAuth()
  const { isDemoMode } = useDemoMode()

  if (isLoading) return null
  return <Navigate to={user || isDemoMode ? '/dashboard' : '/demo'} replace />
}
