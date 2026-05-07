import { useState } from 'react'
import { Check, Copy, Database, ShieldAlert, ShieldCheck } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'
import type { EudrValidation } from '@/types/api'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center rounded p-0.5 text-[var(--color-ink-subtle)] transition-colors hover:bg-[var(--color-border-soft)] hover:text-[var(--color-ink-muted)]"
    >
      {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
    </button>
  )
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ACCENT: Record<string, string> = {
  COMPLIANT:     'border-l-4 border-l-green-500',
  NEEDS_REVIEW:  'border-l-4 border-l-amber-500',
  NON_COMPLIANT: 'border-l-4 border-l-red-500',
  PENDING:       'border-l-4 border-l-slate-300',
  EXPIRED:       'border-l-4 border-l-slate-300',
}

const SOURCES = [
  { name: 'MapBiomas',  desc: 'Annual land use & cover mapping' },
  { name: 'PRODES',     desc: 'INPE deforestation monitoring' },
  { name: 'Hansen/GFC', desc: 'Global Forest Change dataset' },
  { name: 'Sentinel-2', desc: 'ESA satellite imagery + NDVI' },
]

interface FarmComplianceCardProps {
  validation: EudrValidation | null
  isLoading?: boolean
}

export function FarmComplianceCard({ validation, isLoading }: FarmComplianceCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-[var(--color-border-soft)]" />
      </div>
    )
  }

  if (!validation) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-6 text-center">
        <ShieldAlert size={32} className="mx-auto mb-2 text-[var(--color-ink-subtle)]" />
        <p className="text-sm font-medium text-[var(--color-ink)]">No EUDR validation yet</p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          Click "Run EUDR Validation" to check this farm against deforestation databases.
        </p>
      </div>
    )
  }

  const accentClass = ACCENT[validation.status] ?? ACCENT.PENDING

  return (
    <div className={cn(
      'rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden',
      accentClass,
    )}>
      <div className="p-5">
        {/* Header row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-teal-100,#ccfbf1)] text-[var(--color-teal-700,#0f766e)]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">EUDR Compliance</h2>
              <p className="text-[11px] text-[var(--color-ink-subtle)]">
                EU Deforestation Regulation · cut-off 31 Dec 2020
              </p>
            </div>
          </div>
          <StatusBadge status={validation.status} className="text-sm px-3 py-1" />
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
          <Metric
            label="Deforested Area"
            value={
              validation.hectaresDeforested === 0
                ? '0.00 ha'
                : `${validation.hectaresDeforested?.toFixed(2) ?? '—'} ha`
            }
            highlight={validation.hectaresDeforested === 0}
          />
          <Metric label="Cut-off Date" value="31 Dec 2020" />
          <Metric label="Validated At"  value={fmt(validation.validatedAt)} />
          <Metric label="Valid Until"   value={fmt(validation.validUntil)} />
        </div>

        {/* Evidence hash */}
        {validation.evidenceHash && (
          <div className="mb-5 rounded-lg bg-[var(--color-page)] border border-[var(--color-border-soft)] px-3 py-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Evidence Hash (SHA-256)
            </p>
            <div className="flex items-center">
              <code className="flex-1 truncate font-mono text-[11px] text-[var(--color-ink-muted)]">
                {validation.evidenceHash}
              </code>
              <CopyButton value={validation.evidenceHash} />
            </div>
          </div>
        )}

        {/* Sources consulted */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Sources Consulted
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SOURCES.map((src) => (
              <div
                key={src.name}
                className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] px-2.5 py-2"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Database size={10} className="text-[var(--color-teal-600,#0d9488)] shrink-0" />
                  <span className="text-[11px] font-semibold text-[var(--color-ink)]">{src.name}</span>
                </div>
                <p className="text-[10px] text-[var(--color-ink-subtle)] leading-tight">{src.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-[var(--color-page)] border border-[var(--color-border-soft)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-1">{label}</p>
      <p className={cn(
        'text-sm font-bold leading-none',
        highlight ? 'text-green-600' : 'text-[var(--color-ink)]',
      )}>
        {value}
      </p>
    </div>
  )
}
