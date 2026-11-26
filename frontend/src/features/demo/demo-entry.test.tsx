import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { RoleHandoff } from '@/features/auth/RoleHandoff'
import { LandingEnterDemoButton } from '@/features/landing/EnterDemoButton'
import { LoginPage } from '@/pages/LoginPage'
import { renderWithProviders } from '@/test/render'

function EnterDemo() {
  return (
    <Routes>
      <Route path="/" element={<LandingEnterDemoButton />} />
      <Route path="/dashboard" element={<p>Painel</p>} />
    </Routes>
  )
}

describe('entrar na demo', () => {
  it('abre uma sessao no servidor e vai ao painel', async () => {
    const startDemoSession = vi.fn(async () => undefined)
    const enableDemoMode = vi.fn()
    renderWithProviders(<EnterDemo />, { startDemoSession, enableDemoMode })

    await userEvent.click(screen.getByRole('button', { name: /Explorar demonstração/ }))

    expect(await screen.findByText('Painel')).toBeInTheDocument()
    expect(startDemoSession).toHaveBeenCalledOnce()
    expect(enableDemoMode).not.toHaveBeenCalled()
  })

  it('com o servidor fora do ar, cai na demo offline', async () => {
    const enableDemoMode = vi.fn()
    renderWithProviders(<EnterDemo />, {
      startDemoSession: async () => {
        throw new TypeError('Failed to fetch')
      },
      enableDemoMode,
    })

    await userEvent.click(screen.getByRole('button', { name: /Explorar demonstração/ }))

    expect(await screen.findByText('Painel')).toBeInTheDocument()
    expect(enableDemoMode).toHaveBeenCalledOnce()
  })

  it('limite atingido mostra o motivo e oferece a demo offline', async () => {
    const enableDemoMode = vi.fn()
    renderWithProviders(<EnterDemo />, {
      startDemoSession: async () => {
        throw new ApiError(429, '{"message":"Too Many Requests"}')
      },
      enableDemoMode,
    })

    await userEvent.click(screen.getByRole('button', { name: /Explorar demonstração/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Aguarde alguns minutos/)
    expect(enableDemoMode).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir a demonstração offline' }))
    expect(enableDemoMode).toHaveBeenCalledOnce()
  })
})

describe('demo no servidor', () => {
  it('troca para a conta do papel responsavel pela etapa', async () => {
    const switchDemoRole = vi.fn()
    renderWithProviders(<RoleHandoff role="COOPERATIVE">Próxima etapa: Recebido.</RoleHandoff>, {
      user: { role: 'PRODUCER', demoSessionId: 'sessao-1' },
      demoSession: { expiresAt: new Date(Date.now() + 3_600_000).toISOString() },
      switchDemoRole,
    })

    await userEvent.click(screen.getByRole('button', { name: 'Atuar como cooperativa' }))
    expect(switchDemoRole).toHaveBeenCalledWith('COOPERATIVE')
  })

  it('conta real nao ganha troca de papel', () => {
    renderWithProviders(<RoleHandoff role="COOPERATIVE">Próxima etapa.</RoleHandoff>, {
      user: { role: 'PRODUCER' },
    })
    expect(screen.queryByRole('button', { name: /Atuar como/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Entre com uma conta de cooperativa/)).toBeInTheDocument()
  })

  it('ir ao login encerra a demo e mostra o formulario', () => {
    const logout = vi.fn()
    const disableDemoMode = vi.fn()
    renderWithProviders(<LoginPage />, {
      user: { role: 'ADMIN', demoSessionId: 'sessao-1' },
      logout,
      demo: true,
      disableDemoMode,
    })

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(logout).toHaveBeenCalled()
    expect(disableDemoMode).toHaveBeenCalled()
  })
})
