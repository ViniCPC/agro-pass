import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

function shortenHash(hash: string, take = 8) {
  if (hash.length <= take) return hash
  return `${hash.slice(0, take)}...`
}

interface TimelineHashInlineProps {
  value: string | null
  prefix?: string
}

export function TimelineHashInline({
  value,
  prefix = 'Hash',
}: TimelineHashInlineProps) {
  const [copied, setCopied] = useState(false)
  const [showFull, setShowFull] = useState(false)
  const isMobile = useIsMobile()

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
    <span
      className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] text-[var(--color-ink-muted)]"
      title={hash}
    >
      <span className="font-mono">
        {prefix} {isMobile && showFull ? hash : shortenHash(hash)}
      </span>
      {isMobile && !showFull && hash.length > 12 && (
        <button
          type="button"
          onClick={() => setShowFull(true)}
          className="rounded px-1 text-[10px] font-medium text-[var(--color-teal-700)] hover:bg-[var(--color-teal-50)]"
          aria-label={`Show full ${prefix}`}
        >
          show
        </button>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="rounded p-0.5 text-[var(--color-ink-subtle)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-ink-muted)]"
        aria-label={`Copy ${prefix}`}
        title={copied ? 'Copied' : 'Copy hash'}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </span>
  )
}
