import { PRODUCT_LABEL } from '@/features/trace/trace.utils'
import type { ProductType } from '@/types/api'

export interface CreateBatchFormValues {
  farmId: string
  productType: ProductType | ''
  quantity: string
  unit: string
  harvestDate: string
}

export const DEFAULT_CREATE_BATCH_FORM: CreateBatchFormValues = {
  farmId: '',
  productType: '',
  quantity: '',
  // Empty on purpose: a prefilled value looked like a placeholder, and typing
  // over it produced "sacassacas".
  unit: '',
  harvestDate: '',
}

export const PRODUCT_OPTIONS = (Object.keys(PRODUCT_LABEL) as ProductType[]).map((value) => ({
  value,
  label: PRODUCT_LABEL[value],
}))

// Usual units per product: the unit field's example and suggestions.
export const UNIT_EXAMPLE: Record<ProductType, string> = {
  COFFEE: 'sacas de 60 kg',
  SOY: 'toneladas',
  CATTLE: 'cabeças',
  COCOA: 'kg',
  PALM_OIL: 'toneladas',
  RUBBER: 'kg',
  WOOD: 'm³',
}

export const UNIT_SUGGESTIONS = ['sacas de 60 kg', 'sacas', 'kg', 'toneladas', 'arrobas', 'cabeças', 'litros', 'm³']
