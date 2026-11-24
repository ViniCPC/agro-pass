import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { NAV_ITEMS } from './landing-content'
import { Container, PRIMARY_BUTTON, SectionLink } from './landing-ui'

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

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-sand-200)] bg-[var(--color-sand-50)]/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link to="/" aria-label="AgroPass, página inicial" onClick={close}>
          <AppLogo />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => (
              <li key={item.hash}>
                <SectionLink
                  hash={item.hash}
                  onLanding={onLanding}
                  className="text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-forest-900)]"
                >
                  {item.label}
                </SectionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center px-3 text-sm font-semibold text-[var(--color-forest-900)] hover:text-[var(--color-leaf-600)]"
          >
            Entrar
          </Link>
          <SectionLink hash="#contato" onLanding={onLanding} className={PRIMARY_BUTTON}>
            Solicitar demonstração
          </SectionLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="landing-menu"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-sand-200)] text-[var(--color-forest-900)] lg:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      {open && (
        <div id="landing-menu" className="border-t border-[var(--color-sand-200)] bg-[var(--color-sand-50)] lg:hidden">
          <Container className="py-4">
            <nav aria-label="Principal (celular)">
              <ul className="flex flex-col">
                {NAV_ITEMS.map((item) => (
                  <li key={item.hash}>
                    <SectionLink
                      hash={item.hash}
                      onLanding={onLanding}
                      onClick={close}
                      className="flex min-h-[48px] items-center border-b border-[var(--color-sand-100)] text-base font-medium text-[var(--color-forest-900)]"
                    >
                      {item.label}
                    </SectionLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-4 grid gap-3">
              <SectionLink hash="#contato" onLanding={onLanding} onClick={close} className={PRIMARY_BUTTON}>
                Solicitar demonstração
              </SectionLink>
              <Link
                to="/login"
                onClick={close}
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-[var(--color-sand-200)] bg-white text-sm font-semibold text-[var(--color-forest-900)]"
              >
                Entrar
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
