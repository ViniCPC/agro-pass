import { useState, type ReactNode } from 'react'
import { Check, Copy, MapPin } from 'lucide-react'
import type { Farm } from '@/types/api'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center rounded p-0.5 text-[var(--color-ink-subtle)] hover:bg-[var(--color-border-soft)]"
      aria-label="Copiar"
    >
      {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
    </button>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-soft)] py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  )
}

export function FarmIdentityCard({ farm }: { farm: Farm }) {
  const coordinates = farm.latitude + ', ' + farm.longitude

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-slate-100)] text-[var(--color-slate-600)]">
          <MapPin size={16} />
        </div>
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Identificação da propriedade</h2>
      </div>

      <Row label="CAR">
        {farm.carNumber ? (
          <span className="inline-flex items-center font-mono text-xs text-[var(--color-ink-muted)]">
            {farm.carNumber}
            <CopyButton value={farm.carNumber} />
          </span>
        ) : (
          <span className="text-xs text-[var(--color-ink-subtle)]">Não informado</span>
        )}
      </Row>
      <Row label="Coordenadas">
        <span className="inline-flex items-center font-mono text-xs text-[var(--color-ink-muted)]">
          {farm.latitude.toFixed(6)}, {farm.longitude.toFixed(6)}
          <CopyButton value={coordinates} />
        </span>
      </Row>
      <Row label="Estado">
        <span className="text-sm font-semibold text-[var(--color-ink)]">{farm.state}</span>
      </Row>
      <Row label="Município">
        <span className="text-sm text-[var(--color-ink-muted)]">{farm.city}</span>
      </Row>
    </section>
  )
}
