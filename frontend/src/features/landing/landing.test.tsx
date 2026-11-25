import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeLogoLink } from '@/components/HomeLogoLink'
import { HomeRoute } from '@/features/auth/HomeRoute'
import { LandingPage } from '@/pages/LandingPage'
import { renderWithProviders } from '@/test/render'
import { validateDemoRequest, EMPTY_DEMO_REQUEST } from './demo-request-validation'
import { DemoRequestForm } from './DemoRequestForm'
import { LandingHeader } from './LandingHeader'

// jsdom has no canvas: QR images are not what these tests are about.
vi.mock('@/hooks/useQrDataUrl', () => ({
  useQrDataUrl: () => ({ data: 'data:image/png;base64,AAAA', isError: false }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LandingPage', () => {
  it('abre com foto, etiqueta QR e o recorte do passaporte, com um botao principal', () => {
    const { container } = renderWithProviders(<LandingPage />)
    const hero = screen.getByRole('region', { name: 'A origem registrada. A trajetória à vista.' })

    expect(within(hero).getByText('Demonstração com dados fictícios')).toBeInTheDocument()
    expect(within(hero).getByRole('img', { name: 'Sacas de café empilhadas em um armazém' })).toBeInTheDocument()
    expect(within(hero).getByRole('img', { name: 'QR Code do passaporte AGP-2026-0002' })).toBeInTheDocument()
    expect(within(hero).getByText('Origem registrada')).toBeInTheDocument()
    expect(within(hero).getByText('7 etapas · Integridade verificada')).toBeInTheDocument()
    expect(within(within(hero).getByRole('list', { name: 'Etapas do lote' })).getAllByRole('listitem')).toHaveLength(7)
    // One main button; the passport is a secondary link.
    expect(within(hero).getAllByRole('button')).toHaveLength(1)
    expect(within(hero).getByRole('button', { name: 'Explorar demonstração' })).toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: /Abrir um passaporte/ })).toHaveAttribute('href', '/trace/DEMO-2026-0002')

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    for (const [label, hash] of [
      ['Plataforma', '#plataforma'],
      ['Rastreabilidade', '#rastreabilidade'],
      ['Demonstração', '#demonstracao'],
    ]) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', hash)
      expect(container.querySelector(hash)).not.toBeNull()
    }
  })

  it('troca a tela da plataforma pelas abas, com clique e com as setas', async () => {
    renderWithProviders(<LandingPage />)
    const platform = screen.getByRole('region', { name: 'Três telas, um lote inteiro.' })
    const tabs = within(platform).getAllByRole('tab')
    expect(tabs.map((tab) => tab.getAttribute('aria-labelledby') && document.getElementById(tab.getAttribute('aria-labelledby')!)?.textContent)).toEqual([
      'Registrar origem',
      'Acompanhar etapas',
      'Compartilhar passaporte',
    ])
    expect(within(platform).getByRole('tab', { name: 'Acompanhar etapas' })).toBe(tabs[1])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(within(platform).getByRole('tabpanel')).toHaveTextContent('Criar lote')
    expect(within(platform).getByRole('tabpanel')).toHaveTextContent('Fazenda Boa Esperança')

    await userEvent.click(tabs[1])
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    const stages = await within(platform).findByRole('list', { name: 'Etapas registradas do lote AGP-2026-0002' })
    expect(within(stages).getAllByRole('listitem')).toHaveLength(7)

    await userEvent.keyboard('{ArrowRight}')
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[2]).toHaveFocus()
    expect(await within(platform).findByText('Folha A4 com 4, 8 ou 16 etiquetas')).toBeInTheDocument()
  })

  it('mostra o fluxo do produtor ao comprador com os registros do lote', () => {
    renderWithProviders(<LandingPage />)
    const flow = screen.getByRole('region', { name: 'Do produtor ao comprador.' })

    for (const actor of ['Produtor', 'Cooperativa', 'Transporte', 'Comprador']) {
      expect(within(flow).getByRole('heading', { name: actor })).toBeInTheDocument()
    }
    expect(within(flow).getByText('Recebimento confirmado')).toBeInTheDocument()
    expect(within(flow).getByText('Fazenda Boa Esperança, talhão 4')).toBeInTheDocument()
    expect(within(flow).getByRole('img', { name: /lavoura de café/ })).toBeInTheDocument()
    expect(within(flow).getByRole('link', { name: /Ver o passaporte/ })).toHaveAttribute('href', '/trace/DEMO-2026-0002')
  })

  it('credita as fotos como a licenca CC BY pede', () => {
    renderWithProviders(<LandingPage />)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'CC BY 2.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/2.0/')
    expect(within(footer).getByRole('link', { name: '“Thousands of bean bags”' })).toHaveAttribute('href', expect.stringContaining('commons.wikimedia.org'))
    expect(within(footer).getByRole('link', { name: '“Coffee plantation, Kauaʻi 58”' })).toHaveAttribute('href', expect.stringContaining('commons.wikimedia.org'))
  })

  it('so pede contato no fim da pagina', () => {
    renderWithProviders(<LandingPage />)
    const final = screen.getByRole('region', { name: 'Abra a demonstração.' })
    expect(final).toContainElement(screen.getByRole('form', { name: 'Solicitar demonstração' }))
    expect(within(final).getByText('Perguntas frequentes')).toBeInTheDocument()
  })

  it('detecta a adulteracao do recebimento e volta a conferir ao restaurar', async () => {
    renderWithProviders(<LandingPage />)
    const integrity = screen.getByRole('region', { name: 'Documentos que dá para conferir. Uma cadeia que denuncia alterações.' })
    const ledger = within(integrity).getByRole('list', { name: 'Cadeia de hashes do lote' })

    expect(within(integrity).getByText('Cadeia íntegra: 7 de 7 etapas conferem.')).toBeInTheDocument()
    expect(within(ledger).getAllByText('Confere')).toHaveLength(7)
    expect(within(integrity).getByText(/pode ser ancorado em blockchain quando essa camada estiver habilitada/)).toBeInTheDocument()

    const field = within(integrity).getByLabelText(/Observação registrada na etapa #3/)
    expect(field).toHaveValue('Recebidas 120 sacas de 60 kg')
    await userEvent.clear(field)
    await userEvent.type(field, 'Recebidas 150 sacas de 60 kg')

    expect(
      within(integrity).getByText('Inconsistência na etapa #3: os dados armazenados não correspondem ao hash do evento.'),
    ).toBeInTheDocument()
    // Only the edited stage fails: the others still match their stored data.
    expect(within(ledger).getAllByText('Não confere')).toHaveLength(1)
    expect(within(ledger).getAllByText('Confere')).toHaveLength(6)

    await userEvent.click(within(integrity).getByRole('button', { name: 'Restaurar o registro original' }))
    expect(within(integrity).getByText('Cadeia íntegra: 7 de 7 etapas conferem.')).toBeInTheDocument()
  })

  it('confere o hash do documento baixado', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3])))
    vi.stubGlobal('fetch', fetch)
    renderWithProviders(<LandingPage />)
    const documents = screen.getByRole('list', { name: 'Documentos do lote' })
    expect(within(documents).getAllByRole('listitem')).toHaveLength(2)

    const [first] = within(documents).getAllByRole('button', { name: 'Conferir arquivo' })
    await userEvent.click(first)

    expect(fetch.mock.calls[0][0]).toMatch(/\/demo\/recibo-armazem-agp-2026-0002\.pdf$/)
    // Bytes that are not the registered file: the check must say so.
    expect(await within(documents).findByText(/Não confere: o arquivo baixado tem hash 039058c6f2/)).toBeInTheDocument()
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

describe('HomeLogoLink', () => {
  it('leva o visitante para a landing', () => {
    renderWithProviders(<HomeLogoLink />)
    expect(screen.getByRole('link', { name: 'AgroPass, página inicial' })).toHaveAttribute('href', '/')
  })

  it('leva quem ja esta no app para /inicio, que nao redireciona ao painel', () => {
    renderWithProviders(<HomeLogoLink />, { user: { role: 'ADMIN' } })
    expect(screen.getByRole('link', { name: 'AgroPass, página inicial' })).toHaveAttribute('href', '/inicio')
  })

  it('no cabecalho da landing troca "Entrar" por "Ir para o painel" para quem ja esta no app', () => {
    renderWithProviders(<LandingHeader />, { user: { role: 'ADMIN' } })
    expect(screen.getByRole('link', { name: 'Ir para o painel' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
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
