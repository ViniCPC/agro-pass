interface FarmLocationCellProps {
  city: string
  state: string
  latitude: number
  longitude: number
}

export function FarmLocationCell({ city, state, latitude, longitude }: FarmLocationCellProps) {
  return (
    <div>
      <p className="text-sm text-[var(--color-ink)]">{city}, {state}</p>
      <p className="text-[10px] text-[var(--color-ink-subtle)] font-mono tabular-nums">
        {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </p>
    </div>
  )
}
