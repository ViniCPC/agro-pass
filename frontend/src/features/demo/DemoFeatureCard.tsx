import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemoFeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  accent?: 'green' | 'teal' | 'amber' | 'default'
}

const accentStyles = {
  green:   'bg-[var(--color-green-100)] text-[var(--color-green-700)]',
  teal:    'bg-[var(--color-teal-100)]  text-[var(--color-teal-700)]',
  amber:   'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
  default: 'bg-[var(--color-slate-100)] text-[var(--color-slate-600)]',
}

export function DemoFeatureCard({ icon: Icon, title, description, accent = 'default' }: DemoFeatureCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-5 flex flex-col gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', accentStyles[accent])}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
