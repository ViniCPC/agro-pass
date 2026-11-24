import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { DEMO_LANDING_CODE } from '@/mocks/demo-store'
import type { PublicBatch } from '@/types/api'
import { HERO } from './landing-content'
import { Container, PRIMARY_BUTTON, SECONDARY_BUTTON } from './landing-ui'
import { PassportPreview } from './PassportPreview'

export function HeroSection({ passport }: { passport: PublicBatch | null }) {
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden bg-[var(--color-sand-50)]">
      <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-leaf-600)]">
            Passaporte digital de lotes agrícolas
          </p>
          <h1
            id="hero-title"
            className="text-[2.15rem] font-semibold leading-[1.12] tracking-tight text-[var(--color-forest-900)] sm:text-5xl"
          >
            {HERO.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-ink-muted)]">
            {HERO.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#contato" className={PRIMARY_BUTTON}>
              Solicitar demonstração
              <ArrowRight size={16} aria-hidden />
            </a>
            <Link to={`/trace/${DEMO_LANDING_CODE}`} className={SECONDARY_BUTTON}>
              Ver um lote rastreável
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--color-ink-muted)]">
            {HERO.trust.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check size={15} className="text-[var(--color-leaf-600)]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {passport && <PassportPreview passport={passport} />}
      </Container>
    </section>
  )
}
