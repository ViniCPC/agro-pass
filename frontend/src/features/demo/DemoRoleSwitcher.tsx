import { UserRound } from 'lucide-react'
import { ROLE_DUTIES, ROLE_TITLE, ROLES } from '@/features/auth/roles'
import { useActingRole } from '@/hooks/useActingRole'
import type { UserRole } from '@/types/api'

// Demo only (offline or server visit). Real accounts get their role from the JWT.
export function DemoRoleSwitcher() {
  const { role, switchRole } = useActingRole()
  if (!role || !switchRole) return null
  const demoRole = role
  const setDemoRole = switchRole

  return (
    // Not a wrapping <label>: its text would include every option name.
    <div
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-2.5 text-xs text-[var(--color-ink-muted)]"
      title={ROLE_DUTIES[demoRole]}
    >
      <UserRound size={14} aria-hidden className="shrink-0" />
      <span aria-hidden className="hidden lg:inline">Atuando como</span>
      <select
        aria-label="Atuando como"
        value={demoRole}
        onChange={(event) => setDemoRole(event.target.value as UserRole)}
        className="h-full max-w-[8.5rem] cursor-pointer sm:max-w-[9.5rem] rounded-r-lg bg-transparent pr-2 text-xs font-semibold text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal-600)]"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_TITLE[role]}
          </option>
        ))}
      </select>
    </div>
  )
}
