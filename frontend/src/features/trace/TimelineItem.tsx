import { ExternalLink, MapPin, UserRound } from 'lucide-react'
import { ROLE_LABEL, TRACE_EVENT_LABEL, formatDateTime } from './trace.utils'
import { explorerTxUrl } from './solana'
import { TimelineEventIcon } from './TimelineEventIcon'
import { TimelineDocumentBadge } from './TimelineDocumentBadge'
import { TimelineHashInline } from './TimelineHashInline'
import type { TimelineEventData } from './timeline.types'

interface TimelineItemProps {
  event: TimelineEventData
  // The sequence of the event a correction points at.
  correctedSequence?: number
  isLast: boolean
  showExplorerLinks: boolean
}

function getLocationLabel(event: TimelineEventData) {
  if (event.location) return event.location
  if (event.latitude != null && event.longitude != null) {
    return `${event.latitude.toFixed(2)}, ${event.longitude.toFixed(2)}`
  }
  return null
}

export function TimelineItem({ event, correctedSequence, isLast, showExplorerLinks }: TimelineItemProps) {
  const actor = event.actor ?? event.recordedBy
  const roleLabel = actor ? ROLE_LABEL[actor.role] : null
  const locationLabel = getLocationLabel(event)
  const note = event.customStageName?.trim() || null
  const documents = event.documents ?? (event.document ? [event.document] : [])

  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2.5 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-x-3">
      <div className="relative flex justify-center">
        <TimelineEventIcon type={event.type} />
        {!isLast && (
          <span aria-hidden className="absolute top-8 bottom-0 w-px bg-[var(--color-border)]" />
        )}
      </div>

      <div className={isLast ? '' : 'pb-3 sm:pb-4'}>
        <article className="min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)] sm:p-4">
          <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              {event.sequence != null && (
                <span className="mr-1.5 font-mono text-xs font-medium text-[var(--color-ink-subtle)]">
                  #{event.sequence}
                </span>
              )}
              {TRACE_EVENT_LABEL[event.type] ?? event.type}
            </h3>
            <time dateTime={event.createdAt} className="text-xs text-[var(--color-ink-subtle)]">
              {formatDateTime(event.createdAt)}
            </time>
          </header>

          {event.correctedEventId && (
            <p className="mt-1 text-xs font-semibold text-[var(--color-amber-700)]">
              Corrige o evento {correctedSequence != null ? `#${correctedSequence}` : 'anterior'}, que continua registrado.
            </p>
          )}

          {note && (
            <p className="mt-1 break-words text-sm text-[var(--color-ink-muted)]">{note}</p>
          )}

          <dl className="mt-2 space-y-1 text-xs text-[var(--color-ink-muted)]">
            <div className="flex items-start gap-1.5">
              <dt className="sr-only">Responsável</dt>
              <UserRound size={12} className="mt-0.5 shrink-0 text-[var(--color-ink-subtle)]" aria-hidden />
              <dd className="min-w-0 break-words">
                <span className="font-medium text-[var(--color-ink)]">{event.actorName}</span>
                {roleLabel && <span className="text-[var(--color-ink-subtle)]"> · {roleLabel}</span>}
              </dd>
            </div>
            {locationLabel && (
              <div className="flex items-start gap-1.5">
                <dt className="sr-only">Local</dt>
                <MapPin size={12} className="mt-0.5 shrink-0 text-[var(--color-ink-subtle)]" aria-hidden />
                <dd className="min-w-0 break-words">{locationLabel}</dd>
              </div>
            )}
          </dl>

          {documents.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {documents.map((document) => (
                <TimelineDocumentBadge key={document.id} document={document} />
              ))}
            </div>
          )}

          <div className="mt-2.5 space-y-1 border-t border-[var(--color-border-soft)] pt-2">
            <TimelineHashInline label="Hash" value={event.eventHash} />
            <TimelineHashInline label="Tx" value={event.txHash} />
            {event.txHash && showExplorerLinks && (
              <a
                href={explorerTxUrl(event.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-teal-700)] hover:underline"
              >
                Ver transação no Solana Explorer
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
