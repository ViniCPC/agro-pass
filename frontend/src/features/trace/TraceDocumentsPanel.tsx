import { ExternalLink, FileText, Lock } from 'lucide-react'
import { resolveAssetUrl } from '@/features/qr/qr.utils'
import type { PublicBatch, PublicDocument } from '@/types/api'
import { TimelineHashInline } from './TimelineHashInline'
import { DOCUMENT_LABEL, formatDate } from './trace.utils'

function documentLabel(document: PublicDocument, stageNames: Map<string, string>) {
  if (document.type !== 'OTHER') return DOCUMENT_LABEL[document.type]
  return stageNames.get(document.id) ?? document.originalName ?? DOCUMENT_LABEL.OTHER
}

export function TraceDocumentsPanel({ data }: { data: PublicBatch }) {
  // Custom stages (e.g. from the Telegram bot) name their "OTHER" evidence.
  const stageNames = new Map(
    data.traceEvents
      .filter((event) => event.documentId && event.customStageName)
      .map((event) => [event.documentId!, event.customStageName!]),
  )
  const hasRestricted = data.documents.some((document) => !document.fileUrl)

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileText size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Documentos</h2>
      </div>

      {data.documents.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-subtle)]">
          Nenhum documento foi vinculado a este lote.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {data.documents.map((document) => {
            const href = resolveAssetUrl(document.fileUrl)
            return (
              <li
                key={document.id}
                className="rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-page)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-[var(--color-ink)]">
                      {documentLabel(document, stageNames)}
                    </p>
                    <p className="text-xs text-[var(--color-ink-subtle)]">
                      {document.scope === 'FARM' ? 'Documento da fazenda' : 'Documento do lote'} ·{' '}
                      {formatDate(document.createdAt)}
                    </p>
                  </div>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs font-medium text-[var(--color-teal-700)] hover:border-[var(--color-teal-100)]"
                    >
                      Abrir
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span
                      className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-slate-100)] px-2.5 text-xs font-medium text-[var(--color-slate-600)]"
                      title="Arquivo restrito: apenas o hash é público"
                    >
                      <Lock size={12} />
                      Restrito
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <TimelineHashInline label="SHA-256" value={document.fileHash} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {data.documents.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-[var(--color-ink-subtle)]">
          {hasRestricted &&
            'Documentos restritos aparecem só pelo hash: ele prova que o arquivo existe e não foi alterado, sem expor dados pessoais. '}
          Para conferir um arquivo aberto, calcule o SHA-256 dele e compare com o hash exibido.
        </p>
      )}
    </section>
  )
}
