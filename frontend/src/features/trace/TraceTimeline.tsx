import { TimelineContainer } from './TimelineContainer'
import type { TimelineEventData } from './timeline.types'

interface TraceTimelineProps {
  events: TimelineEventData[]
  title?: string
  description?: string
  className?: string
}

export function TraceTimeline({
  events,
  title,
  description,
  className,
}: TraceTimelineProps) {
  return (
    <TimelineContainer
      events={events}
      title={title}
      description={description}
      className={className}
    />
  )
}
