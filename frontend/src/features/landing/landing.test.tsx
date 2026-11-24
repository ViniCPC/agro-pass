import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeRoute } from '@/features/auth/HomeRoute'
import { LandingPage } from '@/pages/LandingPage'
import { renderWithProviders } from '@/test/render'
import { validateDemoRequest, EMPTY_DEMO_REQUEST } from './demo-request-validation'
import { DemoRequestForm } from './DemoRequestForm'

// jsdom has no canvas: QR images are not what these tests are about.
vi.mock('@/hooks/useQrDataUrl', () => ({
  useQrDataUrl: () => ({ data: 'data:image/png;base64,AAAA', isError: false }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LandingPage', () => {
  it('apresenta o produto com navegacao por secoes', () => {
    const { container } = renderWithProviders(<LandingPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'A trajetória completa do seu produto, do campo ao destino.' }),
    ).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    for (const [label, hash] of [
      ['Produto', '#produto'],
      ['Como funciona', '#como-funciona'],
      ['Para quem é', '#para-quem'],
      ['Segurança', '#seguranca'],
      ['Perguntas frequentes', '#faq'],
    ]) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', hash)
      expect(container.querySelector(hash)).not.toBeNull()
    }
  })

  it('mostra um lote real da demonstracao, verificado, com passaporte aberto sem login', () => {
    renderWithProviders(<LandingPage />)
    const showcase = screen.getByRole('region', { name: 'Conheça o passaporte digital AgroPass' })

    expect(within(showcase).getByText('AGP-2026-0001 — Café')).toBeInTheDocument()
    expect(within(showcase).getByText(/Fazenda Boa Esperança/)).toBeInTheDocument()
    expect(within(showcase).getByText('800 sacas')).toBeInTheDocument()
    expect(within(showcase).getByText('Verificada')).toBeInTheDocument()
    expect(within(showcase).getByText('Etapa atual')).toBeInTheDocument()
    expect(within(showcase).getByText('Entrega aguardando confirmação')).toBeInTheDocument()
    expect(within(showcase).getByRole('link', { name: /Abrir passaporte completo/ })).toHaveAttribute(
      'href',
      '/trace/DEMO-2026-0001',
    )
    expect(screen.getByRole('link', { name: 'Ver um lote rastreável' })).toHaveAttribute(
      'href',
      '/trace/DEMO-2026-0001',
    )
  })

  it('deixa o GitHub so no rodape', () => {
    renderWithProviders(<LandingPage />)
    const [header] = screen.getAllByRole('banner')
    const footer = screen.getByRole('contentinfo')

    expect(within(header).queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/privacidade')
  })
})

describe('HomeRoute', () => {
  const routes = (
    <Routes>
      <Route index element={<HomeRoute landing={<p>landing</p>} />} />
      <Route path="/dashboard" element={<p>painel</p>} />
    </Routes>
  )

  it('visitante ve a landing', () => {
    renderWithProviders(routes)
    expect(screen.getByText('landing')).toBeInTheDocument()
  })

  it('usuario logado ou na demo vai para o painel', () => {
    renderWithProviders(routes, { user: { role: 'ADMIN' } })
    expect(screen.getByText('painel')).toBeInTheDocument()
  })
})

describe('DemoRequestForm', () => {
  async function fillValid() {
    await userEvent.type(screen.getByLabelText('Nome'), 'Maria Souza')
    await userEvent.type(screen.getByLabelText('Empresa ou propriedade'), 'Fazenda Boa Esperança')
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com.br')
    await userEvent.selectOptions(screen.getByLabelText('Perfil'), 'COOPERATIVE')
    await userEvent.click(screen.getByRole('checkbox'))
  }

  it('valida no navegador e leva o foco ao primeiro campo invalido', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    renderWithProviders(<DemoRequestForm />)

    await userEvent.click(screen.getByRole('button', { name: 'Enviar pedido de demonstração' }))

    expect(screen.getByLabelText('Nome')).toHaveFocus()
    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Autorize o contato para enviar o pedido.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('envia o pedido e confirma o recebimento', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'req-1', receivedAt: '2026-11-26T12:00:00Z' }), { status: 201 }),
    )
    vi.stubGlobal('fetch', fetch)
    renderWithProviders(<DemoRequestForm />)

    await fillValid()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pedido de demonstração' }))

    expect(await screen.findByText('Pedido recebido.')).toBeInTheDocument()
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/\/public\/demo-requests$/)
    expect(JSON.parse(init.body as string)).toMatchObject({
      name: 'Maria Souza',
      email: 'maria@exemplo.com.br',
      profile: 'COOPERATIVE',
      consent: true,
    })
  })

  it('mostra a mensagem da API quando o envio e recusado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Muitas requisicoes. Tente novamente em instantes.' }), {
          status: 429,
        }),
      ),
    )
    renderWithProviders(<DemoRequestForm />)

    await fillValid()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pedido de demonstração' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas requisicoes')
  })

  it('avisa quando a API esta fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderWithProviders(<DemoRequestForm />)

    await fillValid()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pedido de demonstração' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível enviar agora'))
  })
})

describe('validateDemoRequest', () => {
  it('aceita telefone em branco e recusa telefone invalido', () => {
    const valid = {
      ...EMPTY_DEMO_REQUEST,
      name: 'Maria',
      company: 'Fazenda',
      email: 'maria@exemplo.com',
      profile: 'PRODUCER' as const,
      consent: true,
    }
    expect(validateDemoRequest(valid)).toEqual({})
    expect(validateDemoRequest({ ...valid, phone: 'abc' })).toHaveProperty('phone')
  })
})
