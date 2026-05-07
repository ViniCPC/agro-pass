import { StatusBadge } from '@/components/StatusBadge'
import type { ValidationStatus } from '@/types/api'

interface FarmValidationCellProps {
  status: ValidationStatus | null | undefined
  validatedAt: string | null | undefined
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function FarmValidationCell({ status, validatedAt }: FarmValidationCellProps) {
  if (!status) {
    return <span className="text-xs text-[var(--color-ink-subtle)]">—</span>
  }

  return (
    <div className="space-y-0.5">
      <StatusBadge status={status} />
      {validatedAt && (
        <p className="text-[10px] text-[var(--color-ink-subtle)]">{formatDate(validatedAt)}</p>
      )}
    </div>
  )
}
