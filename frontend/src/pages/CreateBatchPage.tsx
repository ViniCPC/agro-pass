import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MintBatchResponse } from '@/api/batchesApi'
import { ApiError } from '@/api/client'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageContainer } from '@/components/PageContainer'
import { StickyMobileCta } from '@/components/StickyMobileCta'
import { TouchFriendlyButton } from '@/components/TouchFriendlyButton'
import { BatchCreatedSuccessDialog } from '@/features/batches/BatchCreatedSuccessDialog'
import { BatchPreviewCard } from '@/features/batches/BatchPreviewCard'
import { CreateBatchForm } from '@/features/batches/CreateBatchForm'
import { CreateBatchHeader } from '@/features/batches/CreateBatchHeader'
import {
  DEFAULT_CREATE_BATCH_FORM,
  type CreateBatchFormValues,
} from '@/features/batches/create-batch.constants'
import { useCompliantFarms } from '@/hooks/useCompliantFarms'
import { useCreateBatch, useMintBatch } from '@/hooks/useCreateBatch'
import { useFarms } from '@/hooks/useFarms'
import type { Batch } from '@/types/api'

type FieldErrorMap = Partial<Record<keyof CreateBatchFormValues, string>>

function parseApiError(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string | string[] }
      const message = parsed.message
      if (Array.isArray(message)) return message.join(' ')
      if (typeof message === 'string') return message
    } catch {
      return error.message
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error while creating batch.'
}

function toIsoDateString(dateInput: string): string {
  return new Date(`${dateInput}T00:00:00.000Z`).toISOString()
}

export function CreateBatchPage() {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState<CreateBatchFormValues>(
    DEFAULT_CREATE_BATCH_FORM,
  )
  const [errors, setErrors] = useState<FieldErrorMap>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdBatch, setCreatedBatch] = useState<Batch | null>(null)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [mintResult, setMintResult] = useState<MintBatchResponse | null>(null)

  const farmsQuery = useFarms()
  const compliantFarmsQuery = useCompliantFarms()
  const createBatch = useCreateBatch()
  const mintBatch = useMintBatch()

  const farms = farmsQuery.data?.data ?? []
  const compliantCount = compliantFarmsQuery.data.length
  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === formValues.farmId) ?? null,
    [farms, formValues.farmId],
  )

  function setField<K extends keyof CreateBatchFormValues>(
    key: K,
    value: CreateBatchFormValues[K],
  ) {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setSubmitError(null)
  }

  function validate(values: CreateBatchFormValues): FieldErrorMap {
    const fieldErrors: FieldErrorMap = {}

    if (!values.farmId) {
      fieldErrors.farmId = 'Farm is required.'
    } else if (!selectedFarm || selectedFarm.lastValidationStatus !== 'COMPLIANT') {
      fieldErrors.farmId = 'Only compliant farms can create a batch.'
    }

    if (!values.productType) {
      fieldErrors.productType = 'Product is required.'
    }

    if (!values.quantity) {
      fieldErrors.quantity = 'Quantity is required.'
    } else if (!Number.isFinite(Number(values.quantity)) || Number(values.quantity) <= 0) {
      fieldErrors.quantity = 'Quantity must be greater than zero.'
    }

    if (!values.unit.trim()) {
      fieldErrors.unit = 'Unit is required.'
    }

    if (!values.harvestDate) {
      fieldErrors.harvestDate = 'Harvest date is required.'
    }

    return fieldErrors
  }

  async function handleSubmit() {
    const fieldErrors = validate(formValues)
    setErrors(fieldErrors)

    if (Object.keys(fieldErrors).length > 0) {
      return
    }

    try {
      const productType = formValues.productType as Exclude<
        CreateBatchFormValues['productType'],
        ''
      >
      const batch = await createBatch.mutateAsync({
        farmId: formValues.farmId,
        productType,
        quantity: Number(formValues.quantity),
        unit: formValues.unit.trim(),
        harvestDate: toIsoDateString(formValues.harvestDate),
      })

      setCreatedBatch(batch)
      setMintError(null)
      setMintResult(null)
      setIsSuccessOpen(true)
    } catch (error) {
      setSubmitError(parseApiError(error))
    }
  }

  async function handleMintNow() {
    if (!createdBatch) return

    setMintError(null)
    try {
      const result = await mintBatch.mutateAsync(createdBatch.id)
      setMintResult(result)
    } catch (error) {
      setMintError(parseApiError(error))
    }
  }

  function resetFormForAnother() {
    setFormValues(DEFAULT_CREATE_BATCH_FORM)
    setErrors({})
    setSubmitError(null)
    setCreatedBatch(null)
    setMintResult(null)
    setMintError(null)
    setIsSuccessOpen(false)
  }

  const canSubmit =
    !createBatch.isPending &&
    !!formValues.farmId &&
    !!formValues.productType &&
    !!formValues.quantity &&
    !!formValues.unit.trim() &&
    !!formValues.harvestDate &&
    selectedFarm?.lastValidationStatus === 'COMPLIANT'

  const submitHint =
    submitError ??
    (selectedFarm && selectedFarm.lastValidationStatus !== 'COMPLIANT'
      ? 'Selected farm is not compliant yet. Run EUDR validation first.'
      : null)

  if (farmsQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState rows={6} />
      </PageContainer>
    )
  }

  if (farmsQuery.error) {
    return (
      <PageContainer>
        <ErrorState
          title="Could not load farms"
          description="Check backend connection and try again."
          onRetry={() => farmsQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-5 pb-24 sm:pb-0">
      <CreateBatchHeader />

      <p className="text-sm text-[var(--color-ink-subtle)]">
        {compliantCount} compliant farm{compliantCount !== 1 ? 's' : ''} ready
        for batch creation.
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <CreateBatchForm
          farms={farms}
          values={formValues}
          errors={errors}
          isSubmitting={createBatch.isPending}
          canSubmit={canSubmit}
          submitHint={submitHint}
          onChange={setField}
          onSubmit={handleSubmit}
        />

        <BatchPreviewCard values={formValues} selectedFarm={selectedFarm} />
      </div>

      <BatchCreatedSuccessDialog
        isOpen={isSuccessOpen}
        batch={createdBatch}
        isMinting={mintBatch.isPending}
        mintResult={mintResult}
        mintError={mintError}
        onMintNow={handleMintNow}
        onGoToBatchDetail={() => {
          if (!createdBatch) return
          setIsSuccessOpen(false)
          navigate(`/trace/${encodeURIComponent(createdBatch.code)}`)
        }}
        onCreateAnother={resetFormForAnother}
        onBackToBatches={() => navigate('/batches')}
      />

      <StickyMobileCta>
        <TouchFriendlyButton
          onClick={handleSubmit}
          disabled={!canSubmit || createBatch.isPending}
          className="w-full rounded-lg bg-[var(--color-teal-700)] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {createBatch.isPending ? 'Creating...' : 'Create batch'}
        </TouchFriendlyButton>
      </StickyMobileCta>
    </PageContainer>
  )
}
