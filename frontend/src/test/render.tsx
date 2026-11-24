import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { AuthUser } from '@/api/authApi'
import { AuthContext } from '@/contexts/auth-context'
import { DemoModeContext } from '@/contexts/demo-context'

interface Options {
  user?: Partial<AuthUser> | null
  demo?: boolean
}

// Renders a component with the app providers, controlling who is logged in
// and whether demo mode is on.
export function renderWithProviders(ui: ReactNode, { user = null, demo = false }: Options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <DemoModeContext
        value={{ isDemoMode: demo, enableDemoMode: () => undefined, disableDemoMode: () => undefined }}
      >
        <AuthContext
          value={{
            user: user as AuthUser | null,
            isLoading: false,
            login: async () => undefined,
            logout: () => undefined,
          }}
        >
          <MemoryRouter>{ui}</MemoryRouter>
        </AuthContext>
      </DemoModeContext>
    </QueryClientProvider>,
  )
}
