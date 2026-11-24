import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AudienceSection } from '@/features/landing/AudienceSection'
import { BenefitsSection } from '@/features/landing/BenefitsSection'
import { ContactSection } from '@/features/landing/ContactSection'
import { FaqSection } from '@/features/landing/FaqSection'
import { FieldSection } from '@/features/landing/FieldSection'
import { HeroSection } from '@/features/landing/HeroSection'
import { HowItWorksSection } from '@/features/landing/HowItWorksSection'
import { LandingFooter } from '@/features/landing/LandingFooter'
import { LandingHeader } from '@/features/landing/LandingHeader'
import { SecuritySection } from '@/features/landing/SecuritySection'
import { ShowcaseSection } from '@/features/landing/ShowcaseSection'
import { useLandingPassport } from '@/features/landing/useLandingPassport'

const TITLE = 'AgroPass — Rastreabilidade digital para cadeias agrícolas'

export function LandingPage() {
  const passport = useLandingPassport()
  const { hash } = useLocation()

  useEffect(() => {
    const previous = document.title
    document.title = TITLE
    return () => {
      document.title = previous
    }
  }, [])

  // Arriving from another page at a section (e.g. /#seguranca).
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sand-50)]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-forest-900)] focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>
      <LandingHeader />
      <main id="conteudo" className="flex-1">
        <HeroSection passport={passport} />
        <BenefitsSection />
        {passport && <ShowcaseSection passport={passport} />}
        <HowItWorksSection />
        <AudienceSection />
        <SecuritySection passport={passport} />
        <FieldSection passport={passport} />
        <ContactSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  )
}
