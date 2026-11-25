import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { HomeLogoLink } from '@/components/HomeLogoLink'
import { useAuth } from '@/contexts/auth-context'
import { ROLE_DUTIES, ROLE_TITLE } from '@/features/auth/roles'
import type { UserRole } from '@/types/api'

// Accounts created by the seed (backend/prisma/seed.ts), each already linked
// to the producer, cooperative or batches it works on.
const TEST_ACCOUNTS: Array<{ role: UserRole; email: string }> = [
  { role: 'PRODUCER', email: 'produtor@agropass.local' },
  { role: 'COOPERATIVE', email: 'cooperativa@agropass.local' },
  { role: 'OPERATOR', email: 'operador@agropass.local' },
  { role: 'ADMIN', email: 'admin@agropass.local' },
]

// Shown in development, or where the deploy says the seed accounts exist.
// The password is shown only if configured: in production the seed requires
// its own DEMO_PASSWORD.
const SHOW_TEST_ACCOUNTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_TEST_ACCOUNTS === 'true'
const TEST_PASSWORD =
  (import.meta.env.VITE_TEST_ACCOUNTS_PASSWORD as string | undefined) || (import.meta.env.DEV ? 'AgroPass@2026' : '')

function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Email ou senha inválidos.'
    if (error.status === 429) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
    if (error.status === 400) return 'Confira o email e a senha: o formato não foi aceito.'
    return `O servidor não conseguiu concluir o login (erro ${error.status}). Tente novamente em instantes.`
  }
  // fetch rejects without a response: API offline, wrong URL or CORS.
  return 'Não foi possível falar com o servidor. Ele pode estar fora do ar; enquanto isso, a demonstração funciona sem conta.'
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)
      const destination = (location.state as { from?: string } | null)?.from
      navigate(destination ?? '/dashboard', { replace: true })
    } catch (caught) {
      setError(loginErrorMessage(caught))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card-hover)]">
      <div className="flex justify-center">
        <HomeLogoLink />
      </div>
      <div className="mt-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--color-ink)]">Entrar no AgroPass</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-subtle)]">
          Acesse os passaportes vinculados à sua operação.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1.5 text-sm font-medium text-[var(--color-ink)]">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2.5 outline-none focus:border-[var(--color-teal-600)]"
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-[var(--color-ink)]">
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2.5 outline-none focus:border-[var(--color-teal-600)]"
          />
        </label>

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
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {SHOW_TEST_ACCOUNTS && (
        <div className="mt-6 border-t border-[var(--color-border-soft)] pt-5">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">Contas de teste</h2>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            Uma por papel; produtor e cooperativa já estão vinculados à Fazenda Santa Fé. Cada papel registra etapas diferentes.
            {TEST_PASSWORD ? (
              <>
                {' '}Senha: <code className="font-mono text-[var(--color-ink-muted)]">{TEST_PASSWORD}</code>
              </>
            ) : (
              ' A senha é a DEMO_PASSWORD definida no backend.'
            )}
          </p>
          <ul className="mt-3 space-y-1.5">
            {TEST_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    if (TEST_PASSWORD) setPassword(TEST_PASSWORD)
                    setError(null)
                  }}
                  className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-left hover:border-[var(--color-teal-600)]"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--color-ink)]">{ROLE_TITLE[account.role]}</span>
                    <span className="truncate font-mono text-[11px] text-[var(--color-ink-subtle)]">{account.email}</span>
                  </span>
                  <span className="block text-xs text-[var(--color-ink-subtle)]">{ROLE_DUTIES[account.role]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 text-center text-xs text-[var(--color-ink-subtle)]">
        Quer explorar sem conta?{' '}
        <Link to="/demo" className="font-medium text-[var(--color-teal-700)] hover:underline">
          Abrir demonstração
        </Link>
      </p>
    </section>
  )
}
