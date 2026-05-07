import { useState } from 'react'
import { Check, Copy, Leaf, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Biome, Farm } from '@/types/api'

const BIOME_LABEL: Record<Biome, string> = {
  AMAZON:           'Amazônia',
  CERRADO:          'Cerrado',
  ATLANTIC_FOREST:  'Mata Atlântica',
  CAATINGA:         'Caatinga',
  PAMPA:            'Pampa',
  PANTANAL:         'Pantanal',
}

const BIOME_COLOR: Record<Biome, string> = {
  AMAZON:           'bg-green-100 text-green-800',
  CERRADO:          'bg-amber-100 text-amber-800',
  ATLANTIC_FOREST:  'bg-teal-100 text-teal-800',
  CAATINGA:         'bg-orange-100 text-orange-800',
  PAMPA:            'bg-lime-100 text-lime-800',
  PANTANAL:         'bg-sky-100 text-sky-800',
}

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
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
    </button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--color-border-soft)] last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)] shrink-0">
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  )
}

interface FarmIdentityCardProps {
  farm: Farm
}

export function FarmIdentityCard({ farm }: FarmIdentityCardProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-slate-100)] text-[var(--color-slate-600)]">
          <MapPin size={16} />
        </div>
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Property Identity</h2>
      </div>

      <div className="divide-y divide-[var(--color-border-soft)]">
        <Row label="CAR Number">
          {farm.carNumber ? (
            <div className="inline-flex items-center">
              <span className="rounded bg-[var(--color-border-soft)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-ink-muted)]">
                {farm.carNumber}
              </span>
              <CopyButton value={farm.carNumber} />
            </div>
          ) : (
            <span className="text-xs text-[var(--color-ink-subtle)]">Not registered</span>
          )}
        </Row>

        <Row label="Coordinates">
          <div className="inline-flex items-center gap-1">
            <span className="font-mono text-xs text-[var(--color-ink-muted)]">
              {farm.latitude.toFixed(6)}, {farm.longitude.toFixed(6)}
            </span>
            <CopyButton value={`${farm.latitude}, ${farm.longitude}`} />
          </div>
        </Row>

        <Row label="Biome">
          {farm.biome ? (
            <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-semibold', BIOME_COLOR[farm.biome])}>
              {BIOME_LABEL[farm.biome]}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-ink-subtle)]">—</span>
          )}
        </Row>

        <Row label="Amazon Legal">
          {farm.isAmazonLegal ? (
            <span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-800">
              <Leaf size={10} />
              Yes
            </span>
          ) : (
            <span className="text-xs text-[var(--color-ink-subtle)]">No</span>
          )}
        </Row>

        <Row label="State">
          <span className="text-sm font-semibold text-[var(--color-ink)]">{farm.state}</span>
        </Row>

        <Row label="Municipality">
          <span className="text-sm text-[var(--color-ink-muted)]">{farm.city}</span>
        </Row>
      </div>
    </div>
  )
}
