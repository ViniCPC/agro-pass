import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-[var(--color-red-600)]'

interface FormFieldProps {
  id: string
  label: string
  optional?: boolean
  hint?: ReactNode
  error?: string | null
  className?: string
  children: ReactNode
}

// Label, control, hint and error, with the ids the control should point at:
// aria-describedby={`${id}-hint ${id}-error`}.
export function FormField({ id, label, optional, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]"
      >
        {label}
        {optional && <span className="ml-1 font-normal normal-case tracking-normal">(opcional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-ink-subtle)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-[var(--color-red-700)]">
          {error}
        </p>
      )}
    </div>
  )
}

