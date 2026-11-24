import { Lock, Paperclip } from 'lucide-react'
import { resolveAssetUrl } from '@/features/qr/qr.utils'
import { DOCUMENT_SHORT_LABEL } from './trace.utils'
import type { TimelineDocument } from './timeline.types'

interface TimelineDocumentBadgeProps {
  document: TimelineDocument
}

export function TimelineDocumentBadge({ document }: TimelineDocumentBadgeProps) {
  const label = DOCUMENT_SHORT_LABEL[document.type] ?? 'Evidência'
  const href = resolveAssetUrl(document.fileUrl)

  if (!href) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-slate-50)] px-2 py-1 text-xs font-medium text-[var(--color-ink-muted)]"
        title="Arquivo restrito: apenas o hash é público"
      >
        <Lock size={11} />
        {label} · restrito
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-teal-100)] bg-[var(--color-teal-50)] px-2 py-1 text-xs font-medium text-[var(--color-teal-700)] hover:bg-[var(--color-teal-100)]"
      title="Abrir documento"
    >
      <Paperclip size={12} />
      {label}
    </a>
  )
}
