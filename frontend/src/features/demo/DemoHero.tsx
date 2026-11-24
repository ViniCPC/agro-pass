import { Link } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { DEMO_SHOWCASE_CODE } from '@/mocks/demo-store'
import { EnterDemoButton } from './EnterDemoButton'

export function DemoHero() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <AppLogo className="justify-center" />

      <div className="space-y-3 max-w-lg">
        <h1 className="text-3xl font-semibold text-[var(--color-ink)] tracking-tight leading-tight">
          Rastreabilidade digital<br />
          para lotes agro
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
          Do campo ao exportador. Registre a origem, acompanhe cada etapa da
          cadeia e publique provas verificáveis na blockchain Solana.
        </p>
      </div>

      <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <EnterDemoButton />
        <Link
          to={`/trace/${DEMO_SHOWCASE_CODE}`}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
        >
          <ScanLine size={15} strokeWidth={2.25} />
          Ver passaporte de exemplo
        </Link>
      </div>

      <p className="max-w-md text-xs text-[var(--color-ink-subtle)]">
        A demonstração funciona sem servidor: os dados são fictícios e ficam
        no seu navegador.
      </p>
    </div>
  )
}
