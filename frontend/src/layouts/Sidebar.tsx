import {
  LayoutDashboard,
  Sprout,
  Package,
  ScanLine,
  Zap,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { HomeLogoLink } from '@/components/HomeLogoLink'
import { cn } from '@/lib/utils'
import { DEMO_SHOWCASE_CODE } from '@/mocks/demo-store'
import { SidebarItem } from './SidebarItem'

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farms', icon: Sprout, label: 'Fazendas' },
  { to: '/batches', icon: Package, label: 'Lotes' },
] as const

// The bundled example passport opens without login or API.
const secondaryNav = [
  { to: `/trace/${DEMO_SHOWCASE_CODE}`, icon: ScanLine, label: 'Passaporte de exemplo' },
] as const

interface SidebarProps {
  onNavigate?: () => void
  mobile?: boolean
}

// On desktop the sidebar floats over the page as a translucent panel; in the
// mobile drawer it fills the (already translucent) drawer.
const FLOATING =
  'm-3 mr-0 w-56 shrink-0 rounded-2xl border border-white/70 bg-white/55 shadow-[0_18px_40px_-22px_rgba(15,40,30,0.45)] backdrop-blur-xl backdrop-saturate-150'

export function Sidebar({ onNavigate, mobile = false }: SidebarProps) {
  return (
    <aside className={cn('flex flex-col', mobile ? 'min-h-0 w-full flex-1' : FLOATING)}>
      <div className="flex h-14 items-center border-b border-black/5 px-4">
        <HomeLogoLink onClick={onNavigate} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {mainNav.map((item) => (
          <SidebarItem key={item.to} {...item} onClick={onNavigate} />
        ))}

        <div className="my-2 border-t border-black/5" />

        {secondaryNav.map((item) => (
          <SidebarItem key={item.to} {...item} onClick={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-black/5 p-3">
        <NavLink
          to="/demo"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)]'
                : 'text-[var(--color-ink-muted)] hover:bg-white/70 hover:text-[var(--color-ink)]',
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
