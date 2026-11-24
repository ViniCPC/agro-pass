import type { DemoRequestProfile } from './landing-content'

export interface DemoRequestValues {
  name: string
  company: string
  email: string
  phone: string
  profile: DemoRequestProfile | ''
  consent: boolean
  website: string
}

export type DemoRequestErrors = Partial<Record<keyof DemoRequestValues, string>>

export const EMPTY_DEMO_REQUEST: DemoRequestValues = { name: '', company: '', email: '', phone: '', profile: '', consent: false, website: '' }
export const FIELD_ORDER: Array<keyof DemoRequestValues> = ['name', 'company', 'email', 'phone', 'profile', 'consent']

export function validateDemoRequest(values: DemoRequestValues): DemoRequestErrors {
  const errors: DemoRequestErrors = {}
  if (values.name.trim().length < 2) errors.name = 'Informe seu nome.'
  if (values.company.trim().length < 2) errors.company = 'Informe a empresa ou propriedade.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Informe um e-mail válido.'
  if (values.phone.trim() && !/^[0-9+()\-\s]{8,30}$/.test(values.phone.trim())) {
    errors.phone = 'Informe um telefone válido ou deixe em branco.'
  }
  if (!values.profile) errors.profile = 'Selecione o seu perfil.'
  if (!values.consent) errors.consent = 'Autorize o contato para enviar o pedido.'
  return errors
}
