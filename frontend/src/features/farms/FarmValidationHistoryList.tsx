import { History } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { EudrValidation } from '@/types/api'

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function shortHash(hash: string | null): string {
  if (!hash) return '—'
  return hash.length > 16 ? hash.slice(0, 8) + '…' + hash.slice(-6) : hash
}

interface FarmValidationHistoryListProps {
  items: EudrValidation[]
}

export function FarmValidationHistoryList({ items }: FarmValidationHistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <History size={16} className="text-[var(--color-ink-subtle)]" />
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">Validation History</h2>
        </div>
        <p className="text-xs text-[var(--color-ink-subtle)]">No validations recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-slate-100)] text-[var(--color-slate-600)]">
          <History size={16} />
        </div>
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Validation History</h2>
        <span className="ml-auto rounded-full bg-[var(--color-border-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-muted)]">
          {items.length}
        </span>
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-5">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[var(--color-border-soft)]" />

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={item.id} className="relative">
              {/* Timeline dot */}
              <div className={[
                'absolute -left-5 top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--color-surface)]',
                item.status === 'COMPLIANT'     ? 'bg-green-500' :
                item.status === 'NON_COMPLIANT' ? 'bg-red-500'   :
                item.status === 'NEEDS_REVIEW'  ? 'bg-amber-500' : 'bg-slate-300',
              ].join(' ')} />

              <div className={[
                'rounded-lg border bg-[var(--color-page)] px-3 py-2.5',
                idx === 0 ? 'border-[var(--color-border)]' : 'border-[var(--color-border-soft)]',
              ].join(' ')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    {idx === 0 && (
                      <span className="rounded bg-[var(--color-teal-100,#ccfbf1)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-teal-700,#0f766e)]">
                        Latest
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-ink-subtle)]">{fmt(item.validatedAt)}</span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-[var(--color-ink-muted)]">
                  <span>
                    Deforested:{' '}
                    <strong className={item.hectaresDeforested === 0 ? 'text-green-600' : 'text-[var(--color-ink)]'}>
                      {item.hectaresDeforested?.toFixed(2) ?? '—'} ha
                    </strong>
                  </span>
                  {item.evidenceHash && (
                    <span className="font-mono">
                      {shortHash(item.evidenceHash)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
