import { STEPS } from './landing-content'
import { Container, SectionHeading } from './landing-ui'

export function HowItWorksSection() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-title" className="scroll-mt-16 bg-[var(--color-sand-50)] py-16 sm:py-24">
      <Container>
        <SectionHeading id="como-funciona-title" eyebrow="Como funciona" title={STEPS.title} />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.items.map((step, index) => (
            <li key={step.title} className="relative rounded-2xl border border-[var(--color-sand-200)] bg-white p-5">
              <span className="text-xs font-semibold tabular-nums text-[var(--color-leaf-600)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-[var(--color-forest-900)]">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
