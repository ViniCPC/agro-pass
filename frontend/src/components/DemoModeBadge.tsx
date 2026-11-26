import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemoModeBadgeProps {
  className?: string
  title?: string
}

export function DemoModeBadge({ className, title }: DemoModeBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
        'text-xs font-semibold',
        className
      )}
    >
      <Zap size={12} strokeWidth={2.5} className="shrink-0" />
      <span className="sm:hidden">Demo</span>
      <span className="hidden sm:inline">Modo demonstração</span>
    </span>
  )
}
