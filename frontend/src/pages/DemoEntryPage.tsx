import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapPinCheck, GitBranch, Link2, QrCode } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import { SERVER_DEMO } from '@/features/demo/useEnterDemo'
import { DemoHero } from '@/features/demo/DemoHero'
import { DemoFeatureCard } from '@/features/demo/DemoFeatureCard'

const features = [
  {
    icon: MapPinCheck,
    title: 'Origem registrada',
    description: 'Fazenda, produtor e lote vinculados desde o primeiro registro.',
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
    description: SERVER_DEMO
      ? 'Ao encerrar o lote, o hash final da cadeia é registrado como prova verificável.'
      : 'Simulação de prova Solana com hashes reais, sem enviar transações à rede.',
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
  const location = useLocation()
  const navigate = useNavigate()
  const { disableDemoMode } = useDemoMode()
  const { demoSession, logout } = useAuth()
  const leaveDemo = (location.state as { leaveDemo?: boolean } | null)?.leaveDemo === true

  // "Sair da demo" lands here first, outside the auth guard, and only then
  // switches the demo off. The flag is cleared so a reload does not repeat it.
  useEffect(() => {
    if (!leaveDemo) return
    disableDemoMode()
    // A server visit ends too: its accounts are forgotten on this device.
    if (demoSession) logout()
    navigate(location.pathname, { replace: true, state: null })
  }, [leaveDemo, disableDemoMode, demoSession, logout, navigate, location.pathname])

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
