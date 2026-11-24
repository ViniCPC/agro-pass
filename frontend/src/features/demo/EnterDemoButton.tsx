import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useDemoMode } from '@/contexts/demo-context'

export function EnterDemoButton() {
  const navigate = useNavigate()
  const { enableDemoMode } = useDemoMode()

  function handleEnter() {
    enableDemoMode()
    navigate('/dashboard')
  }

  return (
    <button
      type="button"
      onClick={handleEnter}
      className="inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-3 bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
    >
      Entrar na demo
      <ArrowRight size={15} strokeWidth={2.5} />
    </button>
  )
}
