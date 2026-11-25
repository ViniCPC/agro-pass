import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import { cn } from '@/lib/utils'
import { AppLogo } from './AppLogo'

// "/" sends signed-in users and the demo to the dashboard, so they reach the
// landing page through "/inicio" instead.
const LANDING_PATHS = ['/', '/inicio']

export function HomeLogoLink({
  className,
  logoClassName,
  inverted,
  onClick,
}: {
  className?: string
  logoClassName?: string
  inverted?: boolean
  onClick?: () => void
}) {
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const { pathname } = useLocation()
  const to = user || isDemoMode ? '/inicio' : '/'

  return (
    <Link
      to={to}
      aria-label="AgroPass, página inicial"
      className={cn('inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2', className)}
      onClick={() => {
        onClick?.()
        // Already on the landing page: the link alone would not move.
        if (LANDING_PATHS.includes(pathname)) window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    >
      <AppLogo className={logoClassName} inverted={inverted} />
    </Link>
  )
}
