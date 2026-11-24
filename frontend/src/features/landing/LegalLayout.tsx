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
    <div className="flex min-h-screen flex-col bg-[var(--color-sand-50)]">
      <LandingHeader onLanding={false} />
      <main className="flex-1 py-12 sm:py-16">
        <Container className="max-w-3xl">
          <article className="rounded-3xl border border-[var(--color-sand-200)] bg-white p-6 sm:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-forest-900)]">{title}</h1>
            {updatedAt && (
              <p className="mt-2 text-sm text-[var(--color-ink-subtle)]">Atualizado em {updatedAt}</p>
            )}
            <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-ink-muted)] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[var(--color-forest-900)] [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
              {children}
            </div>
          </article>
        </Container>
      </main>
      <LandingFooter onLanding={false} />
    </div>
  )
}
