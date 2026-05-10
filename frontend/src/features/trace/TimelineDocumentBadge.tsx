import { Paperclip } from 'lucide-react'
import { resolveAssetUrl } from '@/features/qr/qr.utils'
import type { TimelineEventData } from './timeline.types'

interface TimelineDocumentBadgeProps {
  document: NonNullable<TimelineEventData['document']>
}

export function TimelineDocumentBadge({ document }: TimelineDocumentBadgeProps) {
  const href = resolveAssetUrl(document.fileUrl)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-teal-200)] bg-[var(--color-teal-50)] px-2 py-1 text-xs font-medium text-[var(--color-teal-700)] hover:bg-[var(--color-teal-100)]"
      title="Open document evidence"
    >
      <Paperclip size={12} />
      Evidence
    </a>
  )
}
