import { useState } from 'react'
import { Search } from 'lucide-react'

interface TraceSearchProps {
  initialCode: string | null
  onSearch: (code: string) => void
  isLoading?: boolean
}

export function TraceSearch({ initialCode, onSearch, isLoading }: TraceSearchProps) {
  const [value, setValue] = useState(initialCode ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSearch(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
          strokeWidth={2}
        />
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Código do lote, ex: AGP-2025-001"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-teal-600)] focus:ring-2 focus:ring-[var(--color-teal-100)] transition-all placeholder:text-[var(--color-ink-subtle)] text-[var(--color-ink)]"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="px-4 py-2.5 bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
      >
        {isLoading ? 'Buscando…' : 'Rastrear'}
      </button>
    </form>
  )
}
