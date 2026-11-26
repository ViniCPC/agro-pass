import { useState } from 'react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SignupInput } from '@/api/authApi'
import { ApiError } from '@/api/client'
import { BatchPreviewCard } from '@/features/batches/BatchPreviewCard'
import { CreateBatchForm } from '@/features/batches/CreateBatchForm'
import { DEFAULT_CREATE_BATCH_FORM, type CreateBatchFormValues } from '@/features/batches/create-batch.constants'
import { listDemoFarms } from '@/mocks/demo-farms'
import { clearDemoData, createDemoBatch } from '@/mocks/demo-store'
import { renderWithProviders } from '@/test/render'
import { LoginPage } from './LoginPage'
import { SignupPage } from './SignupPage'

afterEach(() => clearDemoData())

async function fillSignup(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    'Nome completo': 'Ana Souza',
    Email: 'ana@example.com',
    Telefone: '(64) 99999-0000',
    'CPF ou CNPJ': '123.456.789-01',
    Senha: 'senha-segura',
    ...overrides,
  }
  for (const [label, value] of Object.entries(values)) {
    if (value) await userEvent.type(screen.getByLabelText(label), value)
  }
}

describe('cadastro de usuario', () => {
  it('o login leva ao cadastro', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
  })

  it('cria a conta de produtor enviando so os digitos do telefone e do documento', async () => {
    const signup = vi.fn(async (input: SignupInput) => void input)
    renderWithProviders(<SignupPage />, { signup, route: '/cadastro' })

    await fillSignup()
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(signup).toHaveBeenCalledWith({
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: 'senha-segura',
      phone: '64999990000',
      document: '12345678901',
    })
  })

  it('aceita o codigo de convite vindo do link da cooperativa', async () => {
    const signup = vi.fn(async (input: SignupInput) => void input)
    const code = '7f1c2a9e-3b4d-4c5e-8f60-1a2b3c4d5e6f'
    renderWithProviders(<SignupPage />, { signup, route: `/cadastro?convite=${code}` })

    expect(screen.getByLabelText(/Código de convite/)).toHaveValue(code)
    await fillSignup()
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(signup.mock.calls[0][0]).toMatchObject({ inviteCode: code })
  })

  it('valida antes de enviar', async () => {
    const signup = vi.fn()
    renderWithProviders(<SignupPage />, { signup })

    await fillSignup({ Telefone: '9999', 'CPF ou CNPJ': '123', Senha: 'curta' })
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByText(/Use DDD \+ número/)).toBeInTheDocument()
    expect(screen.getByText(/Informe um CPF \(11 dígitos\) ou CNPJ/)).toBeInTheDocument()
    expect(screen.getByText('A senha precisa de pelo menos 8 caracteres.')).toBeInTheDocument()
    expect(signup).not.toHaveBeenCalled()
  })

  it('mostra o motivo de um conflito vindo da API', async () => {
    renderWithProviders(<SignupPage />, {
      signup: async () => {
        throw new ApiError(409, '{"message":"Este email já tem uma conta. Entre com ele."}')
      },
    })
    await fillSignup()
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este email já tem uma conta. Entre com ele.')
  })
})

// The page itself needs window.matchMedia; its form and preview are tested here.
function BatchFormHarness({ initial }: { initial?: Partial<CreateBatchFormValues> }) {
  const [values, setValues] = useState<CreateBatchFormValues>({ ...DEFAULT_CREATE_BATCH_FORM, ...initial })
  return (
    <>
      <CreateBatchForm
        farms={[]}
        values={values}
        errors={{}}
        isSubmitting={false}
        canSubmit={false}
        onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        onSubmit={() => undefined}
      />
      <BatchPreviewCard values={values} selectedFarm={null} />
    </>
  )
}

describe('criacao de lote', () => {
  it('unidade comeca vazia, com exemplo pelo produto, e o produto tem acento', async () => {
    renderWithProviders(<BatchFormHarness />)

    const unit = screen.getByLabelText('Unidade')
    expect(unit).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Café' })).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Produto'), 'COFFEE')
    expect(unit).toHaveAttribute('placeholder', 'Ex.: sacas de 60 kg')
    // Typing gives exactly what was typed, not "sacassacas".
    await userEvent.type(unit, 'sacas')
    expect(unit).toHaveValue('sacas')
    await userEvent.type(screen.getByLabelText('Quantidade'), '80')
    expect(within(screen.getByRole('complementary')).getByText('80 sacas')).toBeInTheDocument()
  })

  it('na demo a previa mostra o codigo que o lote vai receber', async () => {
    renderWithProviders(<BatchFormHarness />, { demo: true })

    const year = new Date().getUTCFullYear()
    const preview = screen.getByRole('complementary')
    expect(within(preview).getByText(`DEMO-${year}-0101`)).toBeInTheDocument()
    expect(within(preview).queryByText(/AGP-/)).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/Data da colheita/), '2025-06-10')
    expect(within(preview).getByText('DEMO-2025-0101')).toBeInTheDocument()

    // The created batch gets the code the preview showed.
    expect(createDemoBatch({ farmId: listDemoFarms()[0].id, productType: 'COFFEE', quantity: 1, unit: 'kg', harvestDate: '2025-06-10' }, 'ADMIN').code).toBe('DEMO-2025-0101')
  })

  it('com a API a previa nao inventa o numero do lote', () => {
    renderWithProviders(<BatchFormHarness />)
    const preview = screen.getByRole('complementary')
    expect(within(preview).getByText(`AGP-${new Date().getUTCFullYear()}-····`)).toBeInTheDocument()
    expect(within(preview).getByText('O número é atribuído quando o lote é criado.')).toBeInTheDocument()
  })
})
