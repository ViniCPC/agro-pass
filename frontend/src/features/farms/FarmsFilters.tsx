import type { Farm, FarmStatus, ValidationStatus, Biome } from '@/types/api'

export interface FarmFilters {
  state: string
  farmStatus: FarmStatus | ''
  validationStatus: ValidationStatus | ''
  biome: Biome | ''
  amazonLegal: 'true' | 'false' | ''
}

export const DEFAULT_FILTERS: FarmFilters = {
  state: '', farmStatus: '', validationStatus: '', biome: '', amazonLegal: '',
}

export function applyFarmFilters(farms: Farm[], f: FarmFilters): Farm[] {
  return farms.filter(farm => {
    if (f.state          && farm.state  !== f.state)                               return false
    if (f.farmStatus     && farm.status !== f.farmStatus)                          return false
    if (f.validationStatus) {
      if (f.validationStatus === 'PENDING' && farm.lastValidationStatus)           return false
      if (f.validationStatus !== 'PENDING' && farm.lastValidationStatus !== f.validationStatus) return false
    }
    if (f.biome          && farm.biome  !== f.biome)                               return false
    if (f.amazonLegal    && String(farm.isAmazonLegal) !== f.amazonLegal)          return false
    return true
  })
}

const SELECT_CLASS = [
  'text-sm bg-[var(--color-surface)] border border-[var(--color-border)]',
  'rounded-lg px-3 py-1.5 text-[var(--color-ink-muted)]',
  'outline-none focus:border-[var(--color-teal-600)] cursor-pointer',
  'appearance-none pr-7',
].join(' ')

interface Props {
  filters: FarmFilters
  onChange: (f: FarmFilters) => void
  farms: Farm[]
}

function set<K extends keyof FarmFilters>(
  filters: FarmFilters,
  key: K,
  val: FarmFilters[K],
  onChange: Props['onChange'],
) {
  onChange({ ...filters, [key]: val })
}

export function FarmsFilters({ filters, onChange, farms }: Props) {
  const states = Array.from(new Set(farms.map(f => f.state))).sort()
  const biomes = Array.from(new Set(farms.flatMap(f => f.biome ? [f.biome] : []))).sort()

  const BIOME_LABEL: Record<string, string> = {
    AMAZON: 'Amazônia', CERRADO: 'Cerrado', ATLANTIC_FOREST: 'Mata Atlântica',
    CAATINGA: 'Caatinga', PAMPA: 'Pampa', PANTANAL: 'Pantanal',
  }

  const hasActive = Object.values(filters).some(v => v !== '')

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Estado */}
      <select className={SELECT_CLASS} value={filters.state} onChange={e => set(filters, 'state', e.target.value, onChange)}>
        <option value="">Todos os estados</option>
        {states.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Status fazenda */}
      <select className={SELECT_CLASS} value={filters.farmStatus} onChange={e => set(filters, 'farmStatus', e.target.value as FarmFilters['farmStatus'], onChange)}>
        <option value="">Status da fazenda</option>
        <option value="APPROVED">Aprovada</option>
        <option value="PENDING">Pendente</option>
        <option value="REJECTED">Rejeitada</option>
      </select>

      {/* Validação EUDR */}
      <select className={SELECT_CLASS} value={filters.validationStatus} onChange={e => set(filters, 'validationStatus', e.target.value as FarmFilters['validationStatus'], onChange)}>
        <option value="">Validação EUDR</option>
        <option value="COMPLIANT">Compliant</option>
        <option value="NEEDS_REVIEW">Em revisão</option>
        <option value="NON_COMPLIANT">Não conforme</option>
        <option value="PENDING">Sem validação</option>
      </select>

      {/* Bioma */}
      <select className={SELECT_CLASS} value={filters.biome} onChange={e => set(filters, 'biome', e.target.value as FarmFilters['biome'], onChange)}>
        <option value="">Todos os biomas</option>
        {biomes.map(b => <option key={b} value={b}>{BIOME_LABEL[b] ?? b}</option>)}
      </select>

      {/* Amazônia Legal */}
      <select className={SELECT_CLASS} value={filters.amazonLegal} onChange={e => set(filters, 'amazonLegal', e.target.value as FarmFilters['amazonLegal'], onChange)}>
        <option value="">Amazônia Legal</option>
        <option value="true">Sim</option>
        <option value="false">Não</option>
      </select>

      {hasActive && (
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-xs text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] underline cursor-pointer"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
