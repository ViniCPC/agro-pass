import { Link } from 'react-router-dom'
import { QrCode, ScanLine } from 'lucide-react'

interface BatchQrCellProps {
  id: string
  code: string
  publicCode: string
}

export function BatchQrCell({ id, code, publicCode }: BatchQrCellProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Link
        to={`/batches/${id}`}
        title={`Abrir lote ${code}`}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-teal-600)] hover:underline"
      >
        <QrCode size={13} strokeWidth={2} />
        Detalhes e QR
      </Link>
      <Link
        to={`/trace/${encodeURIComponent(publicCode)}`}
        title={`Abrir passaporte público de ${code}`}
        className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-ink-subtle)] hover:text-[var(--color-teal-700)] hover:underline"
      >
        <ScanLine size={12} strokeWidth={2} />
        Passaporte público
      </Link>
      <span className="font-mono text-[10px] text-[var(--color-ink-subtle)]">{code}</span>
    </div>
  )
}
