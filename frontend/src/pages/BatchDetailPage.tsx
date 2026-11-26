import { isSimulatedProof } from '@/features/trace/solana'
import { AlertTriangle, ArrowLeft, CalendarDays, ExternalLink, Globe, Lock } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageContainer } from '@/components/PageContainer'
import { StatusBadge } from '@/components/StatusBadge'
import { isAdmin } from '@/features/auth/roles'
import { BatchBlockchainProofPanel } from '@/features/batches/BatchBlockchainProofPanel'
import { BatchCorrectionPanel } from '@/features/batches/BatchCorrectionPanel'
import { BatchDocumentsPanel } from '@/features/batches/BatchDocumentsPanel'
import { BatchLifecyclePanel } from '@/features/batches/BatchLifecyclePanel'
import { BatchQrCard } from '@/features/qr/BatchQrCard'
import { TraceTimeline } from '@/features/trace/TraceTimeline'
import { PRODUCT_LABEL, formatHarvestDate, formatQuantity } from '@/features/trace/trace.utils'
import { useActingRole } from '@/hooks/useActingRole'
import { useBatch } from '@/hooks/useBatches'
import { useBatchDocuments } from '@/hooks/useBatchDocuments'
import { useBatchEvents } from '@/hooks/useBatchEvents'
import { isCreatedDemoBatch } from '@/mocks/demo-store'

function OverviewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <div className="mt-1 text-sm text-[var(--color-ink)]">{children}</div>
    </div>
  )
}

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isDemoMode, role } = useActingRole()

  const { data: batch, isLoading, error, refetch } = useBatch(id ?? null)
  const eventsQuery = useBatchEvents(id ?? null)
  const events = eventsQuery.data ?? []
  const { data: documents } = useBatchDocuments(id ?? null)

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState rows={6} />
      </PageContainer>
    )
  }

  if (error || !batch) {
    return (
      <PageContainer>
        <ErrorState
          title="Lote não encontrado"
          description="Não foi possível carregar os dados desse lote."
          onRetry={() => refetch()}
        />
      </PageContainer>
    )
  }

  const product = PRODUCT_LABEL[batch.productType] ?? batch.productType
  const quantity = formatQuantity(batch.quantity, batch.unit)
  const passportPath = `/trace/${encodeURIComponent(batch.publicCode)}`

  return (
    <PageContainer className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/batches')}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] shadow-sm transition-colors hover:bg-[var(--color-page)] hover:text-[var(--color-ink)]"
            aria-label="Voltar para lotes"
          >
            <ArrowLeft size={15} />
          </button>

          <div>
            <h1 className="text-xl font-bold leading-tight text-[var(--color-ink)]">{batch.code}</h1>
            <p className="mt-0.5 text-sm text-[var(--color-ink-subtle)]">
              {product} · {quantity}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={batch.status} />
              {batch.blockchain.status === 'CONFIRMED' && <StatusBadge status="TOKENIZED" label={isSimulatedProof(batch.blockchain, isDemoMode) ? 'Simulada' : 'On-chain'} />}
            </div>
          </div>
        </div>

        {batch.isPublic ? (
          <Link
            to={passportPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
          >
            <ExternalLink size={15} />
            Ver passaporte público
          </Link>
        ) : (
          // A private batch has no public page yet: point at how to publish it.
          <a
            href="#etapas"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-ink-muted)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
          >
            <Lock size={15} />
            {isAdmin(role) ? 'Passaporte privado · publicar' : 'Passaporte ainda não publicado'}
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-base font-semibold text-[var(--color-ink)]">
              Visão geral do lote
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OverviewField label="Fazenda">{batch.farm.name}</OverviewField>
              <OverviewField label="Data da colheita">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  {formatHarvestDate(batch.harvestDate)}
                </span>
              </OverviewField>
              <OverviewField label="Código público">
                <span className="break-all font-mono text-xs">{batch.publicCode}</span>
              </OverviewField>
              <OverviewField label="Passaporte público">
                {batch.isPublic ? (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-green-700)]">
                    <Globe size={13} />
                    Publicado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-amber-700)]">
                    <Lock size={13} />
                    Privado · aguardando publicação por um administrador
                  </span>
                )}
              </OverviewField>
            </div>
          </section>

          <BatchLifecyclePanel
            batch={batch}
            eventCount={eventsQuery.data?.length}
            documentCount={documents?.length}
          />

          <BatchDocumentsPanel batch={batch} />

          <BatchBlockchainProofPanel batch={batch} />

          <div id="linha-do-tempo" className="scroll-mt-4 space-y-4">
            {eventsQuery.error ? (
              // Not an empty history: the events could not be read.
              <ErrorState
                title="Não foi possível carregar a linha do tempo"
                description="Os eventos do lote existem, mas não chegaram agora. Verifique a conexão e tente de novo."
                onRetry={() => eventsQuery.refetch()}
              />
            ) : (
              <TraceTimeline
                events={events}
                title="Linha do tempo de rastreabilidade"
                description="Eventos auditáveis da cadeia produtiva, da criação ao encerramento."
                className="border-[var(--color-border)] from-[var(--color-page)]"
                showExplorerLinks={!isDemoMode}
              />
            )}

            {isAdmin(role) && batch.status !== 'CLOSED' && batch.status !== 'CANCELLED' && events.length > 0 && (
              <BatchCorrectionPanel batch={batch} events={events} />
            )}
          </div>
        </div>

        <div id="qr-do-lote" className="scroll-mt-4 space-y-3 lg:sticky lg:top-4 lg:self-start">
          {isDemoMode && isCreatedDemoBatch(batch.id) && (
            <p className="flex gap-2 rounded-lg border border-[var(--color-amber-100)] bg-[var(--color-amber-50)] px-3 py-2.5 text-xs leading-5 text-[var(--color-amber-700)]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Lote criado na demonstração: ele existe só neste navegador. O QR e o link abrem o passaporte aqui, mas
                em outro aparelho o código não será encontrado.
              </span>
            </p>
          )}
          <BatchQrCard
            batchCode={batch.code}
            publicCode={batch.publicCode}
            isPublic={batch.isPublic}
            caption={`${product} · ${quantity}`}
          />
        </div>
      </div>
    </PageContainer>
  )
}
