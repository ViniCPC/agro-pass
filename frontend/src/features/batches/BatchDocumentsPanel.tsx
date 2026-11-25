import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Download, ExternalLink, FileText, Globe, Loader2, Lock, Paperclip, Upload } from 'lucide-react'
import { batchesApi } from '@/api/batchesApi'
import { FormField, INPUT_CLASS } from '@/components/FormField'
import { RoleHandoff } from '@/features/auth/RoleHandoff'
import { canManageDocuments } from '@/features/auth/roles'
import { DOCUMENT_LABEL, formatDateTime, shortHash } from '@/features/trace/trace.utils'
import { downloadBlobAsFile, resolveAssetUrl } from '@/features/qr/qr.utils'
import { useActingRole } from '@/hooks/useActingRole'
import { useBatchDocuments, useSetDocumentVisibility, useUploadDocument } from '@/hooks/useBatchDocuments'
import { apiErrorMessage } from '@/lib/api-error'
import type { Batch, BatchDocument, DocumentType } from '@/types/api'
import { ACCEPT_ATTRIBUTE, checkDocumentFile, DOCUMENT_TYPE_OPTIONS, formatFileSize } from './document-upload'

const CARD =
  'rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]'
const LINK = 'inline-flex min-h-[36px] items-center gap-1 text-xs font-medium text-[var(--color-teal-700)] hover:underline'

function DocumentRow({ batchId, document, canManage }: { batchId: string; document: BatchDocument; canManage: boolean }) {
  const { isDemoMode } = useActingRole()
  const visibility = useSetDocumentVisibility()
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const name = document.originalName ?? 'Documento restrito'

  // Private files are served only through the API, with the session.
  async function downloadPrivate() {
    setDownloadError(null)
    try {
      downloadBlobAsFile(await batchesApi.downloadDocument(batchId, document.id), name)
    } catch (error) {
      setDownloadError(apiErrorMessage(error, 'Não foi possível baixar o arquivo.'))
    }
  }

  // Demo files open from this browser; live public files from the API.
  const href = document.isPublic || isDemoMode ? resolveAssetUrl(document.fileUrl) : null

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{DOCUMENT_LABEL[document.type]}</p>
          <p className="break-all text-xs text-[var(--color-ink-muted)]">
            {name} · {formatFileSize(document.size)} · {formatDateTime(document.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            document.isPublic
              ? 'bg-[var(--color-green-50)] text-[var(--color-green-700)]'
              : 'bg-[var(--color-slate-100)] text-[var(--color-ink-muted)]'
          }`}
        >
          {document.isPublic ? <Globe size={11} /> : <Lock size={11} />}
          {document.isPublic ? 'Público' : 'Privado'}
        </span>
      </div>
      <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-subtle)]" title={document.fileHash}>
        SHA-256 {shortHash(document.fileHash, 12, 8)}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-4">
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className={LINK}>
            <ExternalLink size={12} aria-hidden />
            Abrir
          </a>
        )}
        {!href && !isDemoMode && canManage && (
          <button type="button" onClick={downloadPrivate} className={LINK}>
            <Download size={12} aria-hidden />
            Baixar
          </button>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => visibility.mutate({ batchId, documentId: document.id, isPublic: !document.isPublic })}
            disabled={visibility.isPending}
            className={`${LINK} disabled:opacity-60`}
          >
            {visibility.isPending && <Loader2 size={12} className="animate-spin" aria-hidden />}
            {document.isPublic ? 'Tornar privado' : 'Mostrar no passaporte'}
          </button>
        )}
      </div>
      {(visibility.error || downloadError) && (
        <p className="mt-1 text-xs text-[var(--color-red-700)]">
          {downloadError ?? apiErrorMessage(visibility.error)}
        </p>
      )}
    </li>
  )
}

function UploadForm({ batchId }: { batchId: string }) {
  const { isDemoMode } = useActingRole()
  const upload = useUploadDocument()
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<DocumentType>('INVOICE')
  const [isPublic, setIsPublic] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  async function choose(selected: File | null) {
    setSent(null)
    upload.reset()
    setFile(selected)
    setProblem(selected ? await checkDocumentFile(selected) : null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setProblem('Escolha um arquivo.')
      return
    }
    const found = await checkDocumentFile(file)
    if (found) {
      setProblem(found)
      return
    }
    try {
      await upload.mutateAsync({ batchId, file, type, isPublic })
      setSent(file.name)
      setFile(null)
      setIsPublic(false)
      if (fileInput.current) fileInput.current.value = ''
    } catch {
      // Shown below.
    }
  }

  const typeHint = DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type)?.hint

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] p-4">
      <p className="text-sm font-semibold text-[var(--color-ink)]">Anexar documento</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField id="document-type" label="Tipo do documento" hint={typeHint}>
          <select
            id="document-type"
            value={type}
            disabled={upload.isPending}
            onChange={(event) => {
              const value = event.target.value as DocumentType
              setType(value)
              // A CAR receipt carries personal data.
              if (value === 'CAR') setIsPublic(false)
            }}
            className={INPUT_CLASS}
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="document-file" label="Arquivo" hint="PDF, JPG ou PNG, até 5 MB." error={problem}>
          <input
            ref={fileInput}
            id="document-file"
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            disabled={upload.isPending}
            onChange={(event) => choose(event.target.files?.[0] ?? null)}
            aria-invalid={Boolean(problem)}
            className="block w-full text-sm text-[var(--color-ink-muted)] file:mr-3 file:min-h-[40px] file:cursor-pointer file:rounded-lg file:border file:border-[var(--color-border)] file:bg-[var(--color-surface)] file:px-3 file:text-sm file:font-medium file:text-[var(--color-ink)]"
          />
        </FormField>
      </div>

      <label className="flex items-start gap-2 text-sm text-[var(--color-ink-muted)]">
        <input
          type="checkbox"
          checked={isPublic}
          disabled={upload.isPending || type === 'CAR'}
          onChange={(event) => setIsPublic(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-teal-700)]"
        />
        <span>
          Mostrar o arquivo no passaporte público
          <span className="block text-xs text-[var(--color-ink-subtle)]">
            Privado, o passaporte mostra só o hash: dá para provar que o documento existe sem expor o conteúdo.
          </span>
        </span>
      </label>

      {isDemoMode && (
        <p className="rounded-md bg-[var(--color-amber-50)] px-3 py-2 text-xs text-[var(--color-amber-700)]">
          Demonstração: o hash SHA-256 é calculado de verdade, mas o arquivo fica só neste navegador. Arquivos acima de
          1 MB abrem apenas até recarregar a página.
        </p>
      )}

      {upload.error && (
        <p role="alert" className="rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
          {apiErrorMessage(upload.error, 'Não foi possível enviar o documento.')}
        </p>
      )}
      {sent && (
        <p role="status" className="flex items-center gap-1.5 rounded-md bg-[var(--color-green-50)] px-3 py-2 text-xs text-[var(--color-green-700)]">
          <CheckCircle2 size={13} aria-hidden />
          “{sent}” anexado. O hash do arquivo entrou na cadeia como um novo evento.
        </p>
      )}

      <button
        type="submit"
        disabled={upload.isPending || Boolean(problem) || !file}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {upload.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {upload.isPending ? 'Enviando...' : 'Anexar documento'}
      </button>
    </form>
  )
}

export function BatchDocumentsPanel({ batch }: { batch: Batch }) {
  const { role } = useActingRole()
  const { data: documents = [], isLoading, error, refetch } = useBatchDocuments(batch.id)
  const canManage = canManageDocuments(role)
  const terminal = batch.status === 'CLOSED' || batch.status === 'CANCELLED'

  return (
    <section id="documentos" className={`${CARD} scroll-mt-4`}>
      <div className="mb-1 flex items-center gap-2">
        <Paperclip size={16} className="text-[var(--color-teal-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Documentos</h2>
      </div>
      <p className="mb-4 text-sm text-[var(--color-ink-subtle)]">
        Notas, recibos e certificados do lote. O hash de cada arquivo fica na cadeia, então qualquer troca é detectável.
      </p>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-[var(--color-ink-subtle)]">
          <Loader2 size={14} className="animate-spin" /> Carregando documentos...
        </p>
      ) : error ? (
        <p className="text-sm text-[var(--color-red-700)]">
          Não foi possível carregar os documentos.{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Tentar novamente
          </button>
        </p>
      ) : documents.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-[var(--color-page)] px-3 py-2.5 text-sm text-[var(--color-ink-subtle)]">
          <FileText size={14} aria-hidden /> Nenhum documento anexado ainda.
        </p>
      ) : (
        <ul aria-label="Documentos anexados" className="divide-y divide-[var(--color-border-soft)]">
          {documents.map((document) => (
            <DocumentRow key={document.id} batchId={batch.id} document={document} canManage={canManage} />
          ))}
        </ul>
      )}

      <div className="mt-4">
        {terminal ? (
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Lote {batch.status === 'CLOSED' ? 'encerrado' : 'cancelado'}: não recebe novos documentos. A visibilidade
            ainda pode mudar, porque não faz parte do hash.
          </p>
        ) : canManage ? (
          <UploadForm batchId={batch.id} />
        ) : (
          <RoleHandoff role="COOPERATIVE">Documentos são anexados pela cooperativa ou por um administrador.</RoleHandoff>
        )}
      </div>
    </section>
  )
}
