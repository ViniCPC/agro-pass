import { Loader2 } from 'lucide-react'
import type { Farm } from '@/types/api'
import {
  PRODUCT_OPTIONS,
  type CreateBatchFormValues,
} from './create-batch.constants'
import { FarmSelectorWithStatus } from './FarmSelectorWithStatus'

type FieldErrorMap = Partial<Record<keyof CreateBatchFormValues, string>>

interface CreateBatchFormProps {
  farms: Farm[]
  values: CreateBatchFormValues
  errors: FieldErrorMap
  isSubmitting: boolean
  canSubmit: boolean
  submitHint?: string | null
  onChange: <K extends keyof CreateBatchFormValues>(
    key: K,
    value: CreateBatchFormValues[K],
  ) => void
  onSubmit: () => void
}

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-teal-600)]'

export function CreateBatchForm({
  farms,
  values,
  errors,
  isSubmitting,
  canSubmit,
  submitHint,
  onChange,
  onSubmit,
}: CreateBatchFormProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        Batch data
      </h2>
      <p className="mt-0.5 text-sm text-[var(--color-ink-subtle)]">
        Fill all required fields to register a new traceability lot.
      </p>

      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <FarmSelectorWithStatus
          farms={farms}
          value={values.farmId}
          onChange={(farmId) => onChange('farmId', farmId)}
          disabled={isSubmitting}
          error={errors.farmId ?? null}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Product
          </label>
          <select
            value={values.productType}
            disabled={isSubmitting}
            onChange={(event) =>
              onChange('productType', event.target.value as CreateBatchFormValues['productType'])
            }
            className={INPUT_CLASS}
          >
            <option value="">Select product</option>
            {PRODUCT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.productType && (
            <p className="text-xs text-[var(--color-red-700)]">{errors.productType}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              value={values.quantity}
              disabled={isSubmitting}
              onChange={(event) => onChange('quantity', event.target.value)}
              placeholder="Ex: 200"
              className={INPUT_CLASS}
            />
            {errors.quantity && (
              <p className="text-xs text-[var(--color-red-700)]">{errors.quantity}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Unit
            </label>
            <input
              type="text"
              value={values.unit}
              disabled={isSubmitting}
              onChange={(event) => onChange('unit', event.target.value)}
              placeholder="sacas"
              className={INPUT_CLASS}
            />
            {errors.unit && (
              <p className="text-xs text-[var(--color-red-700)]">{errors.unit}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Harvest date
          </label>
          <input
            type="date"
            value={values.harvestDate}
            disabled={isSubmitting}
            onChange={(event) => onChange('harvestDate', event.target.value)}
            className={INPUT_CLASS}
          />
          {errors.harvestDate && (
            <p className="text-xs text-[var(--color-red-700)]">{errors.harvestDate}</p>
          )}
        </div>

        {submitHint && (
          <p className="rounded-md bg-[var(--color-amber-50)] px-2.5 py-2 text-xs text-[var(--color-amber-700)]">
            {submitHint}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
          {isSubmitting ? 'Creating...' : 'Criar lote'}
        </button>
      </form>
    </section>
  )
}
