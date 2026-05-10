import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState'
import { SectionHeader } from '@/components/SectionHeader'
import { useFarms } from '@/hooks/useFarms'
import { cn } from '@/lib/utils'

interface Row {
  label: string
  count: number
  color: string
  bg: string
}

function Bar({
  count,
  total,
  color,
}: {
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-border-soft)]">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-[var(--color-ink-subtle)]">
        {pct}%
      </span>
    </div>
  )
}

export function ComplianceOverview() {
  const { data, isLoading } = useFarms()
  const farms = data?.data ?? []
  const total = farms.length

  const compliant = farms.filter(
    (farm) => farm.lastValidationStatus === 'COMPLIANT',
  ).length
  const needsReview = farms.filter(
    (farm) => farm.lastValidationStatus === 'NEEDS_REVIEW',
  ).length
  const nonCompliant = farms.filter(
    (farm) => farm.lastValidationStatus === 'NON_COMPLIANT',
  ).length
  const noData = total - compliant - needsReview - nonCompliant

  const rows: Row[] = [
    {
      label: 'Conforme',
      count: compliant,
      color: 'bg-[var(--color-green-600)]',
      bg: 'bg-[var(--color-green-100)] text-[var(--color-green-700)]',
    },
    {
      label: 'Revisão',
      count: needsReview,
      color: 'bg-[var(--color-amber-600)]',
      bg: 'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
    },
    {
      label: 'Risco',
      count: nonCompliant,
      color: 'bg-[var(--color-red-600)]',
      bg: 'bg-[var(--color-red-100)] text-[var(--color-red-700)]',
    },
    {
      label: 'Pendente',
      count: noData,
      color: 'bg-[var(--color-slate-400)]',
      bg: 'bg-[var(--color-slate-100)] text-[var(--color-slate-600)]',
    },
  ]

  const riskCount = nonCompliant + needsReview
  const riskToneClass =
    nonCompliant > 0
      ? 'border-[var(--color-red-100)] from-[var(--color-red-50)]'
      : needsReview > 0
        ? 'border-[var(--color-amber-100)] from-[var(--color-amber-50)]'
        : 'border-[var(--color-green-100)] from-[var(--color-green-50)]'

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border bg-gradient-to-br to-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)]',
        riskToneClass,
      )}
    >
      <SectionHeader
        title="Conformidade ambiental"
        description={
          isLoading
            ? ''
            : `${compliant}/${total} conformes • ${riskCount} requerem atenção`
        }
        action={
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-muted)]">
            {riskCount > 0 ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
            {riskCount > 0 ? `${riskCount} sinalizadas` : 'Tudo OK'}
          </span>
        }
      />

      <div className="mt-4">
        {isLoading ? (
          <LoadingState rows={4} />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      row.bg,
                    )}
                  >
                    {row.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                    {row.count}
                  </span>
                </div>
                <Bar count={row.count} total={total} color={row.color} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
