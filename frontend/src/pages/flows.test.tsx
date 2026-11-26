import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import { listDemoFarms } from '@/mocks/demo-farms'
import { clearDemoData } from '@/mocks/demo-store'
import { renderWithProviders } from '@/test/render'
import { CreateFarmPage } from './CreateFarmPage'
import { LoginPage } from './LoginPage'

afterEach(() => clearDemoData())

describe('cadastro de propriedade', () => {
  it('na demo cadastra e oferece criar o primeiro lote nela', async () => {
    renderWithProviders(<CreateFarmPage />, { demo: true, demoRole: 'PRODUCER' })

    await userEvent.type(screen.getByLabelText('Nome da propriedade'), 'Sítio Recanto')
    await userEvent.type(screen.getByLabelText('Município'), 'Franca')
    await userEvent.selectOptions(screen.getByLabelText('UF'), 'SP')
    await userEvent.type(screen.getByLabelText('Latitude'), '-20,5386')
    await userEvent.type(screen.getByLabelText('Longitude'), '-47,4008')
    await userEvent.type(screen.getByLabelText('Nome do produtor'), 'Ana Teste')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar propriedade' }))

    expect(await screen.findByText('Propriedade cadastrada')).toBeInTheDocument()
    const farm = listDemoFarms()[0]
    expect(farm).toMatchObject({ name: 'Sítio Recanto', state: 'SP', latitude: -20.5386, producerName: 'Ana Teste' })
    expect(screen.getByRole('link', { name: 'Criar primeiro lote' })).toHaveAttribute(
      'href',
      `/batches/new?farmId=${farm.id}`,
    )
  }, 15_000) // Types every field: slow when the machine is busy.

  it('valida os campos antes de enviar', async () => {
    renderWithProviders(<CreateFarmPage />, { demo: true, demoRole: 'PRODUCER' })
    await userEvent.type(screen.getByLabelText('Latitude'), '120')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar propriedade' }))

    expect(screen.getByText('Informe o nome da propriedade.')).toBeInTheDocument()
    expect(screen.getByText('A latitude vai de -90 a 90.')).toBeInTheDocument()
    expect(screen.queryByText('Propriedade cadastrada')).not.toBeInTheDocument()
  })

  it('papeis que nao cadastram propriedades sao orientados', () => {
    renderWithProviders(<CreateFarmPage />, { user: { role: 'OPERATOR' } })
    expect(screen.queryByRole('button', { name: 'Cadastrar propriedade' })).not.toBeInTheDocument()
    expect(screen.getByText(/cadastradas pelo produtor ou por um administrador/)).toBeInTheDocument()
  })
})

describe('login', () => {
  async function submitWith(error: unknown) {
    renderWithProviders(<LoginPage />, {
      login: async () => {
        throw error
      },
    })
    await userEvent.type(screen.getByLabelText('Email'), 'admin@agropass.local')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    return screen.findByRole('alert')
  }

  it('credenciais erradas', async () => {
    expect(await submitWith(new ApiError(401, '{"message":"Credenciais invalidas"}'))).toHaveTextContent(
      'Email ou senha inválidos.',
    )
  })

  it('API fora do ar nao parece senha errada', async () => {
    const alert = await submitWith(new TypeError('Failed to fetch'))
    expect(alert).toHaveTextContent(/Não foi possível falar com o servidor/)
    expect(alert).not.toHaveTextContent(/inválidos/)
  })

  it('erro do servidor', async () => {
    expect(await submitWith(new ApiError(500, 'Internal'))).toHaveTextContent(/erro 500/)
  })

  it('mostra as contas de teste por papel em desenvolvimento', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /Cooperativa/ }))
    expect(screen.getByLabelText('Email')).toHaveValue('cooperativa@agropass.local')
  })
})
