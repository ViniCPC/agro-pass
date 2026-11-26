import { Package } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { Farm } from '@/types/api'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import { formatHarvestDate } from '@/features/trace/trace.utils'
import { batchCodeYear, previewDemoBatchCode } from '@/mocks/demo-store'
import {
  PRODUCT_OPTIONS,
  type CreateBatchFormValues,
} from './create-batch.constants'

interface BatchPreviewCardProps {
  values: CreateBatchFormValues
  selectedFarm: Farm | null
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-[var(--color-ink-subtle)]">{label}</span>
      <span className="text-right text-[var(--color-ink)]">{value}</span>
    </div>
  )
}

function getProductLabel(productType: CreateBatchFormValues['productType']) {
  if (!productType) return '-'
  return PRODUCT_OPTIONS.find((option) => option.value === productType)?.label ?? productType
}

export function BatchPreviewCard({
  values,
  selectedFarm,
}: BatchPreviewCardProps) {
  const quantityLabel = values.quantity
    ? `${new Intl.NumberFormat('pt-BR').format(Number(values.quantity))} ${values.unit || ''}`.trim()
    : '-'
  const farmLabel = selectedFarm
    ? `${selectedFarm.name} - ${selectedFarm.state}`
    : '-'
  const harvestLabel = formatHarvestDate(values.harvestDate)
  const { isDemoMode } = useDemoMode()
  const { demoSession } = useAuth()
  const harvestDate = values.harvestDate || undefined
  // The offline demo knows the exact next code; the API assigns the sequence
  // on save, with its own DEMO- series for server demo visits.
  const code = isDemoMode
    ? previewDemoBatchCode(harvestDate)
    : `${demoSession ? 'DEMO' : 'AGP'}-${batchCodeYear(harvestDate)}-····`

  return (
    <aside className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-page)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-[var(--color-teal-50)] p-2 text-[var(--color-teal-700)]">
          <Package size={16} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            Pré-visualização do lote
          </h2>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Prévia em tempo real antes de enviar
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Código
        </p>
        <p className="mt-1 font-mono text-sm text-[var(--color-ink)]">{code}</p>
        {!isDemoMode && (
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            O número é atribuído quando o lote é criado.
          </p>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3">
        <PreviewRow label="Produto" value={getProductLabel(values.productType)} />
        <PreviewRow label="Quantidade" value={quantityLabel} />
        <PreviewRow label="Fazenda" value={farmLabel} />
        <PreviewRow label="Data da colheita" value={harvestLabel} />
        <div className="mt-2 pt-2">
          <StatusBadge status="CREATED" />
        </div>
      </div>
    </aside>
  )
}
