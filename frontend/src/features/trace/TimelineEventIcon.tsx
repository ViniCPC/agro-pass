import {
  Factory,
  Link2,
  ShieldCheck,
  Ship,
  Sprout,
  Truck,
  Warehouse,
  Wheat,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { TraceEventType } from '@/types/api'
import { cn } from '@/lib/utils'

const EVENT_ICON: Record<TraceEventType, ComponentType<{ size?: number }>> = {
  CREATED: Sprout,
  HARVESTED: Wheat,
  RECEIVED_BY_COOPERATIVE: Warehouse,
  TRANSPORTED: Truck,
  PROCESSED: Factory,
  EXPORTED: Ship,
  MINTED_ONCHAIN: Link2,
  EUDR_VALIDATED: ShieldCheck,
}

const EVENT_TONE: Record<TraceEventType, string> = {
  CREATED: 'bg-[var(--color-green-50)] text-[var(--color-green-700)] border-[var(--color-green-100)]',
  HARVESTED: 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border-[var(--color-amber-100)]',
  RECEIVED_BY_COOPERATIVE: 'bg-[var(--color-slate-50)] text-[var(--color-slate-600)] border-[var(--color-slate-100)]',
  TRANSPORTED: 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border-[var(--color-amber-100)]',
  PROCESSED: 'bg-[var(--color-slate-50)] text-[var(--color-slate-600)] border-[var(--color-slate-100)]',
  EXPORTED: 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)] border-[var(--color-teal-100)]',
  MINTED_ONCHAIN: 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)] border-[var(--color-teal-100)]',
  EUDR_VALIDATED: 'bg-[var(--color-green-50)] text-[var(--color-green-700)] border-[var(--color-green-100)]',
}

interface TimelineEventIconProps {
  type: TraceEventType
  className?: string
}

export function TimelineEventIcon({ type, className }: TimelineEventIconProps) {
  const Icon = EVENT_ICON[type]
  const tone = EVENT_TONE[type]

  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full border',
        tone,
        className,
      )}
    >
      <Icon size={15} />
    </span>
  )
}
