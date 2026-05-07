import { FileText, Image, Satellite } from 'lucide-react'
import type { PublicBatch } from '@/types/api'
import { DOCUMENT_LABEL, formatDate, shortHash } from './trace.utils'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'

type EvidenceItem = {
  id: string
  label: string
  source: string
  url: string
  createdAt: string | null
  hash: string | null
}

function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  if (url.startsWith('/')) {
    return `${API_URL}${url}`
  }
  return `${API_URL}/${url}`
}

function getEvidenceItems(data: PublicBatch): EvidenceItem[] {
  const documentItems = data.documents.map((document) => ({
    id: document.id,
    label: DOCUMENT_LABEL[document.type] ?? document.type,
    source: document.scope === 'FARM' ? 'Farm document' : 'Batch document',
    url: toAbsoluteUrl(document.fileUrl),
    createdAt: document.createdAt,
    hash: document.fileHash,
  }))

  const validation = data.farm.lastValidation
  const satelliteItems: EvidenceItem[] = []

  if (validation?.satelliteImageBeforeUrl) {
    satelliteItems.push({
      id: `${validation.id}-sat-before`,
      label: 'Satellite image (before cutoff)',
      source: 'EUDR validation',
      url: validation.satelliteImageBeforeUrl,
      createdAt: validation.validatedAt,
      hash: validation.evidenceHash,
    })
  }

  if (validation?.satelliteImageAfterUrl) {
    satelliteItems.push({
      id: `${validation.id}-sat-after`,
      label: 'Satellite image (latest)',
      source: 'EUDR validation',
      url: validation.satelliteImageAfterUrl,
      createdAt: validation.validatedAt,
      hash: validation.evidenceHash,
    })
  }

  return [...documentItems, ...satelliteItems]
}

export function TraceDocumentsPanel({ data }: { data: PublicBatch }) {
  const evidenceItems = getEvidenceItems(data)

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <FileText size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Documents and evidence</h2>
      </div>

      {evidenceItems.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-subtle)]">
          No public documents or environmental evidence are available for this batch yet.
        </p>
      ) : (
        <div className="space-y-3">
          {evidenceItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-2 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-page)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{item.label}</p>
                <p className="text-xs text-[var(--color-ink-subtle)]">
                  {item.source} • {formatDate(item.createdAt)}
                </p>
                {item.hash && (
                  <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-muted)]" title={item.hash}>
                    Hash {shortHash(item.hash, 18, 14)}
                  </p>
                )}
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-teal-700)] hover:border-[var(--color-teal-100)]"
              >
                {item.label.includes('Satellite') ? <Satellite size={13} /> : <Image size={13} />}
                Open
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
