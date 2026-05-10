import { CalendarDays, FileCheck2, Fingerprint } from 'lucide-react'
import type { PublicBatch } from '@/types/api'
import { formatDate } from './trace.utils'

interface TraceCertificateMetaProps {
  data: PublicBatch
}

export function TraceCertificateMeta({ data }: TraceCertificateMetaProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-page)] p-3 text-xs sm:grid-cols-3">
      <div className="inline-flex items-center gap-1.5 text-[var(--color-ink-muted)]">
        <FileCheck2 size={12} className="text-[var(--color-teal-700)]" />
        ID do certificado <span className="font-mono text-[var(--color-ink)]">CERT-{data.batch.code}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 text-[var(--color-ink-muted)]">
        <CalendarDays size={12} className="text-[var(--color-teal-700)]" />
        Emitido em {formatDate(data.batch.createdAt)}
      </div>
      <div className="inline-flex items-center gap-1.5 text-[var(--color-ink-muted)]">
        <Fingerprint size={12} className="text-[var(--color-teal-700)]" />
        Atualizado em {formatDate(data.batch.updatedAt)}
      </div>
    </div>
  )
}
