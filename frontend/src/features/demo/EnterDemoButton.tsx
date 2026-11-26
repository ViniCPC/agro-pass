import { ArrowRight, Loader2 } from 'lucide-react'
import { DemoEntryError } from './DemoEntryError'
import { useEnterDemo } from './useEnterDemo'

export function EnterDemoButton() {
  const { enter, isEntering, error, openOfflineDemo } = useEnterDemo()

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void enter()}
        disabled={isEntering}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-3 bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-70"
      >
        {isEntering ? 'Preparando sua demonstração...' : 'Entrar na demo'}
        {isEntering ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} strokeWidth={2.5} />}
      </button>
      {error && <DemoEntryError message={error} onOffline={openOfflineDemo} />}
    </div>
  )
}
