import { AppLogo } from '@/components/AppLogo'
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
          Do campo ao exportador. Valide conformidade EUDR automaticamente,
          gere passaportes digitais de colheita e registre provas imutáveis
          na blockchain Solana.
        </p>
      </div>

      <EnterDemoButton />
    </div>
  )
}
