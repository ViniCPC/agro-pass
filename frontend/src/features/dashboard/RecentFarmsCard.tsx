import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionHeader } from '@/components/SectionHeader'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import { useFarms } from '@/hooks/useFarms'
import type { Farm } from '@/types/api'

function FarmRow({ farm }: { farm: Farm }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-ink)]">{farm.name}</p>
        <p className="text-xs text-[var(--color-ink-subtle)]">{farm.city}, {farm.state}</p>
      </div>
    </div>
  )
}

export function RecentFarmsCard() {
  const navigate = useNavigate()
  const { data, isLoading } = useFarms()
  const farms = (data?.data ?? []).slice(0, 5)

  return (
    <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <SectionHeader
        title="Fazendas recentes"
        action={
          <button
            onClick={() => navigate('/farms')}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-[var(--color-teal-600)] hover:underline"
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
        <div>{farms.map((farm) => <FarmRow key={farm.id} farm={farm} />)}</div>
      )}
    </div>
  )
}
