import { StatusBadge } from '@/components/StatusBadge'
import { FarmValidationCell } from './FarmValidationCell'
import type { Farm } from '@/types/api'

const BIOME_LABEL: Record<string, string> = {
  AMAZON: 'Amazônia', CERRADO: 'Cerrado', ATLANTIC_FOREST: 'Mata Atlântica',
  CAATINGA: 'Caatinga', PAMPA: 'Pampa', PANTANAL: 'Pantanal',
}

function formatHa(ha: number | null) {
  if (!ha) return null
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(ha) + ' ha'
}

interface FarmCardProps {
  farm: Farm
}

export function FarmCard({ farm }: FarmCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">{farm.name}</p>
          <p className="text-xs text-[var(--color-ink-subtle)]">{farm.city}, {farm.state}</p>
        </div>
        <StatusBadge status={farm.status} className="shrink-0" />
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-ink-muted)]">
        {farm.biome && (
          <span>{BIOME_LABEL[farm.biome] ?? farm.biome}</span>
        )}
        {formatHa(farm.totalAreaHa) && (
          <span>· {formatHa(farm.totalAreaHa)}</span>
        )}
        {farm.isAmazonLegal && (
          <span className="text-green-700 font-medium">· Amazônia Legal</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-soft)]">
        <span className="text-[10px] text-[var(--color-ink-subtle)] uppercase tracking-wide font-semibold">EUDR</span>
        <FarmValidationCell
          status={farm.lastValidationStatus}
          validatedAt={farm.lastValidatedAt}
        />
      </div>

      {farm.carNumber && (
        <p className="font-mono text-[10px] text-[var(--color-ink-subtle)] truncate">
          CAR: {farm.carNumber}
        </p>
      )}
    </div>
  )
}
