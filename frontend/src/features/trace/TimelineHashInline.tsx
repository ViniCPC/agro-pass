import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { shortHash } from './trace.utils'

interface TimelineHashInlineProps {
  value: string | null
  label: string
}

// Short by default; tapping the hash shows it in full, wrapped, so long
// hashes never force horizontal scrolling on small screens.
export function TimelineHashInline({ value, label }: TimelineHashInlineProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (!value) return null
  const hash = value

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex min-w-0 items-start gap-1.5 text-[11px] leading-5">
      <span className="shrink-0 font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        title={expanded ? 'Recolher hash' : 'Ver hash completo'}
        className="min-w-0 flex-1 break-all text-left font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        {expanded ? hash : shortHash(hash, 10, 8)}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="-my-0.5 shrink-0 rounded p-1 text-[var(--color-ink-subtle)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-ink-muted)]"
        aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
        title={copied ? 'Copiado' : 'Copiar'}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  )
}
