import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        COMPLIANT:     'bg-[var(--color-green-100)] text-[var(--color-green-700)]',
        NEEDS_REVIEW:  'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
        NON_COMPLIANT: 'bg-[var(--color-red-100)]   text-[var(--color-red-700)]',
        PENDING:       'bg-[var(--color-slate-100)]  text-[var(--color-slate-600)]',
        EXPIRED:       'bg-[var(--color-slate-100)]  text-[var(--color-slate-600)]',
        APPROVED:      'bg-[var(--color-green-100)]  text-[var(--color-green-700)]',
        REJECTED:      'bg-[var(--color-red-100)]    text-[var(--color-red-700)]',
        CREATED:       'bg-[var(--color-slate-100)]  text-[var(--color-slate-600)]',
        VERIFIED:      'bg-[var(--color-teal-100)]   text-[var(--color-teal-700)]',
        MINTED:        'bg-[var(--color-teal-100)]   text-[var(--color-teal-700)]',
        IN_TRANSIT:    'bg-[var(--color-amber-100)]  text-[var(--color-amber-700)]',
        EXPORTED:      'bg-[var(--color-green-100)]  text-[var(--color-green-700)]',
      },
    },
    defaultVariants: {
      variant: 'PENDING',
    },
  }
)

const dot: Record<string, string> = {
  COMPLIANT:     'bg-[var(--color-green-600)]',
  NEEDS_REVIEW:  'bg-[var(--color-amber-600)]',
  NON_COMPLIANT: 'bg-[var(--color-red-600)]',
  PENDING:       'bg-[var(--color-slate-400)]',
  EXPIRED:       'bg-[var(--color-slate-400)]',
  APPROVED:      'bg-[var(--color-green-600)]',
  REJECTED:      'bg-[var(--color-red-600)]',
  CREATED:       'bg-[var(--color-slate-400)]',
  VERIFIED:      'bg-[var(--color-teal-600)]',
  MINTED:        'bg-[var(--color-teal-600)]',
  IN_TRANSIT:    'bg-[var(--color-amber-600)]',
  EXPORTED:      'bg-[var(--color-green-600)]',
}

const labels: Record<string, string> = {
  COMPLIANT:     'Conforme',
  NEEDS_REVIEW:  'Em revisão',
  NON_COMPLIANT: 'Não Conforme',
  PENDING:       'Pendente',
  EXPIRED:       'Expirado',
  APPROVED:      'Aprovada',
  REJECTED:      'Rejeitada',
  CREATED:       'Criado',
  VERIFIED:      'Verificado',
  MINTED:        'Mintado',
  IN_TRANSIT:    'Em trânsito',
  EXPORTED:      'Exportado',
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
