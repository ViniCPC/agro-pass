import { Link } from 'react-router-dom'

interface BatchesHeaderProps {
  totalCount: number
  filteredCount: number
}

export function BatchesHeader({ totalCount, filteredCount }: BatchesHeaderProps) {
  const showing = filteredCount < totalCount
    ? `Mostrando ${filteredCount} de ${totalCount}`
    : `${totalCount} lote${totalCount !== 1 ? 's' : ''}`

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          Lotes
        </h1>
        <p className="mt-0.5 text-sm text-[var(--color-ink-subtle)]">
          Rastreie lotes agricolas da colheita a exportacao - {showing}
        </p>
      </div>

      <Link
        to="/batches/new"
        className="inline-flex items-center rounded-lg bg-[var(--color-teal-700)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-teal-600)]"
      >
        Novo lote
      </Link>
    </div>
  )
}
