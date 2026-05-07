import type { Batch, ProductType, BatchStatus } from '@/types/api'

export interface BatchFilters {
  product: ProductType | ''
  status: BatchStatus | ''
  farmName: string
  onChainOnly: boolean
}

export const DEFAULT_BATCH_FILTERS: BatchFilters = {
  product: '', status: '', farmName: '', onChainOnly: false,
}

export function applyBatchFilters(batches: Batch[], f: BatchFilters): Batch[] {
  return batches.filter(b => {
    if (f.product && b.productType !== f.product) return false
    if (f.status  && b.status      !== f.status)  return false
    if (f.farmName && b.farm.name  !== f.farmName) return false
    if (f.onChainOnly) {
      const onChain = Boolean(b.cnftAddress) || ['MINTED', 'IN_TRANSIT', 'EXPORTED'].includes(b.status)
      if (!onChain) return false
    }
    return true
  })
}

const SELECT_CLASS = [
  'text-sm bg-[var(--color-surface)] border border-[var(--color-border)]',
  'rounded-lg px-3 py-1.5 text-[var(--color-ink-muted)]',
  'outline-none focus:border-[var(--color-teal-600)] cursor-pointer appearance-none',
].join(' ')

interface Props {
  filters: BatchFilters
  onChange: (f: BatchFilters) => void
  batches: Batch[]
}

export function BatchesFilters({ filters, onChange, batches }: Props) {
  const farmNames = Array.from(new Set(batches.map(b => b.farm.name))).sort()
  const hasActive = filters.product || filters.status || filters.farmName || filters.onChainOnly

  function set<K extends keyof BatchFilters>(key: K, val: BatchFilters[K]) {
    onChange({ ...filters, [key]: val })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={SELECT_CLASS} value={filters.product} onChange={e => set('product', e.target.value as BatchFilters['product'])}>
        <option value="">Todos os produtos</option>
        <option value="COFFEE">☕ Café</option>
        <option value="SOY">🌱 Soja</option>
        <option value="CATTLE">🐄 Bovino</option>
        <option value="COCOA">🍫 Cacau</option>
        <option value="PALM_OIL">🌴 Palma</option>
        <option value="RUBBER">🌿 Borracha</option>
        <option value="WOOD">🪵 Madeira</option>
      </select>

      <select className={SELECT_CLASS} value={filters.status} onChange={e => set('status', e.target.value as BatchFilters['status'])}>
        <option value="">Todos os status</option>
        <option value="CREATED">Criado</option>
        <option value="VERIFIED">Verificado</option>
        <option value="MINTED">Mintado</option>
        <option value="IN_TRANSIT">Em trânsito</option>
        <option value="EXPORTED">Exportado</option>
      </select>

      <select className={SELECT_CLASS} value={filters.farmName} onChange={e => set('farmName', e.target.value)}>
        <option value="">Todas as fazendas</option>
        {farmNames.map(name => <option key={name} value={name}>{name}</option>)}
      </select>

      <label className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.onChainOnly}
          onChange={e => set('onChainOnly', e.target.checked)}
          className="w-3.5 h-3.5 accent-[var(--color-teal-600)]"
        />
        Com blockchain
      </label>

      {hasActive && (
        <button
          onClick={() => onChange(DEFAULT_BATCH_FILTERS)}
          className="text-xs text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] underline cursor-pointer"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
