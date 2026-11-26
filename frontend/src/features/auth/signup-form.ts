export type SignupField = 'name' | 'email' | 'phone' | 'document' | 'password' | 'inviteCode'
export type SignupValues = Record<SignupField, string>

export const digits = (value: string) => value.replace(/\D/g, '')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Same rules as the API's SignupDto, checked before sending.
export function validateSignup(values: SignupValues): Partial<Record<SignupField, string>> {
  const errors: Partial<Record<SignupField, string>> = {}
  if (!values.name.trim()) errors.name = 'Informe seu nome.'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Informe um email válido.'
  if (digits(values.phone).length !== 11) errors.phone = 'Use DDD + número com 9 dígitos, ex.: (64) 99999-0000.'
  if (![11, 14].includes(digits(values.document).length)) errors.document = 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).'
  if (values.password.length < 8) errors.password = 'A senha precisa de pelo menos 8 caracteres.'
  else if (values.password.length > 72) errors.password = 'A senha pode ter no máximo 72 caracteres.'
  if (values.inviteCode.trim() && !UUID.test(values.inviteCode.trim())) {
    errors.inviteCode = 'Código inválido. Copie o código completo enviado pela cooperativa.'
  }
  return errors
}
