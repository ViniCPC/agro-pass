import { expect, test } from '@playwright/test'

test('demo persiste e passaporte abre sem API ou sessao', async ({ page, context }) => {
  // Block every API call while still allowing the production app assets.
  await context.route('http://localhost:3000/**', route => route.abort())
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Entrar na demo' }).first().click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.reload()
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(await page.evaluate(() => localStorage.getItem('agropass.demoMode'))).toBe('true')

  await page.goto('/trace/DEMO-2025-0001')
  await expect(page.getByRole('heading', { name: 'Lote DEMO-2025-0001' })).toBeVisible()
  await expect(page.getByText('Cadeia íntegra').first()).toBeVisible()
  // Seven lifecycle stages plus the two document attachments in the fixture.
  await expect(page.locator('ol > li article')).toHaveCount(9)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Lote DEMO-2025-0001' })).toBeVisible()
})

test('landing abre sem API e leva ao passaporte do lote exibido', async ({ page, context }) => {
  await context.route('http://localhost:3000/**', route => route.abort())
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'A origem registrada. A trajetória à vista.' }),
  ).toBeVisible()
  await expect(page.getByText('Demonstração com dados fictícios').first()).toBeVisible()
  await expect(page.getByRole('img', { name: 'QR Code do passaporte AGP-2026-0002' }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Abrir um passaporte' }).first().click()
  await expect(page.getByRole('heading', { name: 'Lote AGP-2026-0002' })).toBeVisible()
  await expect(page.getByText('Cadeia íntegra').first()).toBeVisible()
  await expect(page.locator('ol > li article')).toHaveCount(7)
})

test('demo do zero, trocando de papel a cada etapa, sem API', async ({ page, context }) => {
  await context.route('http://localhost:3000/**', route => route.abort())
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Entrar na demo' }).first().click()
  await expect(page).toHaveURL(/\/dashboard$/)
  // The visitor starts as the producer.
  await expect(page.getByLabel('Atuando como')).toHaveValue('PRODUCER')

  await page.goto('/farms')
  await page.getByRole('link', { name: 'Cadastrar propriedade' }).first().click()
  await page.getByLabel('Nome da propriedade').fill('Sítio Demo E2E')
  await page.getByLabel('Município').fill('Franca')
  await page.getByLabel('UF').selectOption('SP')
  await page.getByLabel('Latitude').fill('-20,5386')
  await page.getByLabel('Longitude').fill('-47,4008')
  await page.getByLabel('Nome do produtor').fill('Ana Teste')
  await page.getByRole('button', { name: 'Cadastrar propriedade' }).click()
  await page.getByRole('link', { name: 'Criar primeiro lote' }).click()

  await page.getByLabel('Produto').selectOption('COFFEE')
  await page.getByLabel('Quantidade').fill('40')
  await page.getByLabel('Unidade').fill('sacas')
  await page.getByRole('button', { name: 'Criar lote' }).first().click()
  const dialog = page.getByRole('dialog')
  const batchCode = (await dialog.getByRole('heading').textContent())?.trim() ?? ''
  expect(batchCode).toMatch(/^DEMO-\d{4}-\d{4}$/)
  await dialog.getByRole('button', { name: 'Ver detalhes do lote' }).click()
  await expect(page.getByText(/existe só neste navegador/)).toBeVisible()

  const record = async (stage: string, location: string, notes: string) => {
    await page.getByLabel(/^Local/).fill(location)
    await page.getByLabel(/^Observações/).fill(notes)
    await page.getByRole('button', { name: `Registrar etapa: ${stage}` }).click()
    await expect(page.getByText(`Etapa “${stage}” registrada`)).toBeVisible()
  }

  await record('Colhido', 'Talhão 2', 'Colheita manual')
  await page.getByRole('button', { name: 'Atuar como cooperativa' }).first().click()
  await record('Recebido', 'Armazém em Franca', 'Recebidas 40 sacas')
  await page.getByLabel('Arquivo', { exact: true }).setInputFiles({
    name: 'recibo.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(`%PDF-1.4\n% demo ${Date.now()}\n%%EOF\n`),
  })
  await page.getByLabel(/Mostrar o arquivo no passaporte público/).check()
  await page.getByRole('button', { name: 'Anexar documento' }).click()
  await expect(page.getByText('“recibo.pdf” anexado')).toBeVisible()

  await page.getByRole('button', { name: 'Atuar como operador logístico' }).click()
  await record('Em trânsito', 'Saída de Franca', 'Caminhão ABC1D23')
  await page.getByRole('button', { name: 'Atuar como cooperativa' }).first().click()
  await record('Processado', 'Beneficiadora', 'Tipo 2')
  await page.getByRole('button', { name: 'Atuar como operador logístico' }).click()
  await record('Entregue', 'Porto de Santos/SP', 'Entregue ao comprador')

  await page.getByRole('button', { name: 'Atuar como administrador' }).first().click()
  await page.getByRole('button', { name: 'Revisar e encerrar lote' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar encerramento' }).click()
  await expect(page.getByText('Etapa 7 de 7: Encerrado')).toBeVisible()
  await page.getByRole('button', { name: 'Publicar passaporte' }).click()

  const passportPage = context.waitForEvent('page')
  await page.getByRole('link', { name: 'Abrir como quem escaneou o QR' }).click()
  const passport = await passportPage
  await expect(passport.getByRole('heading', { name: `Lote ${batchCode}` })).toBeVisible()
  await expect(passport.getByText('Cadeia íntegra').first()).toBeVisible()
  await expect(passport.locator('ol > li article')).toHaveCount(8)
  await expect(passport.getByText('Recebidas 40 sacas')).toBeVisible()
  await expect(passport.getByText('Ana Teste').first()).toBeVisible()
})
