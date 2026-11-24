import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FlaskConical, ScanLine } from 'lucide-react'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { TraceBatchSummary } from '@/features/trace/TraceBatchSummary'
import { TraceBlockchainProofCard } from '@/features/trace/TraceBlockchainProofCard'
import { TraceDocumentsPanel } from '@/features/trace/TraceDocumentsPanel'
import { TraceFarmCard } from '@/features/trace/TraceFarmCard'
import { TraceHero } from '@/features/trace/TraceHero'
import { TraceIntegrityCard } from '@/features/trace/TraceIntegrityCard'
import { TraceTimeline } from '@/features/trace/TraceTimeline'
import { TraceTrustFooter } from '@/features/trace/TraceTrustFooter'
import { isPassportNotFound, useTraceByCode } from '@/hooks/useTraceByCode'
import { DEMO_SHOWCASE_CODE, isDemoPublicCode } from '@/mocks/demo-store'

function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}

function ExamplePassportLink() {
  return (
    <Link
      to={`/trace/${DEMO_SHOWCASE_CODE}`}
      className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[var(--color-teal-700)] hover:underline"
    >
      <ScanLine size={14} />
      Ver passaporte de exemplo
    </Link>
  )
}

export function TracePage() {
  // React Router already decodes the param.
  const { publicCode: rawCode } = useParams<{ publicCode: string }>()
  const publicCode = rawCode?.trim() || null
  const isDemo = publicCode ? isDemoPublicCode(publicCode) : false
  const { data, isLoading, error, refetch } = useTraceByCode(publicCode)

  useDocumentTitle(data ? `Lote ${data.batch.code} · Passaporte AgroPass` : 'Passaporte AgroPass')

  if (!publicCode) {
    return (
      <ErrorState
        title="Link de passaporte inválido"
        description="O endereço não contém o código do lote."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4" aria-busy="true">
        <LoadingState rows={3} />
        <LoadingState rows={5} />
      </div>
    )
  }

  if (error || !data) {
    const notFound = isPassportNotFound(error)
    return (
      <div className="mx-auto w-full max-w-xl space-y-3 text-center">
        <ErrorState
          title={notFound ? 'Passaporte não encontrado' : 'Não foi possível carregar o passaporte'}
          description={
            notFound
              ? isDemo
                ? `O lote de demonstração ${publicCode} não existe neste navegador. Lotes criados na demo ficam só no aparelho em que foram criados.`
                : `Não há passaporte público para o código ${publicCode}. Ele pode ter sido digitado errado ou ainda não ter sido publicado.`
              : 'Verifique sua conexão com a internet e tente novamente.'
          }
          onRetry={notFound ? undefined : () => refetch()}
        />
        <ExamplePassportLink />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {isDemo && (
        <p className="flex items-start gap-2 rounded-[var(--radius-card)] border border-[var(--color-amber-100)] bg-[var(--color-amber-50)] px-3 py-2.5 text-xs leading-5 text-[var(--color-amber-700)]">
          <FlaskConical size={14} className="mt-0.5 shrink-0" />
          Passaporte de demonstração: dados fictícios, carregados sem servidor. Os hashes são reais e
          calculados como no sistema em produção.
        </p>
      )}

      <TraceHero data={data} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TraceBatchSummary data={data} />
        <TraceIntegrityCard integrity={data.integrity} />
      </div>

      <TraceFarmCard data={data} />

      <TraceTimeline
        events={data.traceEvents}
        title="Linha do tempo"
        description="Cada etapa com o responsável, o local e o hash que a encadeia à anterior."
        showExplorerLinks={!isDemo}
        // Each card already shows its date; day dividers only add length on phones.
        groupByDayFrom={Number.POSITIVE_INFINITY}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TraceDocumentsPanel data={data} />
        <TraceBlockchainProofCard data={data} isDemo={isDemo} />
      </div>

      <TraceTrustFooter />
    </div>
  )
}
