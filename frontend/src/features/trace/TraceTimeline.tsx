import { Activity } from 'lucide-react'
import type { PublicBatch } from '@/types/api'
import { TraceTimelineItem } from './TraceTimelineItem'

interface TraceTimelineProps {
  events: PublicBatch['traceEvents']
}

export function TraceTimeline({ events }: TraceTimelineProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-teal-100)] bg-gradient-to-br from-[var(--color-teal-50)] to-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)]">
      <div className="mb-4 flex items-center gap-2">
        <Activity size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Supply chain timeline</h2>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-subtle)]">
          No trace events have been registered yet for this batch.
        </p>
      ) : (
        <div className="space-y-0">
          {events.map((event, index) => (
            <TraceTimelineItem
              key={event.id}
              event={event}
              isLast={index === events.length - 1}
            />
          ))}
        </div>
      )}
    </section>
  )
}
