import { useEffect, type ReactNode } from 'react'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'
import { Container } from './landing-ui'

export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt?: string
  children: ReactNode
}) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · AgroPass`
    return () => {
      document.title = previous
    }
  }, [title])

  return (
    <div className="flex min-h-screen flex-col bg-frost">
      <LandingHeader onLanding={false} />
      <main className="flex-1 py-12 sm:py-16">
        <Container className="max-w-3xl">
          <article className="rounded-[6px] bg-white p-6 sm:p-10">
            <h1 className="font-display text-4xl font-medium tracking-tight text-carbon">{title}</h1>
            {updatedAt && (
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-carbon-500">Atualizado em {updatedAt}</p>
            )}
            <div className="mt-8 space-y-6 text-sm leading-relaxed text-carbon-700 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-carbon [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
              {children}
            </div>
          </article>
        </Container>
      </main>
      <LandingFooter onLanding={false} />
    </div>
  )
}
