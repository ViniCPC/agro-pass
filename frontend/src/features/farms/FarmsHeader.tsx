import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FarmsHeaderProps {
  farmCount: number
  filteredCount: number
  canCreate: boolean
}

export function FarmsHeader({ farmCount, filteredCount, canCreate }: FarmsHeaderProps) {
  const showing = filteredCount < farmCount
    ? 'Mostrando ' + filteredCount + ' de ' + farmCount
    : farmCount + ' fazenda' + (farmCount !== 1 ? 's' : '')

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">Fazendas</h1>
        <p className="mt-0.5 text-sm text-[var(--color-ink-subtle)]">
          Propriedades vinculadas à origem dos lotes · {showing}
        </p>
      </div>
      {canCreate && (
        <Link
          to="/farms/new"
          className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-teal-700)] px-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-teal-600)]"
        >
          <Plus size={15} aria-hidden />
          Cadastrar propriedade
        </Link>
      )}
    </div>
  )
}
