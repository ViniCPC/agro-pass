import { ShieldCheck, GitBranch, Link2, QrCode } from 'lucide-react'
import { DemoHero } from '@/features/demo/DemoHero'
import { DemoFeatureCard } from '@/features/demo/DemoFeatureCard'

const features = [
  {
    icon: ShieldCheck,
    title: 'Validação EUDR',
    description: 'Conformidade automática com cruzamento de dados MapBiomas, PRODES e Hansen.',
    accent: 'green',
  },
  {
    icon: GitBranch,
    title: 'Cadeia rastreável',
    description: 'Eventos do campo à exportação: colheita, cooperativa, transporte e saída.',
    accent: 'teal',
  },
  {
    icon: Link2,
    title: 'Prova blockchain',
    description: 'cNFT Solana com hash de evidências para auditoria imutável e pública.',
    accent: 'teal',
  },
  {
    icon: QrCode,
    title: 'QR público',
    description: 'QR Code por lote acessível por qualquer importador ou auditoria externa.',
    accent: 'default',
  },
] as const

export function DemoEntryPage() {
  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-2xl py-8">
      <DemoHero />

      <div className="w-full grid grid-cols-2 gap-4 sm:grid-cols-4">
        {features.map((f) => (
          <DemoFeatureCard
            key={f.title}
            icon={f.icon}
            title={f.title}
            description={f.description}
            accent={f.accent}
          />
        ))}
      </div>
    </div>
  )
}
