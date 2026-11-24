import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

interface SectionHeadingProps {
  id: string
  eyebrow?: string
  title: string
  subtitle?: string
  tone?: 'light' | 'dark'
  align?: 'left' | 'center'
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  tone = 'light',
  align = 'left',
}: SectionHeadingProps) {
  const dark = tone === 'dark'
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        <p
          className={cn(
            'mb-3 text-xs font-semibold uppercase tracking-[0.14em]',
            dark ? 'text-[var(--color-leaf-100)]' : 'text-[var(--color-leaf-600)]',
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={cn(
          'text-2xl font-semibold leading-tight tracking-tight sm:text-3xl',
          dark ? 'text-white' : 'text-[var(--color-forest-900)]',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-3 text-base', dark ? 'text-white/75' : 'text-[var(--color-ink-muted)]')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

// On the landing page a section link is a plain in-page anchor; elsewhere it
// navigates back to the landing page at that section.
export function SectionLink({
  hash,
  onLanding,
  className,
  children,
  onClick,
}: {
  hash: string
  onLanding: boolean
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  if (onLanding) {
    return (
      <a href={hash} className={className} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link to={{ pathname: '/', hash }} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

export const PRIMARY_BUTTON =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[var(--color-forest-800)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-forest-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-leaf-600)]'

export const SECONDARY_BUTTON =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-[var(--color-sand-200)] bg-white px-5 text-sm font-semibold text-[var(--color-forest-900)] transition-colors hover:border-[var(--color-leaf-600)] hover:text-[var(--color-leaf-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-leaf-600)]'
