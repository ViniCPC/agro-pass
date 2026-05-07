import { Package } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import type { Batch } from '@/types/api'
import { BatchBlockchainCell } from './BatchBlockchainCell'
import { BatchProductCell } from './BatchProductCell'
import { BatchQrCell } from './BatchQrCell'
import { BatchStatusCell } from './BatchStatusCell'

const TD = 'px-4 py-3 align-top'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

interface BatchesTableProps {
  batches: Batch[]
}

const columns = [
  { key: 'trace', label: 'Rastrear' },
  { key: 'product', label: 'Produto' },
  { key: 'farm', label: 'Fazenda' },
  { key: 'status', label: 'Status' },
  { key: 'blockchain', label: 'Blockchain' },
  { key: 'harvest', label: 'Colheita' },
  { key: 'createdAt', label: 'Criado em' },
]

export function BatchesTable({ batches }: BatchesTableProps) {
  if (batches.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Nenhum lote encontrado"
        description="Ajuste os filtros ou crie um lote via Telegram."
      />
    )
  }

  return (
    <DataTable columns={columns}>
      {batches.map((batch) => (
        <tr
          key={batch.id}
          className="border-b border-[var(--color-border-soft)] last:border-0 hover:bg-[var(--color-page)] transition-colors"
        >
          <td className={TD}>
            <BatchQrCell id={batch.id} code={batch.code} />
          </td>
          <td className={TD}>
            <BatchProductCell
              productType={batch.productType}
              quantity={batch.quantity}
              unit={batch.unit}
            />
          </td>
          <td className={`${TD} text-sm text-[var(--color-ink-muted)]`}>
            {batch.farm.name}
          </td>
          <td className={TD}>
            <BatchStatusCell status={batch.status} />
          </td>
          <td className={TD}>
            <BatchBlockchainCell
              cnftAddress={batch.cnftAddress}
              mintTxHash={batch.mintTxHash}
              status={batch.status}
            />
          </td>
          <td className={`${TD} text-xs tabular-nums text-[var(--color-ink-muted)]`}>
            {batch.harvestDate ? formatDate(batch.harvestDate) : '-'}
          </td>
          <td className={`${TD} text-xs tabular-nums text-[var(--color-ink-subtle)]`}>
            {formatDate(batch.createdAt)}
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
