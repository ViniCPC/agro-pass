interface TimelineDayDividerProps {
  label: string
}

export function TimelineDayDivider({ label }: TimelineDayDividerProps) {
  return (
    <div className="relative py-2">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--color-border-soft)]" />
      <span className="relative inline-flex rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </span>
    </div>
  )
}
