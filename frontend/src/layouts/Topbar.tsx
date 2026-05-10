import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/dashboard':   { title: 'Dashboard',  description: 'Visão geral do sistema AgroPass' },
  '/farms':       { title: 'Fazendas',   description: 'Propriedades com validação EUDR' },
  '/batches':     { title: 'Lotes',      description: 'Colheitas com passaporte digital' },
  '/batches/new': { title: 'Novo lote',  description: 'Cadastro de lote para fazenda compliant' },
}

interface TopbarProps {
  onOpenMenu?: () => void
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { pathname } = useLocation()

  const meta =
    PAGE_META[pathname] ??
    (pathname.startsWith('/batches/')
      ? { title: 'Lote', description: 'Detalhe interno com rastreabilidade e QR do lote' }
      : { title: 'AgroPass', description: '' })

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] sm:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-[15px] font-semibold text-[var(--color-ink)] leading-none">
          {meta.title}
        </h1>
        {meta.description && (
          <span className="hidden sm:block text-xs text-[var(--color-ink-subtle)]">
            {meta.description}
          </span>
        )}
      </div>
    </header>
  )
}
