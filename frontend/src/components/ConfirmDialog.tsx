import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  pending?: boolean
  confirmDisabled?: boolean
  tone?: 'primary' | 'danger'
  error?: string | null
}

// A small modal for actions that cannot be undone. Escape or the backdrop
// closes it while nothing is being saved.
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
  pending = false,
  confirmDisabled = false,
  tone = 'primary',
  error,
}: ConfirmDialogProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('textarea, input, select, button:not([data-close])')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [open, pending, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose()
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-t-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)] sm:rounded-[16px]"
      >
        <h2 id={titleId} className="text-lg font-semibold text-[var(--color-ink)]">
          {title}
        </h2>
        <div className="mt-3 space-y-3 text-sm text-[var(--color-ink-muted)]">{children}</div>

        {error && (
          <p role="alert" className="mt-4 rounded-md bg-[var(--color-red-50)] px-3 py-2 text-sm text-[var(--color-red-700)]">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            data-close
            onClick={onClose}
            disabled={pending}
            className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-ink-subtle)] disabled:opacity-60"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || confirmDisabled}
            className={cn(
              'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60',
              tone === 'danger'
                ? 'bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)]'
                : 'bg-[var(--color-teal-700)] hover:bg-[var(--color-teal-600)]',
            )}
          >
            {pending && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
