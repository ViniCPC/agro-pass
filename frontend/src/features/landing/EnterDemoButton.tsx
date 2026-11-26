import { ArrowUpRight, Loader2 } from 'lucide-react'
import { DemoEntryError } from '@/features/demo/DemoEntryError'
import { useEnterDemo } from '@/features/demo/useEnterDemo'
import { PRIMARY_BUTTON } from './landing-ui'

// Opens a demo visit (on the server when there is an API) and the dashboard.
export function LandingEnterDemoButton({
  className = PRIMARY_BUTTON,
  label = 'Explorar demonstração',
}: {
  className?: string
  label?: string
}) {
  const { enter, isEntering, error, openOfflineDemo } = useEnterDemo()

  return (
    <span className="inline-flex flex-col gap-2">
      <button type="button" onClick={() => void enter()} disabled={isEntering} className={className}>
        {isEntering ? 'Preparando...' : label}
        {isEntering ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <ArrowUpRight size={17} aria-hidden />}
      </button>
      {error && <DemoEntryError message={error} onOffline={openOfflineDemo} />}
    </span>
  )
}
