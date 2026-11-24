import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import type { PassportIntegrity } from '@/types/api'
import { TimelineHashInline } from './TimelineHashInline'
import { formatDateTime } from './trace.utils'

const CARD = 'rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-card)] sm:p-5'

export function TraceIntegrityCard({ integrity }: { integrity?: PassportIntegrity }) {
  if (!integrity) {
    return (
      <section className={`${CARD} border-[var(--color-border-soft)] bg-[var(--color-surface)]`}>
        <div className="flex items-center gap-2">
          <ShieldQuestion size={16} className="text-[var(--color-slate-600)]" />
          <h2 className="text-base font-semibold text-[var(--color-ink)]">Integridade</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--color-ink-subtle)]">
          A verificação da cadeia de hashes não está disponível no momento.
        </p>
      </section>
    )
  }

  if (!integrity.valid) {
    return (
      <section className={`${CARD} border-[var(--color-red-100)] bg-[var(--color-red-50)]`}>
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-[var(--color-red-700)]" />
          <h2 className="text-base font-semibold text-[var(--color-red-700)]">Inconsistência detectada</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Ao menos um registro não confere com o hash gravado. Os dados abaixo podem ter sido alterados
          depois de registrados.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-[var(--color-red-700)]">
          {integrity.errors.map((error, index) => (
            <li key={`${error.code}-${error.sequence ?? 'batch'}-${index}`}>
              {error.sequence != null ? `Evento #${error.sequence}: ` : ''}
              {error.message}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section className={`${CARD} border-[var(--color-green-100)] bg-[var(--color-green-50)]`}>
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-[var(--color-green-700)]" />
        <h2 className="text-base font-semibold text-[var(--color-green-700)]">Cadeia íntegra</h2>
      </div>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
        Os {integrity.eventCount} eventos foram recalculados: cada hash confere com seus dados e com o
        evento anterior. Nenhum registro foi alterado ou removido.
      </p>
      <div className="mt-3 rounded-lg bg-[var(--color-surface)] px-2.5 py-2">
        <TimelineHashInline label="Hash final" value={integrity.finalHash} />
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        Verificado em {formatDateTime(integrity.checkedAt)}
      </p>
    </section>
  )
}
