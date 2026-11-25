import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, PencilLine } from 'lucide-react'
import { FormField, INPUT_CLASS } from '@/components/FormField'
import { TRACE_EVENT_LABEL, formatDateTime } from '@/features/trace/trace.utils'
import type { TimelineEventData } from '@/features/trace/timeline.types'
import { useCorrectEvent } from '@/hooks/useBatchLifecycle'
import { apiErrorMessage } from '@/lib/api-error'
import type { Batch } from '@/types/api'

// Recorded events are never edited: a correction is a new event that points
// at the wrong one and explains it. Admins only, while the chain is open.
export function BatchCorrectionPanel({ batch, events }: { batch: Batch; events: TimelineEventData[] }) {
  const correct = useCorrectEvent()
  const correctable = events.filter((event) => event.type !== 'CORRECTION')
  const [eventId, setEventId] = useState('')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setDone(false)
    try {
      await correct.mutateAsync({ batchId: batch.id, correctedEventId: eventId, notes: notes.trim() })
      setDone(true)
      setEventId('')
      setNotes('')
    } catch {
      // Shown below.
    }
  }

  return (
    <details className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <summary className="flex cursor-pointer items-center gap-2 text-base font-semibold text-[var(--color-ink)]">
        <PencilLine size={16} className="text-[var(--color-teal-700)]" aria-hidden />
        Registrar correção
      </summary>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <p className="text-sm text-[var(--color-ink-subtle)]">
          Eventos registrados não podem ser alterados. A correção entra como um novo evento que aponta o original e
          explica o erro; os dois aparecem no passaporte.
        </p>
        <FormField id="correction-event" label="Evento corrigido">
          <select
            id="correction-event"
            value={eventId}
            disabled={correct.isPending}
            onChange={(event) => setEventId(event.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Selecione o evento</option>
            {correctable.map((event) => (
              <option key={event.id} value={event.id}>
                #{event.sequence ?? '?'} · {TRACE_EVENT_LABEL[event.type] ?? event.type} · {formatDateTime(event.createdAt)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="correction-notes" label="O que está errado e qual é o dado certo">
          <textarea
            id="correction-notes"
            value={notes}
            rows={3}
            maxLength={2000}
            disabled={correct.isPending}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex.: A quantidade recebida foi 118 sacas, não 120."
            className={`${INPUT_CLASS} resize-y`}
          />
        </FormField>
        {correct.error && (
          <p role="alert" className="rounded-md bg-[var(--color-red-50)] px-3 py-2 text-xs text-[var(--color-red-700)]">
            {apiErrorMessage(correct.error)}
          </p>
        )}
        {done && (
          <p role="status" className="flex items-center gap-1.5 rounded-md bg-[var(--color-green-50)] px-3 py-2 text-xs text-[var(--color-green-700)]">
            <CheckCircle2 size={13} aria-hidden /> Correção registrada na cadeia.
          </p>
        )}
        <button
          type="submit"
          disabled={correct.isPending || !eventId || notes.trim().length < 5}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--color-teal-600)] px-4 text-sm font-semibold text-[var(--color-teal-700)] hover:bg-[var(--color-teal-50)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {correct.isPending && <Loader2 size={15} className="animate-spin" />}
          Registrar correção
        </button>
      </form>
    </details>
  )
}
