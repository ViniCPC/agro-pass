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
  showExplorerLinks?: boolean
}

// Local calendar day, matching the times printed on each event.
function localDayKey(isoDate: string) {
  const date = new Date(isoDate)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatDayDividerLabel(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type TimelineEntry =
  | { kind: 'divider'; id: string; label: string }
  | { kind: 'event'; event: TimelineEventData; isLast: boolean }

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

// Vertical motion only: a horizontal slide-in would make narrow screens
// scroll sideways while it plays.
const entryVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

function sortKey(event: TimelineEventData) {
  return event.sequence ?? new Date(event.createdAt).getTime()
}

export function TimelineContainer({
  events,
  title = 'Linha do tempo',
  description,
  className,
  groupByDayFrom = 6,
  showExplorerLinks = true,
}: TimelineContainerProps) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => sortKey(a) - sortKey(b)),
    [events],
  )

  const entries = useMemo(() => {
    const result: TimelineEntry[] = []
    const shouldGroupByDay = sortedEvents.length >= groupByDayFrom
    let currentDayKey: string | null = null

    sortedEvents.forEach((event, index) => {
      const dayKey = localDayKey(event.createdAt)
      if (shouldGroupByDay && dayKey !== currentDayKey) {
        currentDayKey = dayKey
        result.push({
          kind: 'divider',
          id: `day-${dayKey}`,
          label: formatDayDividerLabel(event.createdAt),
        })
      }
      result.push({ kind: 'event', event, isLast: index === sortedEvents.length - 1 })
    })

    return result
  }, [groupByDayFrom, sortedEvents])

  return (
    <section
      className={`rounded-[var(--radius-card)] border border-[var(--color-teal-100)] bg-gradient-to-br from-[var(--color-teal-50)] to-[var(--color-surface)] p-4 shadow-[var(--shadow-card-hover)] sm:p-5 ${
        className ?? ''
      }`}
    >
      <div className="mb-4 flex items-start gap-2">
        <Activity size={16} className="mt-0.5 shrink-0 text-[var(--color-teal-700)]" />
        <div>
          <h2 className="text-base font-semibold text-[var(--color-ink)]">{title}</h2>
          {description && (
            <p className="text-sm text-[var(--color-ink-subtle)]">{description}</p>
          )}
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <TimelineEmptyState />
      ) : (
        <motion.ol variants={listVariants} initial="hidden" animate="show">
          {entries.map((entry) =>
            entry.kind === 'divider' ? (
              <motion.li
                key={entry.id}
                variants={entryVariants}
                transition={{ duration: 0.2 }}
                aria-hidden
              >
                <TimelineDayDivider label={entry.label} />
              </motion.li>
            ) : (
              <motion.li key={entry.event.id} variants={entryVariants} transition={{ duration: 0.22 }}>
                <TimelineItem
                  event={entry.event}
                  isLast={entry.isLast}
                  showExplorerLinks={showExplorerLinks}
                />
              </motion.li>
            ),
          )}
        </motion.ol>
      )}
    </section>
  )
}
