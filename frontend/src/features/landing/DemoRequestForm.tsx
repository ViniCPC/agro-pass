import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { demoRequestsApi } from '@/api/demoRequestsApi'
import { apiErrorMessage } from '@/lib/api-error'
import { PROFILE_OPTIONS, type DemoRequestProfile } from './landing-content'
import {
  EMPTY_DEMO_REQUEST as EMPTY,
  FIELD_ORDER,
  validateDemoRequest,
  type DemoRequestErrors as Errors,
  type DemoRequestValues as Values,
} from './demo-request-validation'
import { DARK_BUTTON } from './landing-ui'

const INPUT =
  'w-full rounded-[3px] border bg-white px-3 py-2.5 text-sm text-carbon outline-none transition-colors focus:border-carbon focus:ring-2 focus:ring-carbon/10'

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-mono text-[11px] uppercase tracking-[0.12em] text-carbon-700">
        {label}
        {hint && <span className="ml-1 font-normal text-carbon-500">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-[var(--color-red-700)]">
          {error}
        </p>
      )}
    </div>
  )
}

export function DemoRequestForm() {
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const invalid = (key: keyof Values) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `demo-${key}-error` : undefined,
  })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setServerError(null)
    const found = validateDemoRequest(values)
    setErrors(found)
    const firstInvalid = FIELD_ORDER.find((key) => found[key])
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#demo-${firstInvalid}`)?.focus()
      return
    }

    setStatus('sending')
    try {
      await demoRequestsApi.create({
        name: values.name.trim(),
        company: values.company.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        profile: values.profile as DemoRequestProfile,
        consent: values.consent,
        website: values.website || undefined,
      })
      setSentTo(values.email.trim())
      setValues(EMPTY)
      setStatus('sent')
    } catch (error) {
      setStatus('idle')
      setServerError(
        error instanceof ApiError
          ? apiErrorMessage(error)
          : 'Não foi possível enviar agora. Verifique sua conexão e tente novamente em instantes.',
      )
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="rounded-[6px] bg-white p-6 sm:p-8">
        <CheckCircle2 size={28} className="text-deep" aria-hidden />
        <p className="mt-3 font-display text-xl text-carbon">Pedido recebido.</p>
        <p className="mt-1 text-sm text-carbon-700">
          Vamos entrar em contato pelo e-mail {sentTo} para combinar a demonstração.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm font-semibold text-carbon underline underline-offset-[3px]"
        >
          Enviar outro pedido
        </button>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      id="formulario-demo"
      noValidate
      onSubmit={handleSubmit}
      aria-label="Solicitar demonstração"
      className="relative scroll-mt-24 space-y-4 rounded-[6px] bg-white p-5 sm:p-7"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="demo-name" label="Nome" error={errors.name}>
          <input id="demo-name" autoComplete="name" value={values.name} onChange={(e) => set('name', e.target.value)} className={`${INPUT} ${errors.name ? 'border-[var(--color-red-600)]' : 'border-carbon/30'}`} {...invalid('name')} />
        </Field>
        <Field id="demo-company" label="Empresa ou propriedade" error={errors.company}>
          <input id="demo-company" autoComplete="organization" value={values.company} onChange={(e) => set('company', e.target.value)} className={`${INPUT} ${errors.company ? 'border-[var(--color-red-600)]' : 'border-carbon/30'}`} {...invalid('company')} />
        </Field>
        <Field id="demo-email" label="E-mail" error={errors.email}>
          <input id="demo-email" type="email" autoComplete="email" value={values.email} onChange={(e) => set('email', e.target.value)} className={`${INPUT} ${errors.email ? 'border-[var(--color-red-600)]' : 'border-carbon/30'}`} {...invalid('email')} />
        </Field>
        <Field id="demo-phone" label="Telefone" hint="(opcional)" error={errors.phone}>
          <input id="demo-phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} className={`${INPUT} ${errors.phone ? 'border-[var(--color-red-600)]' : 'border-carbon/30'}`} {...invalid('phone')} />
        </Field>
      </div>

      <Field id="demo-profile" label="Perfil" error={errors.profile}>
        <select id="demo-profile" value={values.profile} onChange={(e) => set('profile', e.target.value as Values['profile'])} className={`${INPUT} ${errors.profile ? 'border-[var(--color-red-600)]' : 'border-carbon/30'}`} {...invalid('profile')}>
          <option value="">Selecione</option>
          {PROFILE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Honeypot: invisible to people, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="demo-website">Site</label>
        <input id="demo-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set('website', e.target.value)} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-carbon-700">
          <input
            id="demo-consent"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => set('consent', e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-carbon"
            {...invalid('consent')}
          />
          <span>
            Autorizo o contato da equipe AgroPass sobre esta demonstração, conforme a{' '}
            <Link to="/privacidade" className="font-medium text-carbon underline">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p id="demo-consent-error" className="mt-1.5 text-xs text-[var(--color-red-700)]">
            {errors.consent}
          </p>
        )}
      </div>

      <div aria-live="polite">
        {serverError && (
          <p role="alert" className="rounded-lg bg-[var(--color-red-50)] px-3 py-2 text-sm text-[var(--color-red-700)]">
            {serverError}
          </p>
        )}
      </div>

      <button type="submit" disabled={status === 'sending'} className={`${DARK_BUTTON} w-full disabled:opacity-60`}>
        {status === 'sending' && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {status === 'sending' ? 'Enviando…' : 'Enviar pedido de demonstração'}
      </button>
    </form>
  )
}
