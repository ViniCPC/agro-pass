export const UF_OPTIONS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const

export interface FarmFormValues {
  name: string
  city: string
  state: string
  latitude: string
  longitude: string
  carNumber: string
  totalAreaHa: string
  // Live admin: the producer account. Demo: a fictitious producer name.
  producerId: string
  producerName: string
}

export const EMPTY_FARM_FORM: FarmFormValues = {
  name: '',
  city: '',
  state: '',
  latitude: '',
  longitude: '',
  carNumber: '',
  totalAreaHa: '',
  producerId: '',
  producerName: '',
}

export type FarmFormErrors = Partial<Record<keyof FarmFormValues, string>>

// Accepts the Brazilian decimal comma ("-18,94").
export function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateFarmForm(
  values: FarmFormValues,
  producer: 'select' | 'name' | 'own',
): FarmFormErrors {
  const errors: FarmFormErrors = {}
  if (!values.name.trim()) errors.name = 'Informe o nome da propriedade.'
  else if (values.name.trim().length > 100) errors.name = 'Use até 100 caracteres.'
  if (!values.city.trim()) errors.city = 'Informe o município.'
  if (!values.state) errors.state = 'Escolha a UF.'

  const latitude = parseDecimal(values.latitude)
  if (latitude === null) errors.latitude = 'Informe a latitude em graus decimais.'
  else if (latitude < -90 || latitude > 90) errors.latitude = 'A latitude vai de -90 a 90.'
  const longitude = parseDecimal(values.longitude)
  if (longitude === null) errors.longitude = 'Informe a longitude em graus decimais.'
  else if (longitude < -180 || longitude > 180) errors.longitude = 'A longitude vai de -180 a 180.'

  if (values.totalAreaHa.trim()) {
    const area = parseDecimal(values.totalAreaHa)
    if (area === null || area <= 0) errors.totalAreaHa = 'A área deve ser um número maior que zero.'
  }

  if (producer === 'select' && !values.producerId) errors.producerId = 'Escolha o produtor responsável.'
  if (producer === 'name' && !values.producerName.trim()) errors.producerName = 'Informe um nome fictício para o produtor.'
  return errors
}
