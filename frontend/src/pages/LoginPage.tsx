import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { useAuth } from '@/contexts/auth-context'

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
    } catch {
      setError('Email ou senha inválidos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card-hover)]">
      <AppLogo className="justify-center" />
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
          <p className="rounded-lg bg-[var(--color-red-50)] px-3 py-2 text-sm text-[var(--color-red-700)]">
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

      <p className="mt-5 text-center text-xs text-[var(--color-ink-subtle)]">
        Quer explorar sem conta?{' '}
        <Link to="/demo" className="font-medium text-[var(--color-teal-700)] hover:underline">
          Abrir demonstração
        </Link>
      </p>
    </section>
  )
}
