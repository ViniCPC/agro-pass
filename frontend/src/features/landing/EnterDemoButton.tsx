import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useDemoMode } from '@/contexts/demo-context'
import { PRIMARY_BUTTON } from './landing-ui'

// Turns the browser demo on and opens the dashboard.
export function LandingEnterDemoButton({
  className = PRIMARY_BUTTON,
  label = 'Explorar demonstração',
}: {
  className?: string
  label?: string
}) {
  const navigate = useNavigate()
  const { enableDemoMode } = useDemoMode()

  return (
    <button
      type="button"
      onClick={() => {
        enableDemoMode()
        navigate('/dashboard')
      }}
      className={className}
    >
      {label}
      <ArrowUpRight size={17} aria-hidden />
    </button>
  )
}
