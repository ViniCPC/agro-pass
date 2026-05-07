import { useNavigate } from 'react-router-dom'
import { QrCode, ScanLine } from 'lucide-react'

interface BatchQrCellProps {
  id: string
  code: string
}

export function BatchQrCell({ id, code }: BatchQrCellProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={() => navigate(`/batches/${id}`)}
        title={`Open lot ${code}`}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-teal-600)] hover:underline cursor-pointer"
      >
        <QrCode size={13} strokeWidth={2} />
        QR detail
      </button>
      <button
        onClick={() => navigate(`/trace/${encodeURIComponent(code)}`)}
        title={`Open public trace of ${code}`}
        className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-ink-subtle)] hover:text-[var(--color-teal-700)] hover:underline cursor-pointer"
      >
        <ScanLine size={12} strokeWidth={2} />
        Public trace
      </button>
      <span className="font-mono text-[10px] text-[var(--color-ink-subtle)]">{code}</span>
    </div>
  )
}
