import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, UserRound } from 'lucide-react'
import type { StageDetails } from '@/api/batchesApi'
import { FormField, INPUT_CLASS } from '@/components/FormField'
import { BATCH_STATUS_LABEL } from '@/features/trace/trace.utils'
import type { BatchStatus } from '@/types/api'

const PLACEHOLDERS: Partial<Record<BatchStatus, { location: string; notes: string }>> = {
  HARVESTED: { location: 'Ex.: Talhão 4', notes: 'Ex.: Colheita manual, 120 sacas, umidade 11%' },
  RECEIVED: { location: 'Ex.: Armazém da cooperativa, Patrocínio/MG', notes: 'Ex.: Recebidas 120 sacas de 60 kg' },
  IN_TRANSIT: { location: 'Ex.: Saída de Patrocínio/MG', notes: 'Ex.: Caminhão ABC1D23, destino Santos/SP' },
  PROCESSED: { location: 'Ex.: Unidade de beneficiamento', notes: 'Ex.: Rebeneficiado e classificado, tipo 2' },
  DELIVERED: { location: 'Ex.: Porto de Santos/SP', notes: 'Ex.: Entregue ao comprador, NF 1234' },
}

interface RecordStageFormProps {
  stage: BatchStatus
  responsible: string
  pending: boolean
  onSubmit: (details: StageDetails) => Promise<void>
}

// A stage is recorded with where it happened and what was done. Both are
// hashed with the event, so the form says so before saving.
export function RecordStageForm({ stage, responsible, pending, onSubmit }: RecordStageFormProps) {
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const label = BATCH_STATUS_LABEL[stage]
  const placeholder = PLACEHOLDERS[stage]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await onSubmit({ location: location.trim() || undefined, notes: notes.trim() || undefined })
      setLocation('')
      setNotes('')
    } catch {
      // The panel shows the error; the typed details stay for another try.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-page)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Próxima etapa: {label}</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
          <UserRound size={12} aria-hidden />
          Responsável: <span className="font-medium text-[var(--color-ink-muted)]">{responsible}</span>
        </p>
      </div>

      <FormField id={`stage-location-${stage}`} label="Local" optional>
        <input
          id={`stage-location-${stage}`}
          value={location}
          maxLength={200}
          disabled={pending}
          onChange={(event) => setLocation(event.target.value)}
          placeholder={placeholder?.location}
          className={INPUT_CLASS}
        />
      </FormField>
      <FormField id={`stage-notes-${stage}`} label="Observações" optional>
        <textarea
          id={`stage-notes-${stage}`}
          value={notes}
          maxLength={2000}
          rows={2}
          disabled={pending}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={placeholder?.notes}
          className={`${INPUT_CLASS} resize-y`}
        />
      </FormField>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--color-ink-subtle)]">
          Local e observações entram no hash do evento. Depois de salvos, só uma correção registrada pode apontar um erro.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          Registrar etapa: {label}
        </button>
      </div>
    </form>
  )
}
