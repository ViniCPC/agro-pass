import {
  Building2,
  Factory,
  Leaf,
  Link2,
  PackageCheck,
  ShieldCheck,
  Ship,
  Truck,
} from 'lucide-react'
import type { ElementType } from 'react'
import type { PublicBatch, TraceEventType } from '@/types/api'
import { formatDateTime, shortHash, TRACE_EVENT_LABEL } from './trace.utils'

type TraceEvent = PublicBatch['traceEvents'][number]

const EVENT_ICON: Record<TraceEventType, ElementType> = {
  CREATED: PackageCheck,
  HARVESTED: Leaf,
  RECEIVED_BY_COOPERATIVE: Building2,
  TRANSPORTED: Truck,
  PROCESSED: Factory,
  EXPORTED: Ship,
  MINTED_ONCHAIN: Link2,
  EUDR_VALIDATED: ShieldCheck,
}

interface TraceTimelineItemProps {
  event: TraceEvent
  isLast: boolean
}

export function TraceTimelineItem({ event, isLast }: TraceTimelineItemProps) {
  const Icon = EVENT_ICON[event.type] ?? PackageCheck

  return (
    <article className="relative grid grid-cols-[32px_1fr] gap-3">
      <div className="relative flex justify-center">
        <span className="z-10 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-teal-700)]">
          <Icon size={14} />
        </span>
        {!isLast && (
          <span className="absolute top-8 bottom-0 w-px bg-[var(--color-border)]" />
        )}
      </div>

      <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            {TRACE_EVENT_LABEL[event.type] ?? event.type}
          </h3>
          <p className="text-xs text-[var(--color-ink-subtle)]">{formatDateTime(event.createdAt)}</p>
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">{event.actorName}</p>
        {event.location && (
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{event.location}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          {event.eventHash && (
            <span
              className="rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 font-mono text-[11px] text-[var(--color-ink-muted)]"
              title={event.eventHash}
            >
              Event hash {shortHash(event.eventHash, 12, 10)}
            </span>
          )}
          {event.txHash && (
            <span
              className="rounded-[var(--radius-badge)] border border-[var(--color-teal-100)] bg-[var(--color-teal-50)] px-2 py-1 font-mono text-[11px] text-[var(--color-teal-700)]"
              title={event.txHash}
            >
              Tx {shortHash(event.txHash, 12, 10)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
