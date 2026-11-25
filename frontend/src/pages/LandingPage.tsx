import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { DemoSection } from '@/features/landing/DemoSection'
import { FlowSection } from '@/features/landing/FlowSection'
import { HeroSection } from '@/features/landing/HeroSection'
import { LandingFooter } from '@/features/landing/LandingFooter'
import { LandingHeader } from '@/features/landing/LandingHeader'
import { PlatformSection } from '@/features/landing/PlatformSection'
import { TrustSection } from '@/features/landing/TrustSection'
import { useLandingPassport } from '@/features/landing/useLandingPassport'

const TITLE = 'AgroPass — A origem registrada. A trajetória à vista.'

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

  // Arriving from another page at a section (e.g. /#plataforma).
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  return (
    <div className="flex min-h-screen flex-col bg-frost font-display">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-carbon focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>
      <LandingHeader />
      <main id="conteudo" className="flex-1">
        <HeroSection passport={passport} />
        {passport && <PlatformSection passport={passport} />}
        <FlowSection passport={passport} />
        {passport && <TrustSection passport={passport} />}
        <DemoSection />
      </main>
      <LandingFooter />
    </div>
  )
}
