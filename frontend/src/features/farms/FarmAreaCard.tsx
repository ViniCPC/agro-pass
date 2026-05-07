import { BarChart3, TrendingUp } from 'lucide-react'
import type { Biome, Farm } from '@/types/api'

function fmt(ha: number | null): string {
  if (ha == null) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(ha) + ' ha'
}

function pct(part: number | null, total: number | null): string {
  if (!part || !total) return '—'
  return ((part / total) * 100).toFixed(1) + '%'
}

function pctNum(part: number | null, total: number | null): number {
  if (!part || !total || total === 0) return 0
  return Math.min(100, (part / total) * 100)
}

const REQUIRED_RL: Record<Biome, number> = {
  AMAZON: 80,
  CERRADO: 20,
  ATLANTIC_FOREST: 20,
  CAATINGA: 20,
  PAMPA: 20,
  PANTANAL: 20,
}

function computeSurplus(farm: Farm): number | null {
  if (!farm.totalAreaHa || !farm.legalReserveAreaHa || !farm.biome) return null
  const required = (REQUIRED_RL[farm.biome] / 100) * farm.totalAreaHa
  const surplus = farm.legalReserveAreaHa - required
  return surplus > 0 ? surplus : null
}

interface AreaRowProps {
  label: string
  value: string
  sub?: string
  accent?: string
}

function AreaRow({ label, value, sub, accent }: AreaRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border-soft)] last:border-0">
      <div className="flex items-center gap-2">
        {accent && <span className={`h-2.5 w-2.5 rounded-sm shrink-0 ${accent}`} />}
        <span className="text-xs font-medium text-[var(--color-ink-muted)]">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-[var(--color-ink)]">{value}</span>
        {sub && <span className="ml-1.5 text-xs text-[var(--color-ink-subtle)]">({sub})</span>}
      </div>
    </div>
  )
}

interface FarmAreaCardProps {
  farm: Farm
}

export function FarmAreaCard({ farm }: FarmAreaCardProps) {
  const rlPct   = pctNum(farm.legalReserveAreaHa, farm.totalAreaHa)
  const appPct  = pctNum(farm.appAreaHa, farm.totalAreaHa)
  const consPct = pctNum(farm.consolidatedAreaHa, farm.totalAreaHa)
  const otherPct = Math.max(0, 100 - rlPct - appPct - consPct)
  const surplus = computeSurplus(farm)

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-teal-100,#ccfbf1)] text-[var(--color-teal-700,#0f766e)]">
          <BarChart3 size={16} />
        </div>
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Area & Legal Reserve</h2>
      </div>

      {/* Stacked bar */}
      {farm.totalAreaHa && (
        <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-[var(--color-border-soft)]">
          <div className="flex h-full w-full">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${rlPct}%` }} title={`Legal Reserve: ${rlPct.toFixed(1)}%`} />
            <div className="h-full bg-teal-400 transition-all"  style={{ width: `${appPct}%` }} title={`APP: ${appPct.toFixed(1)}%`} />
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${consPct}%` }} title={`Consolidated: ${consPct.toFixed(1)}%`} />
            <div className="h-full bg-[var(--color-border-soft)] transition-all" style={{ width: `${otherPct}%` }} />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-ink-subtle)]">
          <span className="h-2 w-2 rounded-sm bg-green-500" /> Legal Reserve
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-ink-subtle)]">
          <span className="h-2 w-2 rounded-sm bg-teal-400" /> APP
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-ink-subtle)]">
          <span className="h-2 w-2 rounded-sm bg-amber-400" /> Consolidated Use
        </span>
      </div>

      <div className="divide-y divide-[var(--color-border-soft)]">
        <AreaRow
          label="Total Area"
          value={fmt(farm.totalAreaHa)}
          accent="bg-[var(--color-border)]"
        />
        <AreaRow
          label="Legal Reserve (RL)"
          value={fmt(farm.legalReserveAreaHa)}
          sub={pct(farm.legalReserveAreaHa, farm.totalAreaHa)}
          accent="bg-green-500"
        />
        <AreaRow
          label="APP"
          value={fmt(farm.appAreaHa)}
          sub={pct(farm.appAreaHa, farm.totalAreaHa)}
          accent="bg-teal-400"
        />
        <AreaRow
          label="Consolidated Use"
          value={fmt(farm.consolidatedAreaHa)}
          sub={pct(farm.consolidatedAreaHa, farm.totalAreaHa)}
          accent="bg-amber-400"
        />

        {surplus !== null && (
          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
              <TrendingUp size={13} />
              Preservation Surplus
            </span>
            <span className="text-sm font-semibold text-green-700">+{fmt(surplus)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
