import { ExternalLink, MapPin } from 'lucide-react'
import { TRACE_EVENT_LABEL, formatDateTime } from './trace.utils'
import { TimelineEventIcon } from './TimelineEventIcon'
import { TimelineHashInline } from './TimelineHashInline'
import type { TimelineEventData } from './timeline.types'

interface TimelineItemProps {
  event: TimelineEventData
  isLast: boolean
}

function getLocationLabel(event: TimelineEventData) {
  if (event.location) return event.location
  if (event.latitude != null && event.longitude != null) {
    return `${event.latitude.toFixed(5)}, ${event.longitude.toFixed(5)}`
  }
  return null
}

function getExplorerTxLink(txHash: string) {
  return `https://solscan.io/tx/${encodeURIComponent(txHash)}?cluster=devnet`
}

export function TimelineItem({ event, isLast }: TimelineItemProps) {
  const locationLabel = getLocationLabel(event)

  return (
    <article className="group relative grid grid-cols-[2.25rem_1fr] gap-3">
      <div className="relative flex justify-center">
        <TimelineEventIcon type={event.type} />
        {!isLast && (
          <span className="absolute top-8 bottom-0 w-px bg-[var(--color-border)]" />
        )}
      </div>

      <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-card)] transition-all group-hover:border-[var(--color-teal-100)] group-hover:shadow-[var(--shadow-card-hover)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                {TRACE_EVENT_LABEL[event.type] ?? event.type}
              </h3>
              <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
                {event.actorName}
              </p>
            </div>
            <p className="text-xs text-[var(--color-ink-subtle)]">
              {formatDateTime(event.createdAt)}
            </p>
          </div>

          {locationLabel && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
              <MapPin size={12} />
              {locationLabel}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TimelineHashInline value={event.eventHash} prefix="Event" />
            <TimelineHashInline value={event.txHash} prefix="Tx" />
            {event.txHash && (
              <a
                href={getExplorerTxLink(event.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-teal-700)] hover:underline"
              >
                View on Solana Explorer {'->'}
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
