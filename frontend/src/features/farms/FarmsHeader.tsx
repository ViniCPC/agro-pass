interface FarmsHeaderProps {
  farmCount: number
  filteredCount: number
}

export function FarmsHeader({ farmCount, filteredCount }: FarmsHeaderProps) {
  const showing = filteredCount < farmCount
    ? 'Mostrando ' + filteredCount + ' de ' + farmCount
    : farmCount + ' fazenda' + (farmCount !== 1 ? 's' : '')

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">Fazendas</h1>
      <p className="mt-0.5 text-sm text-[var(--color-ink-subtle)]">
        Propriedades vinculadas à origem dos lotes · {showing}
      </p>
    </div>
  )
}
