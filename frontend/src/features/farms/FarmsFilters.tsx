import type { Farm } from '@/types/api'
import { DEFAULT_FILTERS, type FarmFilters } from './farm-filters'

const SELECT_CLASS = [
  'text-sm bg-[var(--color-surface)] border border-[var(--color-border)]',
  'rounded-lg px-3 py-1.5 text-[var(--color-ink-muted)]',
  'outline-none focus:border-[var(--color-teal-600)] cursor-pointer',
].join(' ')

interface FarmsFiltersProps {
  filters: FarmFilters
  onChange: (filters: FarmFilters) => void
  farms: Farm[]
}

export function FarmsFilters({ filters, onChange, farms }: FarmsFiltersProps) {
  const states = Array.from(new Set(farms.map((farm) => farm.state))).sort()
  const hasActive = Object.values(filters).some((value) => value !== '')

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={SELECT_CLASS}
        value={filters.state}
        onChange={(event) => onChange({ ...filters, state: event.target.value })}
      >
        <option value="">Todos os estados</option>
        {states.map((state) => <option key={state} value={state}>{state}</option>)}
      </select>

      {hasActive && (
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="cursor-pointer text-xs text-[var(--color-ink-subtle)] underline hover:text-[var(--color-ink)]"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
