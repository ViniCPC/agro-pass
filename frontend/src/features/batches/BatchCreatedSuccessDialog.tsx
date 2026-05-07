import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Loader2, Link2 } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { MintBatchResponse } from '@/api/batchesApi'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Batch } from '@/types/api'

interface BatchCreatedSuccessDialogProps {
  isOpen: boolean
  batch: Batch | null
  isMinting: boolean
  mintResult: MintBatchResponse | null
  mintError: string | null
  onMintNow: () => void
  onGoToBatchDetail: () => void
  onCreateAnother: () => void
  onBackToBatches: () => void
}

function shortHash(value: string) {
  if (value.length < 20) return value
  return `${value.slice(0, 10)}...${value.slice(-8)}`
}

export function BatchCreatedSuccessDialog({
  isOpen,
  batch,
  isMinting,
  mintResult,
  mintError,
  onMintNow,
  onGoToBatchDetail,
  onCreateAnother,
  onBackToBatches,
}: BatchCreatedSuccessDialogProps) {
  const isMobile = useIsMobile()

  return (
    <AnimatePresence>
      {isOpen && batch && (
        <motion.div
          className={`fixed inset-0 z-50 bg-black/35 px-4 ${
            isMobile ? 'flex items-end justify-center pb-0' : 'flex items-center justify-center'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            initial={
              isMobile
                ? { opacity: 0, y: 120 }
                : { opacity: 0, y: 18, scale: 0.98 }
            }
            animate={
              isMobile
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              isMobile
                ? { opacity: 0, y: 120 }
                : { opacity: 0, y: 10, scale: 0.99 }
            }
            transition={
              isMobile
                ? { type: 'spring', stiffness: 320, damping: 30 }
                : { type: 'spring', stiffness: 280, damping: 18 }
            }
            className={`w-full border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card-hover)] ${
              isMobile ? 'max-w-2xl rounded-t-[18px]' : 'max-w-lg rounded-[16px]'
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-green-50)] px-2.5 py-1 text-xs font-semibold text-[var(--color-green-700)]">
                  <CheckCircle2 size={12} />
                  Batch created successfully
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                  {batch.code}
                </h2>
              </div>
              <StatusBadge status="CREATED" />
            </div>

            <p className="text-sm text-[var(--color-ink-subtle)]">
              Your lot is ready for traceability events and blockchain proof.
            </p>

            {mintResult && (
              <div className="mt-4 rounded-lg border border-[var(--color-teal-100)] bg-[var(--color-teal-50)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
                  Blockchain proof ready
                </p>
                <p className="mt-1 text-xs text-[var(--color-teal-700)]">
                  Tx hash: {shortHash(mintResult.mintTxHash)}
                </p>
                <p className="mt-1 text-xs text-[var(--color-teal-700)]">
                  cNFT: {shortHash(mintResult.cnftAddress ?? '-')}
                </p>
              </div>
            )}

            {mintError && (
              <p className="mt-4 rounded-lg bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
                Mint failed: {mintError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onMintNow}
                disabled={isMinting || Boolean(mintResult)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMinting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                {isMinting ? 'Minting...' : mintResult ? 'Mint completed' : 'Mint on Solana now'}
              </button>

              <button
                type="button"
                onClick={onGoToBatchDetail}
                className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
              >
                Go to batch detail
              </button>

              <button
                type="button"
                onClick={onCreateAnother}
                className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
              >
                Create another
              </button>

              <button
                type="button"
                onClick={onBackToBatches}
                className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]"
              >
                Back to batches
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
