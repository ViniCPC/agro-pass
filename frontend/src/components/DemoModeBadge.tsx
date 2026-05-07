import { Zap, X } from 'lucide-react'
import { useDemoMode } from '@/contexts/demo'
import { cn } from '@/lib/utils'

interface DemoModeBadgeProps {
  dismissible?: boolean
  className?: string
}

export function DemoModeBadge({ dismissible = false, className }: DemoModeBadgeProps) {
  const { disableDemoMode } = useDemoMode()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
        'text-xs font-semibold',
        className
      )}
    >
      <Zap size={12} strokeWidth={2.5} className="shrink-0" />
      Demo mode ativo
      {dismissible && (
        <button
          onClick={disableDemoMode}
          aria-label="Sair do modo demo"
          className="ml-0.5 rounded-full hover:bg-[var(--color-amber-600)] hover:text-white transition-colors p-0.5 cursor-pointer"
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}
    </span>
  )
}
