import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { FormField, INPUT_CLASS } from '@/components/FormField'
import { HomeLogoLink } from '@/components/HomeLogoLink'
import { useAuth } from '@/contexts/auth-context'
import { apiErrorMessage } from '@/lib/api-error'
import { digits, validateSignup, type SignupField as Field, type SignupValues as Values } from '@/features/auth/signup-form'

function signupErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
    if (error.status === 400 || error.status === 409) return apiErrorMessage(error)
    return `O servidor não conseguiu criar a conta (erro ${error.status}). Tente novamente em instantes.`
  }
  return 'Não foi possível falar com o servidor. Ele pode estar fora do ar; enquanto isso, a demonstração funciona sem conta.'
}

export function SignupPage() {
  const { user, signup } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Cooperatives can share a link with the code: /cadastro?convite=<code>
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    phone: '',
    document: '',
    password: '',
    inviteCode: searchParams.get('convite') ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  function input(field: Field) {
    return {
      id: `signup-${field}`,
      name: field,
      value: values[field],
      onChange: (event: { target: { value: string } }) => {
        setValues((current) => ({ ...current, [field]: event.target.value }))
        if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
      },
      'aria-invalid': Boolean(errors[field]),
      'aria-describedby': `signup-${field}-hint signup-${field}-error`,
      className: INPUT_CLASS,
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const found = validateSignup(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setIsSubmitting(true)
    try {
      await signup({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: digits(values.phone),
        document: digits(values.document),
        ...(values.inviteCode.trim() ? { inviteCode: values.inviteCode.trim() } : {}),
      })
      // A new producer has nothing yet: start with the first property.
      navigate('/farms/new', { replace: true })
    } catch (caught) {
      setError(signupErrorMessage(caught))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card-hover)]">
      <div className="flex justify-center">
        <HomeLogoLink />
      </div>
      <div className="mt-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--color-ink)]">Criar conta de produtor</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-subtle)]">
          Cadastre suas propriedades e registre a origem dos seus lotes.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <FormField id="signup-name" label="Nome completo" error={errors.name}>
          <input {...input('name')} autoComplete="name" maxLength={100} />
        </FormField>
        <FormField id="signup-email" label="Email" error={errors.email}>
          <input {...input('email')} type="email" autoComplete="email" maxLength={254} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="signup-phone" label="Telefone" hint="Com DDD." error={errors.phone}>
            <input {...input('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="(64) 99999-0000" />
          </FormField>
          <FormField id="signup-document" label="CPF ou CNPJ" error={errors.document}>
            <input {...input('document')} inputMode="numeric" autoComplete="off" placeholder="Só números ou com pontos" />
          </FormField>
        </div>
        <FormField id="signup-password" label="Senha" hint="Pelo menos 8 caracteres." error={errors.password}>
          <input {...input('password')} type="password" autoComplete="new-password" />
        </FormField>
        <FormField
          id="signup-inviteCode"
          label="Código de convite da cooperativa"
          optional
          hint="Com ele, a cooperativa pode registrar o recebimento e o processamento dos seus lotes."
          error={errors.inviteCode}
        >
          <input {...input('inviteCode')} autoComplete="off" spellCheck={false} className={`${INPUT_CLASS} font-mono`} />
        </FormField>

        {error && (
          <p role="alert" className="rounded-lg bg-[var(--color-red-50)] px-3 py-2 text-sm text-[var(--color-red-700)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:opacity-60"
        >
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </button>
        <p className="text-xs text-[var(--color-ink-subtle)]">
          Contas de cooperativa, operador logístico e administrador são criadas pela equipe AgroPass.
          Ao criar a conta você concorda com os{' '}
          <Link to="/termos" className="underline hover:text-[var(--color-ink)]">termos de uso</Link> e a{' '}
          <Link to="/privacidade" className="underline hover:text-[var(--color-ink)]">política de privacidade</Link>.
        </p>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--color-ink-subtle)]">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-[var(--color-teal-700)] hover:underline">
          Entrar
        </Link>
      </p>
    </section>
  )
}
