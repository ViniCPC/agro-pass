import { useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Factory, QrCode, ScanLine } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageContainer } from '@/components/PageContainer'
import { StatusBadge } from '@/components/StatusBadge'
import { BatchQrCard } from '@/features/qr/BatchQrCard'
import { GenerateQrButton } from '@/features/qr/GenerateQrButton'
import { TraceTimeline } from '@/features/trace/TraceTimeline'
import { getPublicTraceLink } from '@/features/qr/qr.utils'
import { useBatch } from '@/hooks/useBatches'
import { useBatchEvents } from '@/hooks/useBatchEvents'

const PRODUCT_LABEL: Record<string, string> = {
  COFFEE: 'Cafe',
  SOY: 'Soja',
  CATTLE: 'Bovino',
  COCOA: 'Cacau',
  PALM_OIL: 'Palma',
  RUBBER: 'Borracha',
  WOOD: 'Madeira',
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

  const { data: batch, isLoading, error, refetch } = useBatch(id ?? null)
  const { data: events = [] } = useBatchEvents(id ?? null)

  const qrCodeUrl = generatedQrUrl ?? batch?.qrCodeUrl ?? null
  const publicLink = useMemo(
    () => (batch ? getPublicTraceLink(batch.code) : null),
    [batch],
  )

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
          title="Lote nao encontrado"
          description="Nao foi possivel carregar os dados desse lote."
          onRetry={() => refetch()}
        />
      </PageContainer>
    )
  }

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
            <h1 className="text-xl font-bold leading-tight text-[var(--color-ink)]">
              {batch.code}
            </h1>
            <p className="mt-0.5 text-sm text-[var(--color-ink-subtle)]">
              {PRODUCT_LABEL[batch.productType] ?? batch.productType} - {new Intl.NumberFormat('pt-BR').format(batch.quantity)} {batch.unit}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={batch.status} />
              {batch.cnftAddress && <StatusBadge status="MINTED" label="On-chain" />}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <GenerateQrButton
            batchId={batch.id}
            batchCode={batch.code}
            onGenerated={(result) => {
              setGeneratedQrUrl(result.qrCodeUrl)
              setIsQrModalOpen(true)
            }}
          />
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            disabled={!qrCodeUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QrCode size={15} />
            Abrir QR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-[var(--color-ink)]">
            Visão geral do lote
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                Fazenda
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink)]">{batch.farm.name}</p>
            </div>

            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                Data da colheita
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink)]">
                <CalendarDays size={13} />
                {formatDate(batch.harvestDate)}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                Coordenadas
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                {batch.farm.latitude.toFixed(5)}, {batch.farm.longitude.toFixed(5)}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                Link de rastreio público
              </p>
              <p className="mt-1 truncate font-mono text-xs text-[var(--color-ink-muted)]">
                {publicLink ?? '-'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-base font-semibold text-[var(--color-ink)]">
            Status do QR
          </h2>
          <p className="text-sm text-[var(--color-ink-subtle)]">
            Gere o QR para destacar o passaporte digital na cooperativa e na pagina publica.
          </p>
          <div className="mt-4 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] p-3 text-sm text-[var(--color-ink-muted)]">
            <p className="inline-flex items-center gap-1.5">
              <ScanLine size={14} />
              {qrCodeUrl ? 'QR pronto para escanear' : 'QR ainda não gerado'}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5">
              <Factory size={14} />
              Folha para impressão disponível após gerar o QR
            </p>
          </div>
        </section>
      </div>

      <BatchQrCard
        batchId={batch.id}
        batchCode={batch.code}
        qrCodeUrl={qrCodeUrl}
        publicLink={publicLink}
      />

      <TraceTimeline
        events={events}
        title="Linha do tempo de rastreabilidade"
        description="Eventos auditáveis da cadeia produtiva, da criação à validação."
        className="border-[var(--color-border)] from-[var(--color-page)]"
      />

      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl">
            <BatchQrCard
              batchId={batch.id}
              batchCode={batch.code}
              qrCodeUrl={qrCodeUrl}
              publicLink={publicLink}
            />
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-ink-muted)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
