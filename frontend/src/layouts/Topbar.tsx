import { useLocation } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { DemoModeBadge } from '@/components/DemoModeBadge'
import { useDemoMode } from '@/contexts/demo'

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Dashboard',        description: 'Visão geral do sistema AgroPass' },
  '/farms':     { title: 'Fazendas',         description: 'Propriedades com validação EUDR' },
  '/batches':   { title: 'Lotes',            description: 'Colheitas com passaporte digital' },
}

export function Topbar() {
  const { pathname } = useLocation()
  const { isDemoMode, enableDemoMode } = useDemoMode()

  const meta = PAGE_META[pathname] ?? { title: 'AgroPass', description: '' }

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Page title */}
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-[15px] font-semibold text-[var(--color-ink)] leading-none">
          {meta.title}
        </h1>
        {meta.description && (
          <span className="hidden sm:block text-xs text-[var(--color-ink-subtle)]">
            {meta.description}
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {isDemoMode ? (
          <DemoModeBadge dismissible />
        ) : (
          <button
            onClick={enableDemoMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-amber-600)] hover:text-[var(--color-amber-700)] hover:bg-[var(--color-amber-50)] transition-colors cursor-pointer"
          >
            <Zap size={12} strokeWidth={2.5} />
            Entrar na demo
          </button>
        )}
      </div>
    </header>
  )
}
