import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Falha ao carregar',
  description = 'Não foi possível conectar ao servidor. Tente novamente.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
        'bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)]',
        className
      )}
    >
      <div className="w-11 h-11 rounded-xl bg-[var(--color-red-100)] flex items-center justify-center text-[var(--color-red-600)]">
        <AlertTriangle size={22} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        <p className="text-sm text-[var(--color-ink-subtle)] mt-1 max-w-xs">{description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 text-sm font-medium text-[var(--color-teal-600)] hover:underline cursor-pointer"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
