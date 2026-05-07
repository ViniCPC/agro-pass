import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionHeader } from '@/components/SectionHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import { useFarms } from '@/hooks/useFarms'
import type { Farm } from '@/types/api'

const BIOME_LABEL: Record<string, string> = {
  AMAZON:          'Amazônia',
  CERRADO:         'Cerrado',
  ATLANTIC_FOREST: 'Mata Atlântica',
  CAATINGA:        'Caatinga',
  PAMPA:           'Pampa',
  PANTANAL:        'Pantanal',
}

function FarmRow({ farm }: { farm: Farm }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border-soft)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-ink)] truncate">{farm.name}</p>
        <p className="text-xs text-[var(--color-ink-subtle)]">
          {farm.city}, {farm.state}
          {farm.biome ? ` · ${BIOME_LABEL[farm.biome] ?? farm.biome}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {farm.lastValidationStatus ? (
          <StatusBadge status={farm.lastValidationStatus} />
        ) : (
          <StatusBadge status="PENDING" label="Sem EUDR" />
        )}
        <StatusBadge status={farm.status} />
      </div>
    </div>
  )
}

export function RecentFarmsCard() {
  const navigate = useNavigate()
  const { data, isLoading } = useFarms()
  const farms = (data?.data ?? []).slice(0, 5)

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] space-y-3">
      <SectionHeader
        title="Fazendas recentes"
        action={
          <button
            onClick={() => navigate('/farms')}
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-teal-600)] hover:underline cursor-pointer"
          >
            Ver todas <ArrowRight size={12} />
          </button>
        }
      />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : farms.length === 0 ? (
        <EmptyState title="Nenhuma fazenda cadastrada" />
      ) : (
        <div>
          {farms.map(farm => <FarmRow key={farm.id} farm={farm} />)}
        </div>
      )}
    </div>
  )
}
