import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { DEMO_LANDING_CODE } from '@/mocks/demo-store'
import { LandingEnterDemoButton } from './EnterDemoButton'
import { DemoRequestForm } from './DemoRequestForm'
import { FaqList } from './FaqSection'
import { DEMO } from './landing-content'
import { Container, TEXT_LINK } from './landing-ui'

// The invitation to open the demo, then a short FAQ and, for those who would
// rather talk, the request form.
export function DemoSection() {
  return (
    <section id="demonstracao" aria-labelledby="demonstracao-title" className="scroll-mt-16 bg-frost py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-8 border-b border-line pb-14 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="demonstracao-title" className="text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.045em] text-carbon sm:text-[4rem]">
              {DEMO.title}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-carbon-700">{DEMO.text}</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <LandingEnterDemoButton />
            <Link to={`/trace/${DEMO_LANDING_CODE}`} className={TEXT_LINK}>
              Abrir um passaporte
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <FaqList />
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-carbon">{DEMO.formTitle}</h3>
            <p className="mb-5 mt-1 text-[15px] text-carbon-700">{DEMO.formText}</p>
            <DemoRequestForm />
          </div>
        </div>
      </Container>
    </section>
  )
}
