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
import { SidebarItem } from './SidebarItem'
import { cn } from '@/lib/utils'

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farms',     icon: Sprout,          label: 'Fazendas' },
  { to: '/batches',   icon: Package,         label: 'Lotes' },
] as const

const comingSoonNav = [
  { icon: ShieldCheck, label: 'Validações EUDR' },
  { icon: Link2,       label: 'Blockchain' },
] as const

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--color-border-soft)] shrink-0">
        <AppLogo />
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {mainNav.map((item) => (
          <SidebarItem key={item.to} {...item} />
        ))}

        {/* Separator */}
        <div className="my-2 border-t border-[var(--color-border-soft)]" />

        {comingSoonNav.map((item) => (
          <SidebarItem key={item.label} icon={item.icon} label={item.label} soon />
        ))}
      </nav>

      {/* Demo link */}
      <div className="p-3 border-t border-[var(--color-border-soft)] shrink-0">
        <NavLink
          to="/demo"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)]'
                : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-ink)]'
            )
          }
        >
          <Zap size={16} strokeWidth={2} className="shrink-0" />
          Página pública
        </NavLink>
      </div>
    </aside>
  )
}
