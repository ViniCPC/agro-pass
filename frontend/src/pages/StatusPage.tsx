import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, CircleAlert, Loader2, RotateCw, WifiOff } from 'lucide-react'
import { API_BASE_URL } from '@/api/client'
import { LegalLayout } from '@/features/landing/LegalLayout'
import { formatDateTime } from '@/features/trace/trace.utils'

interface ServiceHealth {
  status: 'ok' | 'error'
  message?: string
}

interface HealthResult {
  status: 'ok' | 'degraded'
  services: { database: ServiceHealth; solana: ServiceHealth }
  checkedAt: string
}

// /health answers 503 with the same JSON body when the database is down.
async function fetchHealth(): Promise<HealthResult> {
  const response = await fetch(`${API_BASE_URL}/health`)
  return (await response.json()) as HealthResult
}

function Row({ label, health }: { label: string; health: ServiceHealth }) {
  const ok = health.status === 'ok'
  return (
    <li className="flex items-start justify-between gap-4 border-b border-[var(--color-sand-100)] py-3 last:border-0">
      <div>
        <p className="font-medium text-[var(--color-forest-900)]">{label}</p>
        {health.message && <p className="text-xs text-[var(--color-ink-subtle)]">{health.message}</p>}
      </div>
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${ok ? 'text-[var(--color-green-700)]' : 'text-[var(--color-red-700)]'}`}>
        {ok ? <CheckCircle2 size={15} aria-hidden /> : <CircleAlert size={15} aria-hidden />}
        {ok ? 'Operacional' : 'Com falha'}
      </span>
    </li>
  )
}

export function StatusPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['public-health'],
    queryFn: fetchHealth,
    retry: false,
    staleTime: 0,
  })

  return (
    <LegalLayout title="Status do sistema">
      {isLoading ? (
        <p className="inline-flex items-center gap-2" aria-busy="true">
          <Loader2 size={15} className="animate-spin" aria-hidden />
          Consultando a API…
        </p>
      ) : isError || !data ? (
        <div role="status" className="space-y-2">
          <p className="inline-flex items-center gap-2 font-semibold text-[var(--color-forest-900)]">
            <WifiOff size={16} aria-hidden />A API não respondeu.
          </p>
          <p>
            A demonstração e os passaportes de exemplo funcionam sem a API. Login e dados reais
            dependem dela.
          </p>
        </div>
      ) : (
        <div role="status" className="space-y-4">
          <p className="text-base font-semibold text-[var(--color-forest-900)]">
            {data.status === 'ok' ? 'Todos os sistemas operacionais.' : 'Operação parcial.'}
          </p>
          <ul>
            <Row label="Aplicação e banco de dados" health={data.services.database} />
            <Row label="Prova em blockchain" health={data.services.solana} />
          </ul>
          <p className="text-xs text-[var(--color-ink-subtle)]">Verificado em {formatDateTime(data.checkedAt)}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-sand-200)] px-4 text-sm font-semibold text-[var(--color-forest-900)] hover:border-[var(--color-leaf-600)] disabled:opacity-60"
      >
        <RotateCw size={14} className={isFetching ? 'animate-spin' : ''} aria-hidden />
        Verificar novamente
      </button>
    </LegalLayout>
  )
}
