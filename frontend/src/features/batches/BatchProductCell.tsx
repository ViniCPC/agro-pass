import { PRODUCT_LABEL } from '@/features/trace/trace.utils'
import type { ProductType } from '@/types/api'

const PRODUCT_EMOJI: Record<ProductType, string> = {
  COFFEE: '☕',
  SOY: '🌱',
  CATTLE: '🐄',
  COCOA: '🍫',
  PALM_OIL: '🌴',
  RUBBER: '🌿',
  WOOD: '🪵',
}

interface BatchProductCellProps {
  productType: ProductType
  quantity: number
  unit: string
}

export function BatchProductCell({ productType, quantity, unit }: BatchProductCellProps) {
  const qty = new Intl.NumberFormat('pt-BR').format(quantity)

  return (
    <div>
      <p className="text-sm text-[var(--color-ink)]">
        {PRODUCT_EMOJI[productType]} {PRODUCT_LABEL[productType] ?? productType}
      </p>
      <p className="text-xs text-[var(--color-ink-subtle)] tabular-nums">
        {qty} {unit}
      </p>
    </div>
  )
}
