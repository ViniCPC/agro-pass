import { cn } from '@/lib/utils'
import logoImg from '@/assets/logo.jpg'

interface AppLogoProps {
  collapsed?: boolean
  className?: string
  // Light wordmark for dark backgrounds.
  inverted?: boolean
}

export function AppLogo({ collapsed = false, className, inverted = false }: AppLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <img
        src={logoImg}
        alt="AgroPass"
        className="w-8 h-8 rounded-lg shrink-0 object-cover"
      />
      {!collapsed && (
        <span className={cn('text-[15px] font-semibold tracking-tight', inverted ? 'text-white' : 'text-[var(--color-ink)]')}>
          Agro<span className={inverted ? 'text-[var(--color-lime)]' : 'text-[var(--color-teal-600)]'}>Pass</span>
        </span>
      )}
    </div>
  )
}
