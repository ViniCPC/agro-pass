import { useMemo } from 'react'
import { Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { TimelineDayDivider } from './TimelineDayDivider'
import { TimelineEmptyState } from './TimelineEmptyState'
import { TimelineItem } from './TimelineItem'
import type { TimelineEventData } from './timeline.types'

interface TimelineContainerProps {
  events: TimelineEventData[]
  title?: string
  description?: string
  className?: string
  groupByDayFrom?: number
}

function formatDayDividerLabel(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

type TimelineEntry =
  | { kind: 'divider'; id: string; label: string }
  | { kind: 'event'; event: TimelineEventData; isLast: boolean }

export function TimelineContainer({
  events,
  title = 'Supply chain timeline',
  description,
  className,
  groupByDayFrom = 6,
}: TimelineContainerProps) {
  const listVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.09,
      },
    },
  }

  const entryVariants = {
    hidden: { opacity: 0, x: -14 },
    show: { opacity: 1, x: 0 },
  }

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [events],
  )

  const entries = useMemo(() => {
    const result: TimelineEntry[] = []
    const shouldGroupByDay = sortedEvents.length >= groupByDayFrom

    if (!shouldGroupByDay) {
      return sortedEvents.map((event, index) => ({
        kind: 'event' as const,
        event,
        isLast: index === sortedEvents.length - 1,
      }))
    }

    let currentDayKey: string | null = null
    for (let index = 0; index < sortedEvents.length; index += 1) {
      const event = sortedEvents[index]
      const dayKey = new Date(event.createdAt).toISOString().slice(0, 10)

      if (dayKey !== currentDayKey) {
        currentDayKey = dayKey
        result.push({
          kind: 'divider',
          id: `day-${dayKey}`,
          label: formatDayDividerLabel(dayKey),
        })
      }

      result.push({
        kind: 'event',
        event,
        isLast: index === sortedEvents.length - 1,
      })
    }

    return result
  }, [groupByDayFrom, sortedEvents])

  return (
    <section
      className={`rounded-[var(--radius-card)] border border-[var(--color-teal-100)] bg-gradient-to-br from-[var(--color-teal-50)] to-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)] ${
        className ?? ''
      }`}
    >
      <div className="mb-4 flex items-center gap-2">
        <Activity size={16} className="text-[var(--color-teal-700)]" />
        <div>
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-[var(--color-ink-subtle)]">{description}</p>
          )}
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <TimelineEmptyState />
      ) : (
        <motion.div
          className="space-y-0"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {entries.map((entry) =>
            entry.kind === 'divider' ? (
              <motion.div key={entry.id} variants={entryVariants} transition={{ duration: 0.22 }}>
                <TimelineDayDivider label={entry.label} />
              </motion.div>
            ) : (
              <motion.div key={entry.event.id} variants={entryVariants} transition={{ duration: 0.25 }}>
                <TimelineItem
                  event={entry.event}
                  isLast={entry.isLast}
                />
              </motion.div>
            ),
          )}
        </motion.div>
      )}
    </section>
  )
}
