import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'

const ADMIN = { email: 'admin@agropass.local', password: 'AgroPass@2026' }

const STAGES = ['Colhido', 'Recebido', 'Em trânsito', 'Processado', 'Entregue']

function decodeQr(png: Buffer): string | null {
  const image = PNG.sync.read(png)
  return jsQR(new Uint8ClampedArray(image.data), image.width, image.height)?.data ?? null
}

async function recordStage(page: Page, buttonName: string) {
  const button = page.getByRole('button', { name: buttonName })
  await button.click()
  // The button changes to the following stage once the API confirms.
  await expect(button).toBeHidden()
}

test('login → criar lote → registrar etapas → encerrar → gerar QR → abrir passaporte', async ({
  page,
  browser,
}) => {
  // 1. Login
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN.email)
  await page.getByLabel('Senha').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // 2. Create a batch
  await page.goto('/batches/new')
  await page.getByLabel('Fazenda de origem').selectOption({ label: 'Fazenda Santa Fé — Rio Verde/GO' })
  await page.getByLabel('Produto').selectOption('COFFEE')
  await page.getByLabel('Quantidade').fill('60')
  await page.getByLabel('Unidade').fill('sacas')
  await page.getByLabel('Data da colheita').fill('2026-07-01')
  await page.getByRole('button', { name: 'Criar lote' }).first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Lote criado com sucesso')).toBeVisible()
  const batchCode = (await dialog.getByRole('heading').textContent())?.trim() ?? ''
  expect(batchCode).toMatch(/^AGP-\d{4}-\d{4,}$/)
  await dialog.getByRole('button', { name: 'Ver detalhes do lote' }).click()
  await expect(page.getByRole('heading', { name: batchCode })).toBeVisible()
  await expect(page.getByText('01 de jul. de 2026', { exact: true })).toBeVisible()

  // 3. Record every stage, each one a hash-chained event
  for (const stage of STAGES) {
    await recordStage(page, `Registrar etapa: ${stage}`)
  }

  // 4. Close the batch: the final chain hash goes to the (local) blockchain
  await recordStage(page, 'Encerrar lote')
  await expect(page.getByText('Etapa 7 de 7: Encerrado')).toBeVisible()
  await expect(page.getByText('Prova registrada na rede local (ambiente de testes)')).toBeVisible()
  await page.getByRole('button', { name: 'Publicar passaporte' }).click()
  await expect(page.getByRole('button', { name: 'Tornar privado' })).toBeVisible()

  // 5. Generate the QR: on-screen image and PNG download both open the passport
  const qrImage = page.getByRole('img', { name: `QR Code do passaporte ${batchCode}` })
  const dataUrl = (await qrImage.getAttribute('src')) ?? ''
  const screenTarget = decodeQr(Buffer.from(dataUrl.split(',')[1], 'base64'))
  expect(screenTarget).toMatch(new RegExp(`/trace/${batchCode}$`))

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Baixar PNG' }).click(),
  ])
  const pngTarget = decodeQr(await readFile((await download.path())!))
  expect(pngTarget).toBe(screenTarget)

  await page.getByRole('button', { name: 'Folha PDF' }).click()
  const labels = page.getByRole('dialog')
  for (const copies of [4, 8, 16]) {
    await labels.getByRole('button', { name: String(copies), exact: true }).click()
    await expect(labels.getByText(`Pré-visualização · ${copies} etiquetas`)).toBeVisible()
    const [pdf] = await Promise.all([
      page.waitForEvent('download'),
      labels.getByRole('button', { name: 'Baixar PDF' }).click(),
    ])
    const bytes = await readFile((await pdf.path())!)
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  }
  await labels.getByRole('button', { name: 'Fechar', exact: true }).click()

  // 6. Open the passport like a phone that scanned the label, with no session
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    timezoneId: 'America/Sao_Paulo',
  })
  const passport = await phone.newPage()
  await passport.goto(screenTarget!)
  await passport.reload()

  await expect(passport.getByRole('heading', { name: `Lote ${batchCode}` })).toBeVisible()
  await expect(passport.getByText('01 de jul. de 2026', { exact: true })).toBeVisible()
  await expect(passport.getByText('Cadeia íntegra').first()).toBeVisible()
  await expect(passport.locator('ol > li article')).toHaveCount(7)
  await expect(passport.getByText('Passaporte encerrado').first()).toBeVisible()
  await expect(passport.getByText('Confere com o hash final da cadeia de eventos')).toBeVisible()

  const scrollWidth = await passport.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
  await phone.close()
})
