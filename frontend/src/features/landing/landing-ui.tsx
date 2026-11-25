import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8', className)}>{children}</div>
}

// A section heading: a small mono label over a large, tight title.
export function SectionTitle({
  id,
  label,
  title,
  subtitle,
  tone = 'light',
  className,
}: {
  id: string
  label: string
  title: string
  subtitle?: string
  tone?: 'light' | 'dark'
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <div className={className}>
      <p className={cn('flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]', dark ? 'text-white/60' : 'text-carbon-500')}>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime" />
        {label}
      </p>
      <h2
        id={id}
        className={cn(
          'mt-4 max-w-3xl text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[3.25rem]',
          dark ? 'text-white' : 'text-carbon',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-5 max-w-xl text-base leading-relaxed sm:text-lg', dark ? 'text-white/70' : 'text-carbon-700')}>{subtitle}</p>
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

const BUTTON =
  'inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-5 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

// Lime marks the main action; everything else stays quiet.
export const PRIMARY_BUTTON = `${BUTTON} bg-lime text-carbon hover:bg-lime-300 focus-visible:outline-carbon`

export const DARK_BUTTON = `${BUTTON} bg-carbon text-white hover:bg-carbon-700 focus-visible:outline-carbon`

export const SECONDARY_BUTTON = `${BUTTON} border border-line bg-white text-carbon hover:border-carbon focus-visible:outline-carbon`

export const SECONDARY_BUTTON_DARK = `${BUTTON} border border-white/25 text-white hover:border-white focus-visible:outline-white`

export const TEXT_LINK =
  'inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-semibold text-carbon underline decoration-carbon/25 underline-offset-[6px] hover:decoration-carbon'
