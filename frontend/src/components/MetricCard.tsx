import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  accent?: 'green' | 'amber' | 'red' | 'teal' | 'default'
  emphasis?: 'primary' | 'secondary'
  className?: string
}

const accentMap = {
  green: {
    icon: 'bg-[var(--color-green-100)] text-[var(--color-green-700)]',
    ring: 'border-[var(--color-green-100)]',
  },
  amber: {
    icon: 'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
    ring: 'border-[var(--color-amber-100)]',
  },
  red: {
    icon: 'bg-[var(--color-red-100)] text-[var(--color-red-700)]',
    ring: 'border-[var(--color-red-100)]',
  },
  teal: {
    icon: 'bg-[var(--color-teal-100)] text-[var(--color-teal-700)]',
    ring: 'border-[var(--color-teal-100)]',
  },
  default: {
    icon: 'bg-[var(--color-slate-100)] text-[var(--color-slate-600)]',
    ring: 'border-[var(--color-border)]',
  },
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent = 'default',
  emphasis = 'secondary',
  className,
}: MetricCardProps) {
  const colors = accentMap[accent]
  const isPrimary = emphasis === 'primary'

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border bg-[var(--color-surface)]',
        isPrimary
          ? `p-5 shadow-[var(--shadow-card-hover)] ${colors.ring}`
          : 'p-4 shadow-[var(--shadow-card)] border-[var(--color-border)]',
        'flex flex-col gap-3 transition-all',
        className
      )}
    >
      {Icon && (
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colors.icon)}>
          <Icon size={18} strokeWidth={2} />
        </div>
      )}
      <div>
        <p className={cn('font-semibold text-[var(--color-ink)] leading-none', isPrimary ? 'text-[30px]' : 'text-2xl')}>
          {value}
        </p>
        <p className="text-xs text-[var(--color-ink-subtle)] mt-1 font-medium uppercase tracking-wide">{label}</p>
      </div>
    </div>
  )
}
