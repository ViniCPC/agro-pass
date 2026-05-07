import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TouchFriendlyButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function TouchFriendlyButton({
  children,
  className,
  type = 'button',
  ...props
}: TouchFriendlyButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'min-h-[44px] touch-manipulation',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
