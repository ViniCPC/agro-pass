import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { TouchFriendlyButton } from '@/components/TouchFriendlyButton'
import { cn } from '@/lib/utils'
import { useRunEudrValidation } from '@/hooks/useFarmValidations'

interface RunEudrValidationButtonProps {
  farmId: string
  className?: string
  fullWidth?: boolean
}

export function RunEudrValidationButton({
  farmId,
  className,
  fullWidth = false,
}: RunEudrValidationButtonProps) {
  const { mutate, isPending, isSuccess, isError } = useRunEudrValidation(farmId)
  const [ran, setRan] = useState(false)

  const handleClick = () => {
    setRan(true)
    mutate()
  }

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <TouchFriendlyButton
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
          fullWidth && 'w-full justify-center',
          'bg-[var(--color-teal-700,#0f766e)] text-white shadow-sm',
          'hover:bg-[var(--color-teal-800,#0d6660)] active:scale-[0.98]',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100',
        )}
      >
        {isPending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <ShieldCheck size={15} />
        )}
        {isPending ? 'Validando…' : 'Executar Validação EUDR'}
      </TouchFriendlyButton>

      {ran && !isPending && isSuccess && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-green-700,#15803d)]">
          <CheckCircle2 size={13} />
          Validação concluída — status atualizado
        </div>
      )}

      {ran && !isPending && isError && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-red-700,#b91c1c)]">
          <AlertCircle size={13} />
          Falha na validação. Verifique a conexão com o servidor.
        </div>
      )}

      {isPending && (
        <p className="text-[11px] text-[var(--color-ink-subtle)] animate-pulse">
          Consultando MapBiomas + PRODES + Hansen + Sentinel-2…
        </p>
      )}
    </div>
  )
}
