import { ChevronDown } from 'lucide-react'
import { FAQ } from './landing-content'
import { Container, SectionHeading } from './landing-ui'

// Native <details> keeps the accordion keyboard and screen reader friendly.
export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-[var(--color-sand-50)] py-16 sm:py-24">
      <Container className="max-w-3xl">
        <SectionHeading id="faq-title" eyebrow="Dúvidas" title="Perguntas frequentes" align="center" />
        <div className="mt-10 divide-y divide-[var(--color-sand-200)] rounded-2xl border border-[var(--color-sand-200)] bg-white">
          {FAQ.map((item) => (
            <details key={item.question} className="group px-5 py-1 sm:px-6">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium text-[var(--color-forest-900)] [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown size={18} aria-hidden className="shrink-0 text-[var(--color-leaf-600)] transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-[var(--color-ink-muted)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
