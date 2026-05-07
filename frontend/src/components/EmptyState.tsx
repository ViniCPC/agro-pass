import { type LucideIcon, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = 'Nenhum dado encontrado',
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 px-6 text-center',
        'bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)]',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--color-slate-100)] flex items-center justify-center text-[var(--color-ink-subtle)]">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        {description && (
          <p className="text-sm text-[var(--color-ink-subtle)] mt-1 max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
