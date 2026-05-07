import { Sprout } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import type { Farm } from '@/types/api'
import { FarmLocationCell } from './FarmLocationCell'
import { FarmStatusCell } from './FarmStatusCell'
import { FarmValidationCell } from './FarmValidationCell'

const BIOME_BADGE: Record<string, { label: string; cls: string }> = {
  AMAZON: { label: 'Amazonia', cls: 'bg-green-100 text-green-800' },
  CERRADO: { label: 'Cerrado', cls: 'bg-amber-100 text-amber-800' },
  ATLANTIC_FOREST: { label: 'Mata Atlantica', cls: 'bg-teal-100 text-teal-800' },
  CAATINGA: { label: 'Caatinga', cls: 'bg-orange-100 text-orange-800' },
  PAMPA: { label: 'Pampa', cls: 'bg-lime-100 text-lime-800' },
  PANTANAL: { label: 'Pantanal', cls: 'bg-sky-100 text-sky-800' },
}

const TD = 'px-4 py-3 align-top'

function formatHa(ha: number | null) {
  if (!ha) return '-'
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(ha)} ha`
}

function truncateCar(car: string | null) {
  if (!car) return null
  const parts = car.split('-')
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : car.slice(0, 12)
}

interface FarmsTableProps {
  farms: Farm[]
}

const columns = [
  { key: 'farm', label: 'Fazenda' },
  { key: 'location', label: 'Localizacao' },
  { key: 'biome', label: 'Bioma' },
  { key: 'area', label: 'Area' },
  { key: 'amazonLegal', label: 'Amazon. Legal' },
  { key: 'status', label: 'Status' },
  { key: 'eudr', label: 'Validacao EUDR' },
  { key: 'car', label: 'CAR' },
]

export function FarmsTable({ farms }: FarmsTableProps) {
  const navigate = useNavigate()

  if (farms.length === 0) {
    return (
      <EmptyState
        icon={Sprout}
        title="Nenhuma fazenda encontrada"
        description="Ajuste os filtros ou cadastre uma fazenda via Telegram."
      />
    )
  }

  return (
    <DataTable columns={columns}>
      {farms.map((farm) => {
        const biome = farm.biome ? BIOME_BADGE[farm.biome] : null

        return (
          <tr
            key={farm.id}
            onClick={() => navigate(`/farms/${farm.id}`)}
            className="border-b border-[var(--color-border-soft)] last:border-0 hover:bg-[var(--color-page)] transition-colors cursor-pointer"
          >
            <td className={TD}>
              <p className="font-medium text-[var(--color-ink)]">{farm.name}</p>
            </td>

            <td className={TD}>
              <FarmLocationCell
                city={farm.city}
                state={farm.state}
                latitude={farm.latitude}
                longitude={farm.longitude}
              />
            </td>

            <td className={TD}>
              {biome ? (
                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${biome.cls}`}>
                  {biome.label}
                </span>
              ) : (
                <span className="text-[var(--color-ink-subtle)]">-</span>
              )}
            </td>

            <td className={`${TD} tabular-nums text-[var(--color-ink-muted)]`}>
              {formatHa(farm.totalAreaHa)}
            </td>

            <td className={TD}>
              {farm.isAmazonLegal ? (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                  Sim
                </span>
              ) : (
                <span className="text-xs text-[var(--color-ink-subtle)]">Nao</span>
              )}
            </td>

            <td className={TD}>
              <FarmStatusCell status={farm.status} />
            </td>

            <td className={TD}>
              <FarmValidationCell
                status={farm.lastValidationStatus}
                validatedAt={farm.lastValidatedAt}
              />
            </td>

            <td className={TD}>
              {truncateCar(farm.carNumber) ? (
                <span className="rounded bg-[var(--color-border-soft)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-ink-muted)]">
                  {truncateCar(farm.carNumber)}...
                </span>
              ) : (
                <span className="text-xs text-[var(--color-ink-subtle)]">-</span>
              )}
            </td>
          </tr>
        )
      })}
    </DataTable>
  )
}
