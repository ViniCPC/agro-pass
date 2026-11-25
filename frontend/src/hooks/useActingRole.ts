import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import type { UserRole } from '@/types/api'

// Who is acting: the signed-in account (its role comes from the JWT and the
// API enforces it), or in the demo the role the visitor chose to play.
export function useActingRole(): {
  role: UserRole | undefined
  isDemoMode: boolean
  // Only in the demo: play another role.
  switchRole?: (role: UserRole) => void
} {
  const { user } = useAuth()
  const { isDemoMode, demoRole, setDemoRole } = useDemoMode()
  return isDemoMode
    ? { role: demoRole, isDemoMode, switchRole: setDemoRole }
    : { role: user?.role, isDemoMode }
}
