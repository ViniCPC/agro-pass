import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import { useDemoMode } from '@/contexts/demo-context'

// With an API (dev, or a deploy with VITE_API_URL), "Entrar na demo" opens an
// isolated visit on the server: real API, real proof. VITE_DEMO_MODE=local
// forces the offline demo, which keeps everything in the browser;
// VITE_DEMO_MODE=server forces the server one (browser E2E).
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE as string | undefined
export const SERVER_DEMO =
  DEMO_MODE === 'server' ||
  (DEMO_MODE !== 'local' && (import.meta.env.DEV || Boolean(import.meta.env.VITE_API_URL)))

function demoErrorMessage(error: ApiError) {
  if (error.status === 429) return 'Muitas demonstrações abertas a partir desta rede. Aguarde alguns minutos e tente de novo.'
  if (error.status === 503) return 'Muitas demonstrações abertas agora. Tente de novo em alguns minutos.'
  return `Não foi possível abrir a demonstração (erro ${error.status}).`
}

export function useEnterDemo() {
  const navigate = useNavigate()
  const { startDemoSession } = useAuth()
  const { enableDemoMode } = useDemoMode()
  const [isEntering, setIsEntering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openOfflineDemo() {
    enableDemoMode()
    navigate('/dashboard')
  }

  async function enter() {
    setError(null)
    if (!SERVER_DEMO) return openOfflineDemo()
    setIsEntering(true)
    try {
      await startDemoSession()
      navigate('/dashboard')
    } catch (caught) {
      // A refusal from the server is shown; an unreachable server (offline,
      // asleep, CORS) falls back to the demo that runs in the browser.
      if (caught instanceof ApiError) setError(demoErrorMessage(caught))
      else openOfflineDemo()
    } finally {
      setIsEntering(false)
    }
  }

  return { enter, isEntering, error, openOfflineDemo }
}
