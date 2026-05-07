import { Navigate, Outlet } from 'react-router-dom'
import { useDemoMode } from '@/contexts/demo'

export function DemoGuard() {
  const { isDemoMode } = useDemoMode()

  if (!isDemoMode) {
    return <Navigate to="/demo" replace />
  }

  return <Outlet />
}
