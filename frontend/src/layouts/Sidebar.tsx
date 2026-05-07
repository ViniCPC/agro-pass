import {
  LayoutDashboard,
  Sprout,
  Package,
  ShieldCheck,
  Link2,
  Zap,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { cn } from '@/lib/utils'
import { SidebarItem } from './SidebarItem'

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farms', icon: Sprout, label: 'Fazendas' },
  { to: '/batches', icon: Package, label: 'Lotes' },
] as const

const comingSoonNav = [
  { icon: ShieldCheck, label: 'Validacoes EUDR' },
  { icon: Link2, label: 'Blockchain' },
] as const

interface SidebarProps {
  onNavigate?: () => void
  mobile?: boolean
}

export function Sidebar({ onNavigate, mobile = false }: SidebarProps) {
  return (
    <aside className={`flex h-full ${mobile ? 'w-full' : 'w-56 shrink-0'} flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]`}>
      <div className="flex h-14 items-center border-b border-[var(--color-border-soft)] px-4">
        <AppLogo />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {mainNav.map((item) => (
          <SidebarItem key={item.to} {...item} onClick={onNavigate} />
        ))}

        <div className="my-2 border-t border-[var(--color-border-soft)]" />

        {comingSoonNav.map((item) => (
          <SidebarItem key={item.label} icon={item.icon} label={item.label} soon />
        ))}
      </nav>

      <div className="border-t border-[var(--color-border-soft)] p-3">
        <NavLink
          to="/demo"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)]'
                : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-ink)]',
            )
          }
        >
          <Zap size={16} strokeWidth={2} className="shrink-0" />
          Pagina publica
        </NavLink>
      </div>
    </aside>
  )
}
