import { useState } from 'react'
import { CalendarClock, Check, Copy, ShieldCheck } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { PublicBatch } from '@/types/api'
import { formatDate, shortHash } from './trace.utils'

interface TraceComplianceCardProps {
  data: PublicBatch
}

function ComplianceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-teal-700)]/70">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink)]">{value}</p>
    </div>
  )
}

export function TraceComplianceCard({ data }: TraceComplianceCardProps) {
  const [isHashCopied, setIsHashCopied] = useState(false)
  const validation = data.farm.lastValidation
  const complianceTone =
    validation?.status === 'COMPLIANT'
      ? 'border-[var(--color-green-100)] from-[var(--color-green-50)]'
      : validation?.status === 'NEEDS_REVIEW'
        ? 'border-[var(--color-amber-100)] from-[var(--color-amber-50)]'
        : validation?.status === 'NON_COMPLIANT'
          ? 'border-[var(--color-red-100)] from-[var(--color-red-50)]'
          : 'border-[var(--color-slate-100)] from-[var(--color-slate-50)]'

  async function handleCopyEvidenceHash() {
    if (!validation?.evidenceHash) return
    try {
      await navigator.clipboard.writeText(validation.evidenceHash)
      setIsHashCopied(true)
      window.setTimeout(() => setIsHashCopied(false), 1600)
    } catch {
      setIsHashCopied(false)
    }
  }

  return (
    <section
      className={`rounded-[var(--radius-card)] border bg-gradient-to-br via-[var(--color-surface)] to-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)] ${complianceTone}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--color-teal-700)]" />
          <h2 className="text-base font-semibold text-[var(--color-ink)]">Conformidade ambiental</h2>
        </div>
        <StatusBadge status={validation?.status ?? 'PENDING'} />
      </div>

      {!validation ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          A validação ambiental ainda não está disponível para esta fazenda.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-ink-muted)]">
            <CalendarClock size={12} />
            Última verificação {formatDate(validation.validatedAt)}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ComplianceField label="Status EUDR" value={validation.status} />
            <ComplianceField label="Validado em" value={formatDate(validation.validatedAt)} />
            <ComplianceField label="Válido até" value={formatDate(validation.validUntil)} />
            <ComplianceField
              label="Hectares desmatados"
              value={validation.hectaresDeforested == null ? '-' : `${validation.hectaresDeforested} ha`}
            />
          </div>

          <div className="rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                Hash de evidência
              </p>
              <button
                type="button"
                onClick={handleCopyEvidenceHash}
                disabled={!validation.evidenceHash}
                className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink-muted)] hover:border-[var(--color-teal-100)] hover:text-[var(--color-teal-700)] disabled:opacity-40"
              >
                {isHashCopied ? <Check size={11} /> : <Copy size={11} />}
                {isHashCopied ? 'Copiado' : 'Copiar hash'}
              </button>
            </div>
            <p className="mt-1 font-mono text-xs text-[var(--color-ink-muted)]" title={validation.evidenceHash ?? ''}>
              {shortHash(validation.evidenceHash, 24, 18)}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
