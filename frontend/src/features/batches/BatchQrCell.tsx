import { useNavigate } from 'react-router-dom'
import { QrCode } from 'lucide-react'

interface BatchQrCellProps {
  code: string
}

export function BatchQrCell({ code }: BatchQrCellProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={() => navigate(`/trace/${encodeURIComponent(code)}`)}
        title={`Ver rastreabilidade de ${code}`}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-teal-600)] hover:underline cursor-pointer"
      >
        <QrCode size={13} strokeWidth={2} />
        Rastrear
      </button>
      <span className="font-mono text-[10px] text-[var(--color-ink-subtle)]">{code}</span>
    </div>
  )
}
