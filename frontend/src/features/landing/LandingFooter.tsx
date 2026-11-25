import { Link } from 'react-router-dom'
import { HomeLogoLink } from '@/components/HomeLogoLink'
import { FOOTER_TAGLINE, LINKEDIN_URL, NAV_ITEMS, PHOTOS, REPOSITORY_URL } from './landing-content'
import { Container, SectionLink } from './landing-ui'

const LINK = 'text-sm text-white/70 transition-colors hover:text-white'
const HEADING = 'font-mono text-[11px] uppercase tracking-[0.16em] text-white/45'

export function LandingFooter({ onLanding = true }: { onLanding?: boolean }) {
  return (
    <footer className="bg-carbon py-14 text-white">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <HomeLogoLink inverted />
            <p className="mt-4 max-w-xs text-[15px] leading-snug text-white/70">{FOOTER_TAGLINE}</p>
          </div>

          <nav aria-label="Produto">
            <p className={HEADING}>Produto</p>
            <ul className="mt-3 space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.hash}>
                  <SectionLink hash={item.hash} onLanding={onLanding} className={LINK}>
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Institucional">
            <p className={HEADING}>Institucional</p>
            <ul className="mt-3 space-y-2">
              <li><Link to="/privacidade" className={LINK}>Política de Privacidade</Link></li>
              <li><Link to="/termos" className={LINK}>Termos de Uso</Link></li>
              <li><Link to="/status" className={LINK}>Status do sistema</Link></li>
            </ul>
          </nav>

          <nav aria-label="Redes">
            <p className={HEADING}>Redes</p>
            <ul className="mt-3 space-y-2">
              {LINKEDIN_URL && (
                <li><a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={LINK}>LinkedIn</a></li>
              )}
              <li><a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className={LINK}>GitHub</a></li>
            </ul>
          </nav>
        </div>

        {/* Attribution the photos' CC BY 2.0 licence requires. */}
        <p className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/45">
          Fotos ilustrativas via Wikimedia Commons, licença{' '}
          <a href={PHOTOS.license} target="_blank" rel="noreferrer" className="underline hover:text-white/70">CC BY 2.0</a>:{' '}
          <a href={PHOTOS.warehouse.source} target="_blank" rel="noreferrer" className="underline hover:text-white/70">“{PHOTOS.warehouse.title}”</a>, {PHOTOS.warehouse.author};{' '}
          <a href={PHOTOS.plantation.source} target="_blank" rel="noreferrer" className="underline hover:text-white/70">“{PHOTOS.plantation.title}”</a>, {PHOTOS.plantation.author}.
        </p>
        <p className="mt-3 text-xs text-white/45">© {new Date().getFullYear()} AgroPass. Todos os direitos reservados.</p>
      </Container>
    </footer>
  )
}
