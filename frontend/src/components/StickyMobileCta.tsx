import type { ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface StickyMobileCtaProps {
  children: ReactNode
  className?: string
}

export function StickyMobileCta({ children, className }: StickyMobileCtaProps) {
  const isMobile = useIsMobile()

  if (!isMobile) return null

  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-3 backdrop-blur ${className ?? ''}`}>
      <div className="pb-[calc(env(safe-area-inset-bottom,0px))]">
        {children}
      </div>
    </div>
  )
}
