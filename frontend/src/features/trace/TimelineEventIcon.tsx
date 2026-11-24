import {
  Factory,
  FileCheck2,
  FilePenLine,
  Link2,
  CheckCircle2,
  CircleX,
  LockKeyhole,
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
  RECEIVED: Warehouse,
  IN_TRANSIT: Truck,
  PROCESSED: Factory,
  DELIVERED: CheckCircle2,
  CLOSED: LockKeyhole,
  CANCELLED: CircleX,
  MINTED_ONCHAIN: Link2,
  DOCUMENT_ATTACHED: FileCheck2,
  CORRECTION: FilePenLine,
}

const EVENT_TONE: Record<TraceEventType, string> = {
  CREATED: 'bg-[var(--color-green-50)] text-[var(--color-green-700)] border-[var(--color-green-100)]',
  HARVESTED: 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border-[var(--color-amber-100)]',
  RECEIVED: 'bg-[var(--color-slate-50)] text-[var(--color-slate-600)] border-[var(--color-slate-100)]',
  IN_TRANSIT: 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border-[var(--color-amber-100)]',
  PROCESSED: 'bg-[var(--color-slate-50)] text-[var(--color-slate-600)] border-[var(--color-slate-100)]',
  DELIVERED: 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)] border-[var(--color-teal-100)]',
  CLOSED: 'bg-[var(--color-slate-50)] text-[var(--color-slate-700)] border-[var(--color-slate-100)]',
  CANCELLED: 'bg-[var(--color-red-50)] text-[var(--color-red-700)] border-[var(--color-red-100)]',
  MINTED_ONCHAIN: 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)] border-[var(--color-teal-100)]',
  DOCUMENT_ATTACHED: 'bg-[var(--color-slate-50)] text-[var(--color-slate-700)] border-[var(--color-slate-100)]',
  CORRECTION: 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border-[var(--color-amber-100)]',
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
