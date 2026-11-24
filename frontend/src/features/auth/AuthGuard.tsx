import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'

export function AuthGuard() {
  const { user, isLoading } = useAuth()
  const { isDemoMode } = useDemoMode()
  const location = useLocation()

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm">Validando acesso...</div>
  }

  if (!user && !isDemoMode) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
