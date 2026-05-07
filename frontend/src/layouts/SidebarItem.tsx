import { NavLink } from 'react-router-dom'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActiveItemProps {
  to: string
  icon: LucideIcon
  label: string
  onClick?: () => void
}

interface ComingSoonItemProps {
  icon: LucideIcon
  label: string
  soon?: true
}

type SidebarItemProps = ActiveItemProps | ComingSoonItemProps

function isComingSoon(props: SidebarItemProps): props is ComingSoonItemProps {
  return !('to' in props)
}

export function SidebarItem(props: SidebarItemProps) {
  const { icon: Icon, label } = props

  if (isComingSoon(props)) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
          'text-[var(--color-ink-subtle)] cursor-not-allowed select-none'
        )}
      >
        <Icon size={16} strokeWidth={2} className="shrink-0" />
        <span className="flex-1">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-border-soft)] text-[var(--color-ink-subtle)]">
          Em breve
        </span>
      </div>
    )
  }

  return (
    <NavLink
      to={props.to}
      onClick={props.onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)]'
            : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-ink)]'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={16}
            strokeWidth={2}
            className={cn('shrink-0', isActive ? 'text-[var(--color-teal-600)]' : '')}
          />
          {label}
        </>
      )}
    </NavLink>
  )
}
