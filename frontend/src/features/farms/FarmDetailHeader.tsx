import { ArrowLeft, Building2, MapPin, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Farm } from '@/types/api'

export function FarmDetailHeader({ farm }: { farm: Farm }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-start gap-3">
      <button
        onClick={() => navigate('/farms')}
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] shadow-sm transition-colors hover:bg-[var(--color-page)] hover:text-[var(--color-ink)]"
        aria-label="Voltar para fazendas"
      >
        <ArrowLeft size={15} />
      </button>

      <div className="space-y-2">
        <h1 className="text-xl font-bold leading-tight text-[var(--color-ink)]">{farm.name}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-ink-muted)]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} />
            {farm.city}, {farm.state}
          </span>
          {farm.producerName && (
            <span className="inline-flex items-center gap-1">
              <User size={13} />
              {farm.producerName}
            </span>
          )}
          {farm.cooperativeName && (
            <span className="inline-flex items-center gap-1">
              <Building2 size={13} />
              {farm.cooperativeName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
