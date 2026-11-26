import { ArrowRightLeft, UserRound } from 'lucide-react'
import { useActingRole } from '@/hooks/useActingRole'
import type { UserRole } from '@/types/api'
import { ROLE_TITLE } from './roles'

// Shown when the next action belongs to someone else. In the demo the
// visitor can take that role; with a real account the API decides.
export function RoleHandoff({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { switchRole } = useActingRole()

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-page)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex gap-2 text-sm text-[var(--color-ink-muted)]">
        <UserRound size={15} className="mt-0.5 shrink-0" aria-hidden />
        <span>{children}</span>
      </p>
      {switchRole ? (
        <button
          type="button"
          onClick={() => switchRole(role)}
          className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-teal-600)] px-3 text-sm font-semibold text-[var(--color-teal-700)] hover:bg-[var(--color-teal-50)]"
        >
          <ArrowRightLeft size={14} aria-hidden />
          Atuar como {ROLE_TITLE[role].toLowerCase()}
        </button>
      ) : (
        <p className="shrink-0 text-xs text-[var(--color-ink-subtle)]">
          Entre com uma conta de {ROLE_TITLE[role].toLowerCase()} para continuar.
        </p>
      )}
    </div>
  )
}
