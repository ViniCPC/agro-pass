import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { clearDemoData, findDemoBatch, findDemoBatchEvents } from '@/mocks/demo-store'
import { makeBatch } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { BatchLifecyclePanel } from './BatchLifecyclePanel'

afterEach(() => clearDemoData())

describe('BatchLifecyclePanel', () => {
  it('oferece a proxima etapa ao papel responsavel, com local e observacoes', () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'CREATED' })} />, {
      user: { role: 'PRODUCER', name: 'Carlos Alberto Mendes' },
    })

    expect(screen.getByRole('button', { name: 'Registrar etapa: Colhido' })).toBeEnabled()
    expect(screen.getByLabelText(/Local/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Observações/)).toBeInTheDocument()
    expect(screen.getByText('Carlos Alberto Mendes (Produtor)')).toBeInTheDocument()
    expect(screen.getByText('Etapa 1 de 7: Criado')).toBeInTheDocument()
  })

  it('outros papeis veem quem registra a etapa e como continuar', () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'RECEIVED' })} />, {
      user: { role: 'PRODUCER' },
    })

    expect(screen.queryByRole('button', { name: /Registrar etapa/ })).not.toBeInTheDocument()
    expect(screen.getByText(/registrada pelo operador logístico/)).toBeInTheDocument()
    expect(screen.getByText(/Entre com uma conta de operador logístico/)).toBeInTheDocument()
  })

  it('o encerramento passa por uma revisao antes de confirmar', async () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'DELIVERED' })} eventCount={6} documentCount={0} />, {
      user: { role: 'ADMIN' },
    })

    expect(screen.queryByRole('button', { name: 'Confirmar encerramento' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Revisar e encerrar lote' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/6 eventos na cadeia/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Nenhum documento anexado/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Confirmar encerramento' })).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Voltar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('so o admin encerra; os outros papeis sao orientados', () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'DELIVERED' })} />, {
      user: { role: 'COOPERATIVE' },
    })

    expect(screen.queryByRole('button', { name: /encerrar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/O encerramento é feito por um administrador/)).toBeInTheDocument()
  })

  it('lote encerrado e privado mostra os proximos passos, comecando pela publicacao', () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'CLOSED', isPublic: false })} />, {
      user: { role: 'ADMIN' },
    })

    expect(screen.queryByRole('button', { name: /Registrar etapa|Encerrar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/não aceita novas etapas/)).toBeInTheDocument()
    expect(screen.getByText('Próximos passos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar passaporte' })).toBeInTheDocument()
    expect(screen.getByText('Disponível depois da publicação.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Abrir como quem escaneou/ })).not.toBeInTheDocument()
  })

  it('cancelamento exige um motivo', async () => {
    renderWithProviders(<BatchLifecyclePanel batch={makeBatch({ status: 'RECEIVED' })} />, {
      user: { role: 'ADMIN' },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar lote' }))
    const confirm = screen.getByRole('button', { name: 'Confirmar cancelamento' })
    expect(confirm).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Motivo'), 'Lote duplicado por engano')
    expect(confirm).toBeEnabled()
  })

  it('na demo registra a etapa com as informacoes digitadas, sem API', async () => {
    // demo-batch-0004 is a bundled demo batch, still CREATED.
    const batch = findDemoBatch('demo-batch-0004')!
    renderWithProviders(<BatchLifecyclePanel batch={batch} />, { demo: true, demoRole: 'PRODUCER' })

    await userEvent.type(screen.getByLabelText(/Local/), 'Talhão 7')
    await userEvent.type(screen.getByLabelText(/Observações/), 'Colheita manual')
    await userEvent.click(screen.getByRole('button', { name: 'Registrar etapa: Colhido' }))

    await waitFor(() => expect(findDemoBatch('demo-batch-0004')?.status).toBe('HARVESTED'))
    const last = findDemoBatchEvents('demo-batch-0004').at(-1)!
    expect(last).toMatchObject({ type: 'HARVESTED', location: 'Talhão 7', notes: 'Colheita manual' })
    expect(last.actor.role).toBe('PRODUCER')
    expect(await screen.findByText(/Etapa “Colhido” registrada/)).toBeInTheDocument()
  })

  it('na demo, quando a etapa e de outro papel, oferece trocar de papel', () => {
    const batch = findDemoBatch('demo-batch-0004')!
    renderWithProviders(<BatchLifecyclePanel batch={batch} />, { demo: true, demoRole: 'OPERATOR' })

    expect(screen.queryByRole('button', { name: /Registrar etapa/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Atuar como produtor' })).toBeInTheDocument()
  })
})
