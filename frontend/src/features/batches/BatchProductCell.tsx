import type { ProductType } from '@/types/api'

const PRODUCT_CONFIG: Record<ProductType, { label: string; emoji: string }> = {
  COFFEE:   { label: 'Café',     emoji: '☕' },
  SOY:      { label: 'Soja',     emoji: '🌱' },
  CATTLE:   { label: 'Bovino',   emoji: '🐄' },
  COCOA:    { label: 'Cacau',    emoji: '🍫' },
  PALM_OIL: { label: 'Palma',   emoji: '🌴' },
  RUBBER:   { label: 'Borracha', emoji: '🌿' },
  WOOD:     { label: 'Madeira',  emoji: '🪵' },
}

interface BatchProductCellProps {
  productType: ProductType
  quantity: number
  unit: string
}

export function BatchProductCell({ productType, quantity, unit }: BatchProductCellProps) {
  const config = PRODUCT_CONFIG[productType]
  const qty = new Intl.NumberFormat('pt-BR').format(quantity)

  return (
    <div>
      <p className="text-sm text-[var(--color-ink)]">
        {config.emoji} {config.label}
      </p>
      <p className="text-xs text-[var(--color-ink-subtle)] tabular-nums">
        {qty} {unit}
      </p>
    </div>
  )
}
