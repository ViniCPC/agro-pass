interface BatchesHeaderProps {
  totalCount: number
  filteredCount: number
}

export function BatchesHeader({ totalCount, filteredCount }: BatchesHeaderProps) {
  const showing = filteredCount < totalCount
    ? `Mostrando ${filteredCount} de ${totalCount}`
    : `${totalCount} lote${totalCount !== 1 ? 's' : ''}`

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--color-ink)] tracking-tight">Lotes</h1>
      <p className="text-sm text-[var(--color-ink-subtle)] mt-0.5">
        Rastreie lotes agrícolas da colheita à exportação · {showing}
      </p>
    </div>
  )
}
