import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function EnterDemoButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/dashboard')}
      className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
    >
      Entrar na demo
      <ArrowRight size={15} strokeWidth={2.5} />
    </button>
  )
}
