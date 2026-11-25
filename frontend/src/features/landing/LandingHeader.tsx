import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { HomeLogoLink } from '@/components/HomeLogoLink'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'
import { DEMO_LANDING_CODE } from '@/mocks/demo-store'
import { NAV_ITEMS } from './landing-content'
import { Container, SECONDARY_BUTTON, SectionLink } from './landing-ui'

const EXAMPLE_PATH = `/trace/${DEMO_LANDING_CODE}`

export function LandingHeader({ onLanding = true }: { onLanding?: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const close = () => setOpen(false)
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  // Already inside the app (signed in or in the demo): offer the way back.
  const account = user || isDemoMode ? { to: '/dashboard', label: 'Ir para o painel' } : { to: '/login', label: 'Entrar' }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-frost/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <HomeLogoLink onClick={close} />
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1 text-sm text-carbon-700">
              {NAV_ITEMS.map((item, index) => (
                <li key={item.hash} className="flex items-center gap-1">
                  {index > 0 && (
                    <span aria-hidden className="text-carbon-500/60">
                      ·
                    </span>
                  )}
                  <SectionLink hash={item.hash} onLanding={onLanding} className="rounded-md px-2 py-1.5 hover:text-carbon">
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Link to={account.to} className="inline-flex min-h-[44px] items-center whitespace-nowrap px-3 text-sm font-semibold text-carbon hover:underline">
            {account.label}
          </Link>
          <Link to={EXAMPLE_PATH} className="inline-flex min-h-[40px] items-center rounded-[10px] bg-carbon px-4 text-sm font-semibold text-white hover:bg-carbon-700">
            Abrir um passaporte
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="landing-menu"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-line bg-white text-carbon md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      {open && (
        <div id="landing-menu" className="border-t border-line bg-frost md:hidden">
          <Container className="py-4">
            <nav aria-label="Principal (celular)">
              <ul className="flex flex-col">
                {NAV_ITEMS.map((item) => (
                  <li key={item.hash}>
                    <SectionLink
                      hash={item.hash}
                      onLanding={onLanding}
                      onClick={close}
                      className="flex min-h-[48px] items-center border-b border-line text-lg font-medium text-carbon"
                    >
                      {item.label}
                    </SectionLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-4 grid gap-3">
              <Link to={EXAMPLE_PATH} onClick={close} className={SECONDARY_BUTTON}>
                Abrir um passaporte
              </Link>
              <Link to={account.to} onClick={close} className={SECONDARY_BUTTON}>
                {account.label}
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
