import { Link } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { FOOTER_TAGLINE, LINKEDIN_URL, REPOSITORY_URL } from './landing-content'
import { Container, SectionLink } from './landing-ui'

const LINK = 'text-sm text-white/70 transition-colors hover:text-white'

export function LandingFooter({ onLanding = true }: { onLanding?: boolean }) {
  return (
    <footer className="bg-[var(--color-forest-950)] py-12 text-white">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="inline-flex rounded-lg bg-white px-3 py-2">
              <AppLogo />
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/70">{FOOTER_TAGLINE}</p>
          </div>

          <nav aria-label="Produto">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Produto</p>
            <ul className="mt-3 space-y-2">
              <li><SectionLink hash="#produto" onLanding={onLanding} className={LINK}>Produto</SectionLink></li>
              <li><SectionLink hash="#seguranca" onLanding={onLanding} className={LINK}>Segurança</SectionLink></li>
              <li><SectionLink hash="#contato" onLanding={onLanding} className={LINK}>Contato</SectionLink></li>
            </ul>
          </nav>

          <nav aria-label="Institucional">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Institucional</p>
            <ul className="mt-3 space-y-2">
              <li><Link to="/privacidade" className={LINK}>Política de Privacidade</Link></li>
              <li><Link to="/termos" className={LINK}>Termos de Uso</Link></li>
              <li><Link to="/status" className={LINK}>Status do sistema</Link></li>
            </ul>
          </nav>

          <nav aria-label="Redes">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Redes</p>
            <ul className="mt-3 space-y-2">
              {LINKEDIN_URL && (
                <li><a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={LINK}>LinkedIn</a></li>
              )}
              <li><a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className={LINK}>GitHub</a></li>
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
          © {new Date().getFullYear()} AgroPass. Todos os direitos reservados.
        </p>
      </Container>
    </footer>
  )
}
