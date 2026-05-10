import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'
import type { Farm } from '@/types/api'

interface FarmSelectorWithStatusProps {
  farms: Farm[]
  value: string
  onChange: (farmId: string) => void
  disabled?: boolean
  error?: string | null
}

function isCompliantFarm(farm: Farm) {
  return farm.lastValidationStatus === 'COMPLIANT'
}

export function FarmSelectorWithStatus({
  farms,
  value,
  onChange,
  disabled,
  error,
}: FarmSelectorWithStatusProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const sortedFarms = useMemo(
    () => [...farms].sort((a, b) => a.name.localeCompare(b.name)),
    [farms],
  )
  const selectedFarm = sortedFarms.find((farm) => farm.id === value) ?? null

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Fazenda
      </label>

      <div ref={rootRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border bg-[var(--color-surface)] px-3 py-2.5 text-left text-sm transition-colors',
            error
              ? 'border-[var(--color-red-600)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-teal-600)]',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <div className="min-w-0">
            {selectedFarm ? (
              <div className="space-y-1">
                <p className="truncate font-medium text-[var(--color-ink)]">
                  {selectedFarm.name} - {selectedFarm.state}
                </p>
                <StatusBadge
                  status={selectedFarm.lastValidationStatus ?? 'PENDING'}
                />
              </div>
            ) : (
              <p className="text-[var(--color-ink-subtle)]">Selecione uma fazenda</p>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn(
              'shrink-0 text-[var(--color-ink-subtle)] transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-card-hover)]">
            {sortedFarms.length === 0 ? (
              <p className="px-2 py-2 text-sm text-[var(--color-ink-subtle)]">
                Nenhuma fazenda encontrada.
              </p>
            ) : (
              sortedFarms.map((farm) => {
                const compliant = isCompliantFarm(farm)

                return (
                  <button
                    key={farm.id}
                    type="button"
                    disabled={!compliant}
                    title={
                      compliant ? undefined : 'Execute a validação EUDR primeiro'
                    }
                    onClick={() => {
                      onChange(farm.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'mb-1 flex w-full items-start justify-between rounded-md px-2.5 py-2 text-left transition-colors last:mb-0',
                      compliant
                        ? 'cursor-pointer hover:bg-[var(--color-page)]'
                        : 'cursor-not-allowed bg-[var(--color-slate-50)] opacity-70',
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-ink)]">
                        {farm.name} - {farm.state}
                      </p>
                      <p className="text-xs text-[var(--color-ink-subtle)]">
                        {farm.city}
                      </p>
                      {!compliant && (
                        <p className="mt-1 text-[11px] text-[var(--color-amber-700)]">
                          Execute a validação EUDR primeiro
                        </p>
                      )}
                    </div>
                    <StatusBadge status={farm.lastValidationStatus ?? 'PENDING'} />
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-[var(--color-red-700)]">{error}</p>}
    </div>
  )
}
