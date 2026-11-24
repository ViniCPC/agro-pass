import { History, MapPinned, QrCode } from 'lucide-react'
import { BENEFITS } from './landing-content'
import { Container, SectionHeading } from './landing-ui'

const ICONS = [MapPinned, History, QrCode]

export function BenefitsSection() {
  return (
    <section aria-labelledby="beneficios-title" className="border-y border-[var(--color-sand-200)] bg-[var(--color-sand-100)] py-16 sm:py-20">
      <Container>
        <SectionHeading id="beneficios-title" title={BENEFITS.title} align="center" />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {BENEFITS.items.map((item, index) => {
            const Icon = ICONS[index]
            return (
              <li key={item.title} className="rounded-2xl border border-[var(--color-sand-200)] bg-white p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-leaf-100)] text-[var(--color-forest-800)]">
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--color-forest-900)]">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">{item.text}</p>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
