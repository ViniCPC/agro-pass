import { cn } from '@/lib/utils'

interface LoadingStateProps {
  rows?: number
  className?: string
}

export function LoadingState({ rows = 3, className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-6 space-y-3',
        className
      )}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-slate-100)] shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[var(--color-slate-100)] rounded-full w-1/3" />
            <div className="h-3 bg-[var(--color-border-soft)] rounded-full w-2/3" />
          </div>
          <div className="w-16 h-5 bg-[var(--color-slate-100)] rounded-[var(--radius-badge)]" />
        </div>
      ))}
    </div>
  )
}
