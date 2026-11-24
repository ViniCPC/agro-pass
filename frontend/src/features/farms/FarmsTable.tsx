import { Sprout } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import type { Farm } from '@/types/api'
import { FarmLocationCell } from './FarmLocationCell'

const TD = 'px-4 py-3 align-top'

function formatArea(area: number | null) {
  if (area == null) return '-'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(area) + ' ha'
}

function formatCar(carNumber: string | null) {
  if (!carNumber) return '-'
  return carNumber.length > 20 ? carNumber.slice(0, 20) + '…' : carNumber
}

const columns = [
  { key: 'farm', label: 'Fazenda' },
  { key: 'location', label: 'Localização' },
  { key: 'area', label: 'Área' },
  { key: 'car', label: 'CAR' },
]

export function FarmsTable({ farms }: { farms: Farm[] }) {
  const navigate = useNavigate()

  if (farms.length === 0) {
    return (
      <EmptyState
        icon={Sprout}
        title="Nenhuma fazenda encontrada"
        description="Ajuste os filtros ou cadastre uma propriedade."
      />
    )
  }

  return (
    <DataTable columns={columns}>
      {farms.map((farm) => (
        <tr
          key={farm.id}
          onClick={() => navigate('/farms/' + farm.id)}
          className="cursor-pointer border-b border-[var(--color-border-soft)] transition-colors last:border-0 hover:bg-[var(--color-page)]"
        >
          <td className={TD}>
            <p className="font-medium text-[var(--color-ink)]">{farm.name}</p>
            {farm.producerName && (
              <p className="mt-0.5 text-xs text-[var(--color-ink-subtle)]">{farm.producerName}</p>
            )}
          </td>
          <td className={TD}>
            <FarmLocationCell
              city={farm.city}
              state={farm.state}
              latitude={farm.latitude}
              longitude={farm.longitude}
            />
          </td>
          <td className={TD + ' tabular-nums text-[var(--color-ink-muted)]'}>
            {formatArea(farm.totalAreaHa)}
          </td>
          <td className={TD}>
            <span className="font-mono text-xs text-[var(--color-ink-muted)]">
              {formatCar(farm.carNumber)}
            </span>
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
