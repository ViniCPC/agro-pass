import { Building2, Check, ShoppingBag, Sprout, Truck } from 'lucide-react'
import { AUDIENCES } from './landing-content'
import { Container, SectionHeading } from './landing-ui'

const ICONS = [Sprout, Building2, Truck, ShoppingBag]

export function AudienceSection() {
  return (
    <section id="para-quem" aria-labelledby="para-quem-title" className="scroll-mt-16 bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading id="para-quem-title" eyebrow="Para quem é" title={AUDIENCES.title} subtitle={AUDIENCES.subtitle} />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.items.map((audience, index) => {
            const Icon = ICONS[index]
            return (
              <li key={audience.title} className="flex flex-col rounded-2xl border border-[var(--color-sand-200)] bg-[var(--color-sand-50)] p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-forest-800)] text-white">
                  <Icon size={18} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-[var(--color-forest-900)]">{audience.title}</h3>
                <ul className="mt-3 space-y-2">
                  {audience.points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm text-[var(--color-ink-muted)]">
                      <Check size={16} className="mt-0.5 shrink-0 text-[var(--color-leaf-600)]" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
