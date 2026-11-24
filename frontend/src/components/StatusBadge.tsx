import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        CREATED:       'bg-[var(--color-slate-100)]  text-[var(--color-slate-600)]',
        HARVESTED:     'bg-[var(--color-amber-100)]  text-[var(--color-amber-700)]',
        RECEIVED:      'bg-[var(--color-teal-100)]   text-[var(--color-teal-700)]',
        IN_TRANSIT:    'bg-[var(--color-amber-100)]  text-[var(--color-amber-700)]',
        PROCESSED:     'bg-[var(--color-teal-100)]   text-[var(--color-teal-700)]',
        DELIVERED:     'bg-[var(--color-green-100)]  text-[var(--color-green-700)]',
        CLOSED:        'bg-[var(--color-slate-100)]  text-[var(--color-slate-700)]',
        CANCELLED:     'bg-[var(--color-red-100)]    text-[var(--color-red-700)]',
        TOKENIZED:     'bg-[var(--color-teal-100)]   text-[var(--color-teal-700)]',
      },
    },
    defaultVariants: {
      variant: 'CREATED',
    },
  }
)

const dot: Record<string, string> = {
  CREATED:       'bg-[var(--color-slate-400)]',
  HARVESTED:     'bg-[var(--color-amber-600)]',
  RECEIVED:      'bg-[var(--color-teal-600)]',
  IN_TRANSIT:    'bg-[var(--color-amber-600)]',
  PROCESSED:     'bg-[var(--color-teal-600)]',
  DELIVERED:     'bg-[var(--color-green-600)]',
  CLOSED:        'bg-[var(--color-slate-600)]',
  CANCELLED:     'bg-[var(--color-red-600)]',
  TOKENIZED:     'bg-[var(--color-teal-600)]',
}

const labels: Record<string, string> = {
  CREATED:       'Criado',
  HARVESTED:     'Colhido',
  RECEIVED:      'Recebido',
  IN_TRANSIT:    'Em trânsito',
  PROCESSED:     'Processado',
  DELIVERED:     'Entregue',
  CLOSED:        'Encerrado',
  CANCELLED:     'Cancelado',
  TOKENIZED:     'Tokenizado',
}

type BadgeVariant = VariantProps<typeof badge>['variant']

interface StatusBadgeProps {
  status: NonNullable<BadgeVariant>
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={`${status}-${label ?? ''}`}
        initial={{ scale: 0.94, opacity: 0.75 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0.9 }}
        transition={{ type: 'spring', stiffness: 340, damping: 24 }}
        className={cn(badge({ variant: status }), className)}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', dot[status])} />
        {label ?? labels[status] ?? status}
      </motion.span>
    </AnimatePresence>
  )
}
