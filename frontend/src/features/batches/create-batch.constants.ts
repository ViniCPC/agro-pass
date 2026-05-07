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
  unit: 'sacas',
  harvestDate: '',
}

export const PRODUCT_OPTIONS: Array<{ value: ProductType; label: string }> = [
  { value: 'COFFEE', label: 'Cafe' },
  { value: 'SOY', label: 'Soja' },
  { value: 'CATTLE', label: 'Bovino' },
  { value: 'COCOA', label: 'Cacau' },
  { value: 'PALM_OIL', label: 'Palma' },
  { value: 'RUBBER', label: 'Borracha' },
  { value: 'WOOD', label: 'Madeira' },
]
