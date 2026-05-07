import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

type MotionVariant = 'fade' | 'slide-left' | 'scale' | 'stagger'

interface MotionWrapperProps {
  children: ReactNode
  variant?: MotionVariant
  className?: string
  delay?: number
  duration?: number
  once?: boolean
}

const VARIANTS: Record<MotionVariant, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  'slide-left': {
    hidden: { opacity: 0, x: -18 },
    show: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.97 },
    show: { opacity: 1, scale: 1 },
  },
  stagger: {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.02,
      },
    },
  },
}

export function MotionWrapper({
  children,
  variant = 'fade',
  className,
  delay = 0,
  duration = 0.3,
  once = true,
}: MotionWrapperProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.15 }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
