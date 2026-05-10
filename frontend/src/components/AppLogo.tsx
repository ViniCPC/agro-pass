import { cn } from '@/lib/utils'
import logoImg from '@/assets/logo.jpg'

interface AppLogoProps {
  collapsed?: boolean
  className?: string
}

export function AppLogo({ collapsed = false, className }: AppLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <img
        src={logoImg}
        alt="AgroPass"
        className="w-8 h-8 rounded-lg shrink-0 object-cover"
      />
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
          Agro<span className="text-[var(--color-teal-600)]">Pass</span>
        </span>
      )}
    </div>
  )
}
