import { Satellite, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EudrValidation } from '@/types/api'

function NdviPill({ value, label }: { value: number | null; label: string }) {
  if (value == null) return null
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-[var(--color-ink-subtle)] uppercase tracking-wide">{label}</span>
      <span className="rounded bg-[var(--color-border-soft)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--color-ink)]">
        {value.toFixed(2)}
      </span>
    </div>
  )
}

function ImageSlot({ url, label, sublabel }: { url: string | null; label: string; sublabel: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
      <div className="relative aspect-video bg-[var(--color-border-soft)] flex items-center justify-center">
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--color-ink-subtle)]">
            <Satellite size={28} className="opacity-40" />
            <p className="text-xs">Satellite imagery not available</p>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <p className="text-xs font-semibold text-white">{label}</p>
          <p className="text-[10px] text-white/70">{sublabel}</p>
        </div>
      </div>
    </div>
  )
}

interface FarmSatelliteComparisonProps {
  validation: EudrValidation | null
}

export function FarmSatelliteComparison({ validation }: FarmSatelliteComparisonProps) {
  if (!validation) return null

  const ndviDelta =
    validation.ndviBefore != null && validation.ndviAfter != null
      ? validation.ndviAfter - validation.ndviBefore
      : null

  const deltaPositive = ndviDelta !== null && ndviDelta >= 0

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <Satellite size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Sentinel-2 Comparison</h2>
            <p className="text-[11px] text-[var(--color-ink-subtle)]">Vegetation cover before and after cut-off date</p>
          </div>
        </div>

        {ndviDelta !== null && (
          <div className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
            deltaPositive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700',
          )}>
            {deltaPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            NDVI {ndviDelta >= 0 ? '+' : ''}{ndviDelta.toFixed(2)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ImageSlot
          url={validation.satelliteImageBeforeUrl}
          label="Pre cut-off · Dec 2020"
          sublabel="Baseline vegetation coverage"
        />
        <ImageSlot
          url={validation.satelliteImageAfterUrl}
          label="Current"
          sublabel="Latest available imagery"
        />
      </div>

      {(validation.ndviBefore != null || validation.ndviAfter != null) && (
        <div className="mt-3 flex items-center justify-center gap-6 rounded-lg bg-[var(--color-page)] border border-[var(--color-border-soft)] py-3">
          <NdviPill value={validation.ndviBefore} label="NDVI Before" />
          <div className="h-6 w-px bg-[var(--color-border-soft)]" />
          <NdviPill value={validation.ndviAfter}  label="NDVI After" />
          {ndviDelta !== null && (
            <>
              <div className="h-6 w-px bg-[var(--color-border-soft)]" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-[var(--color-ink-subtle)] uppercase tracking-wide">Delta</span>
                <span className={cn(
                  'font-mono text-xs font-bold',
                  deltaPositive ? 'text-green-600' : 'text-red-600',
                )}>
                  {ndviDelta >= 0 ? '+' : ''}{ndviDelta.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
