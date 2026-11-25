import { Plus } from 'lucide-react'
import { FAQ } from './landing-content'

// Compact FAQ. Native <details> keeps it keyboard and screen reader friendly.
export function FaqList() {
  return (
    <div id="faq" className="scroll-mt-20">
      <h3 className="text-xl font-semibold tracking-tight text-carbon">Perguntas frequentes</h3>
      <div className="mt-4 border-t border-line">
        {FAQ.map((item) => (
          <details key={item.question} className="group border-b border-line">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 text-left text-[15px] font-medium text-carbon [&::-webkit-details-marker]:hidden">
              {item.question}
              <Plus size={17} aria-hidden className="shrink-0 text-carbon-500 transition-transform group-open:rotate-45" />
            </summary>
            <p className="pb-5 text-[15px] leading-relaxed text-carbon-700">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
