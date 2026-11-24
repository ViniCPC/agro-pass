import { Link } from 'react-router-dom'
import { DEMO_SHOWCASE_CODE } from '@/mocks/demo-store'
import { CONTACT } from './landing-content'
import { Container, PRIMARY_BUTTON, SECONDARY_BUTTON } from './landing-ui'
import { DemoRequestForm } from './DemoRequestForm'

export function ContactSection() {
  return (
    <section id="contato" aria-labelledby="contato-title" className="scroll-mt-16 bg-[var(--color-leaf-100)] py-16 sm:py-24">
      <Container className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest-800)]">
            Demonstração
          </p>
          <h2 id="contato-title" className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-forest-900)] sm:text-3xl">
            {CONTACT.title}
          </h2>
          <p className="mt-4 text-base text-[var(--color-forest-800)]">{CONTACT.text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#formulario-demo" className={PRIMARY_BUTTON}>
              Solicitar demonstração
            </a>
            {/* The complete example: every stage, closed, with its proof. */}
            <Link to={`/trace/${DEMO_SHOWCASE_CODE}`} className={SECONDARY_BUTTON}>
              Explorar lote de exemplo
            </Link>
          </div>
        </div>
        <DemoRequestForm />
      </Container>
    </section>
  )
}
