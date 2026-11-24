import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { findDemoBatch } from '@/mocks/demo-store'
import { makeBatch } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { BatchLifecyclePanel } from './BatchLifecyclePanel'

describe('BatchLifecyclePanel', () => {
  it('oferece a proxima etapa ao papel responsavel por ela', () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'CREATED' })} />, {
      user: { role: 'PRODUCER' },
    })

    expect(screen.getByRole('button', { name: 'Registrar etapa: Colhido' })).toBeEnabled()
    expect(screen.getByText('Etapa 1 de 7: Criado')).toBeInTheDocument()
  })

  it('outros papeis veem quem deve registrar a etapa', () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'RECEIVED' })} />, {
      user: { role: 'PRODUCER' },
    })

    expect(screen.queryByRole('button', { name: /Registrar etapa/ })).not.toBeInTheDocument()
    expect(screen.getByText(/registrada por operador logístico/)).toBeInTheDocument()
  })

  it('so o admin encerra e publica o passaporte', () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'DELIVERED' })} />, {
      user: { role: 'ADMIN' },
    })

    expect(screen.getByRole('button', { name: 'Encerrar lote' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar passaporte' })).toBeInTheDocument()
  })

  it('lote encerrado nao aceita novas etapas', () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'CLOSED' })} />, {
      user: { role: 'ADMIN' },
    })

    expect(screen.queryByRole('button', { name: /Registrar etapa|Encerrar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/não aceita novas etapas/)).toBeInTheDocument()
  })

  it('na demo registra a etapa sem API', async () => {
    // demo-batch-0004 is a bundled demo batch, still CREATED.
    const batch = findDemoBatch('demo-batch-0004')!
    renderWithProviders(<BatchLifecyclePanel batch={batch} />, { demo: true })

    await userEvent.click(screen.getByRole('button', { name: 'Registrar etapa: Colhido' }))

    await waitFor(() => expect(findDemoBatch('demo-batch-0004')?.status).toBe('HARVESTED'))
  })
})
