import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppLogoProps {
  collapsed?: boolean
  className?: string
}

export function AppLogo({ collapsed = false, className }: AppLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-teal-600)] text-white shrink-0">
        <Leaf size={16} strokeWidth={2.5} />
      </div>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
          Agro<span className="text-[var(--color-teal-600)]">Pass</span>
        </span>
      )}
    </div>
  )
}
