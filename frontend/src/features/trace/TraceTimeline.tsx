import { TimelineContainer } from './TimelineContainer'
import type { TimelineEventData } from './timeline.types'

interface TraceTimelineProps {
  events: TimelineEventData[]
  title?: string
  description?: string
  className?: string
  showExplorerLinks?: boolean
  groupByDayFrom?: number
}

export function TraceTimeline(props: TraceTimelineProps) {
  return <TimelineContainer {...props} />
}
