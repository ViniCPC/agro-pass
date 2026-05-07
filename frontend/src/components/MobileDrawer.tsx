import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  desktopContent: ReactNode
  drawerContent: ReactNode
}

export function MobileDrawer({
  open,
  onClose,
  desktopContent,
  drawerContent,
}: MobileDrawerProps) {
  const isMobile = useIsMobile()

  if (!isMobile) {
    return <>{desktopContent}</>
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed inset-y-0 left-0 z-[60] w-72 max-w-[86vw] overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)]"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            {drawerContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
