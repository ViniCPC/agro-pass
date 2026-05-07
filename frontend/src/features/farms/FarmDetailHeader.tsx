import { ArrowLeft, Building2, MapPin, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import type { Farm } from '@/types/api'
import { RunEudrValidationButton } from './RunEudrValidationButton'

interface FarmDetailHeaderProps {
  farm: Farm
}

export function FarmDetailHeader({ farm }: FarmDetailHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/farms')}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] shadow-sm transition-colors hover:bg-[var(--color-page)] hover:text-[var(--color-ink)]"
          aria-label="Back to farms"
        >
          <ArrowLeft size={15} />
        </button>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold leading-tight text-[var(--color-ink)]">
            {farm.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-ink-muted)]">
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} className="shrink-0" />
              {farm.city}, {farm.state}
            </span>

            {farm.producerName && (
              <span className="inline-flex items-center gap-1">
                <User size={13} className="shrink-0" />
                {farm.producerName}
              </span>
            )}

            {farm.cooperativeName && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={13} className="shrink-0" />
                {farm.cooperativeName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            {farm.lastValidationStatus ? (
              <StatusBadge status={farm.lastValidationStatus} />
            ) : (
              <StatusBadge status="PENDING" label="No EUDR Validation" />
            )}
            <StatusBadge status={farm.status} />
          </div>
        </div>
      </div>

      <RunEudrValidationButton farmId={farm.id} className="hidden sm:flex sm:shrink-0" />
    </div>
  )
}
