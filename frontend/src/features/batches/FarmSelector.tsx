import type { Farm } from '@/types/api'
import { cn } from '@/lib/utils'

interface FarmSelectorProps {
  farms: Farm[]
  value: string
  onChange: (farmId: string) => void
  disabled?: boolean
  error?: string | null
}

export function FarmSelector({
  farms,
  value,
  onChange,
  disabled,
  error,
}: FarmSelectorProps) {
  const sortedFarms = [...farms].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Fazenda de origem
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors',
          error
            ? 'border-[var(--color-red-600)]'
            : 'border-[var(--color-border)] focus:border-[var(--color-teal-600)]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <option value="">Selecione uma fazenda</option>
        {sortedFarms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name} — {farm.city}/{farm.state}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--color-red-700)]">{error}</p>}
    </div>
  )
}
