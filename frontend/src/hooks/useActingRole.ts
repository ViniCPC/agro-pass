import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import type { UserRole } from '@/types/api'

// Who is acting: the signed-in account (its role comes from the JWT and the
// API enforces it), or in the demo the role the visitor chose to play.
export function useActingRole(): {
  role: UserRole | undefined
  isDemoMode: boolean
  // Only in a demo (offline or server visit): play another role.
  switchRole?: (role: UserRole) => void
} {
  const { user, demoSession, switchDemoRole } = useAuth()
  const { isDemoMode, demoRole, setDemoRole } = useDemoMode()
  if (isDemoMode) return { role: demoRole, isDemoMode, switchRole: setDemoRole }
  // Server demo: a real account per role; switching swaps the signed-in one.
  if (demoSession) return { role: user?.role, isDemoMode, switchRole: switchDemoRole }
  return { role: user?.role, isDemoMode }
}
