interface FarmsHeaderProps {
  farmCount: number
  filteredCount: number
}

export function FarmsHeader({ farmCount, filteredCount }: FarmsHeaderProps) {
  const showing = filteredCount < farmCount
    ? `Mostrando ${filteredCount} de ${farmCount}`
    : `${farmCount} fazenda${farmCount !== 1 ? 's' : ''}`

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--color-ink)] tracking-tight">Fazendas</h1>
      <p className="text-sm text-[var(--color-ink-subtle)] mt-0.5">
        Propriedades monitoradas com validação EUDR e rastreabilidade ambiental · {showing}
      </p>
    </div>
  )
}
