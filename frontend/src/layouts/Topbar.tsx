import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { DemoModeBadge } from '@/components/DemoModeBadge'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import { ROLE_TITLE } from '@/features/auth/roles'
import { DemoRoleSwitcher } from '@/features/demo/DemoRoleSwitcher'

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/dashboard':   { title: 'Dashboard',  description: 'Visão geral do sistema AgroPass' },
  '/farms':       { title: 'Fazendas',   description: 'Propriedades de origem dos lotes' },
  '/farms/new':   { title: 'Nova propriedade', description: 'Cadastro da origem dos lotes' },
  '/batches':     { title: 'Lotes',      description: 'Colheitas com passaporte digital' },
  '/batches/new': { title: 'Novo lote',  description: 'Cadastro da origem do lote' },
}

interface TopbarProps {
  onOpenMenu?: () => void
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDemoMode } = useDemoMode()

  const meta =
    PAGE_META[pathname] ??
    (pathname.startsWith('/batches/')
      ? { title: 'Lote', description: 'Detalhe interno com rastreabilidade e QR do lote' }
      : { title: 'AgroPass', description: '' })

  return (
    <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 bg-transparent">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] md:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu size={18} />
        </button>
        <h1 className="truncate text-[15px] font-semibold text-[var(--color-ink)] leading-none">
          {meta.title}
        </h1>
        {meta.description && (
          <span className="hidden sm:block text-xs text-[var(--color-ink-subtle)]">
            {meta.description}
          </span>
        )}
      </div>
      {isDemoMode && (
        <div className="flex shrink-0 items-center gap-2">
          <DemoModeBadge className="hidden sm:inline-flex" />
          <DemoRoleSwitcher />
          <button
            type="button"
            // Demo mode is turned off by /demo itself: switching it off here
            // would let the auth guard redirect to /login before the
            // (transition-wrapped) navigation lands.
            onClick={() => navigate('/demo', { replace: true, state: { leaveDemo: true } })}
            aria-label="Sair da demo"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 text-xs font-medium text-[var(--color-ink-muted)] hover:border-[var(--color-amber-600)] hover:text-[var(--color-amber-700)]"
          >
            <LogOut size={14} aria-hidden />
            <span aria-hidden className="hidden sm:inline">Sair da demo</span>
          </button>
        </div>
      )}
      {user && !isDemoMode && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-[var(--color-ink)]">{user.name}</p>
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-subtle)]">
              {ROLE_TITLE[user.role]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-red-700)]"
            aria-label="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </header>
  )
}
