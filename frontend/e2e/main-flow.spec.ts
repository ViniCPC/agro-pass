import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'

// Accounts from backend/prisma/seed.ts.
const PASSWORD = 'AgroPass@2026'
const ADMIN = 'admin@agropass.local'
const PRODUCER = 'produtor@agropass.local'

const STAGES: Array<{ name: string; location: string; notes: string }> = [
  { name: 'Colhido', location: 'Talhão 4', notes: 'Colheita manual, 60 sacas' },
  { name: 'Recebido', location: 'Armazém da cooperativa, Rio Verde/GO', notes: 'Recebidas 60 sacas de 60 kg' },
  { name: 'Em trânsito', location: 'Saída de Rio Verde/GO', notes: 'Caminhão ABC1D23, destino Santos/SP' },
  { name: 'Processado', location: 'Unidade de beneficiamento', notes: 'Rebeneficiado, tipo 2' },
  { name: 'Entregue', location: 'Porto de Santos/SP', notes: 'Entregue ao comprador' },
]

function decodeQr(png: Buffer): string | null {
  const image = PNG.sync.read(png)
  return jsQR(new Uint8ClampedArray(image.data), image.width, image.height)?.data ?? null
}

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

// From the farms page to the batch detail page of a new batch on a new farm.
async function startFromZero(page: Page, farmName: string, pickProducer: boolean) {
  await page.goto('/farms')
  await page.getByRole('link', { name: 'Cadastrar propriedade' }).first().click()
  await page.getByLabel('Nome da propriedade').fill(farmName)
  await page.getByLabel('Município').fill('Rio Verde')
  await page.getByLabel('UF').selectOption('GO')
  await page.getByLabel('Latitude').fill('-17,7988')
  await page.getByLabel('Longitude').fill('-50,9398')
  if (pickProducer) {
    await page.getByLabel('Produtor', { exact: true }).selectOption({ label: 'Carlos Alberto Mendes' })
  }
  await page.getByRole('button', { name: 'Cadastrar propriedade' }).click()
  await expect(page.getByText('Propriedade cadastrada')).toBeVisible()

  await page.getByRole('link', { name: 'Criar primeiro lote' }).click()
  await expect(page.getByLabel('Fazenda de origem')).toHaveValue(/.+/)
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
  return batchCode
}

async function recordStage(page: Page, stage: (typeof STAGES)[number]) {
  await page.getByLabel(/^Local/).fill(stage.location)
  await page.getByLabel(/^Observações/).fill(stage.notes)
  await page.getByRole('button', { name: `Registrar etapa: ${stage.name}` }).click()
  await expect(page.getByText(`Etapa “${stage.name}” registrada`)).toBeVisible()
}

test('do zero: propriedade → lote → etapas com informações → documento → encerrar → publicar → passaporte', async ({
  page,
  browser,
}) => {
  const runId = Date.now()
  await login(page, ADMIN)
  const batchCode = await startFromZero(page, `Fazenda E2E ${runId}`, true)
  await expect(page.getByText('01 de jul. de 2026', { exact: true })).toBeVisible()
  // Private until published: the header does not link to a missing page.
  await expect(page.getByRole('link', { name: 'Ver passaporte público' })).toHaveCount(0)

  // 1. Stages, each one with what happened and where
  await recordStage(page, STAGES[0])
  await recordStage(page, STAGES[1])

  // 2. Attach a document: its hash becomes an event in the chain
  await page.getByLabel('Tipo do documento').selectOption('INVOICE')
  await page.getByLabel('Arquivo', { exact: true }).setInputFiles({
    name: `nota-${runId}.pdf`,
    mimeType: 'application/pdf',
    // Unique bytes per run: the API refuses a file it already has.
    buffer: Buffer.from(`%PDF-1.4\n% AgroPass E2E ${runId}\n%%EOF\n`),
  })
  await page.getByLabel(/Mostrar o arquivo no passaporte público/).check()
  await page.getByRole('button', { name: 'Anexar documento' }).click()
  await expect(page.getByText(`“nota-${runId}.pdf” anexado`)).toBeVisible()
  await expect(page.getByRole('list', { name: 'Documentos anexados' }).getByText('Nota fiscal')).toBeVisible()

  for (const stage of STAGES.slice(2)) await recordStage(page, stage)

  // 3. Close after a review
  await page.getByRole('button', { name: 'Revisar e encerrar lote' }).click()
  const review = page.getByRole('dialog')
  await expect(review.getByText('1 documento anexado.')).toBeVisible()
  await review.getByRole('button', { name: 'Confirmar encerramento' }).click()
  await expect(page.getByText('Etapa 7 de 7: Encerrado')).toBeVisible()
  // The E2E API uses the in-memory provider: shown as a simulated proof.
  await expect(page.getByText('Prova simulada — nenhuma transação enviada à Solana')).toBeVisible()

  // 4. Publish: the next steps start with it
  await expect(page.getByText('Próximos passos')).toBeVisible()
  await page.getByRole('button', { name: 'Publicar passaporte' }).click()
  await expect(page.getByText('Publicado: qualquer pessoa com o QR abre a página.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver passaporte público' })).toBeVisible()

  // 5. The QR: on-screen image and PNG download both open the passport
  const qrImage = page.getByRole('img', { name: `QR Code do passaporte ${batchCode}` })
  const dataUrl = (await qrImage.getAttribute('src')) ?? ''
  const screenTarget = decodeQr(Buffer.from(dataUrl.split(',')[1], 'base64'))
  expect(screenTarget).toMatch(new RegExp(`/trace/${batchCode}$`))

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Baixar PNG' }).click(),
  ])
  expect(decodeQr(await readFile((await download.path())!))).toBe(screenTarget)

  await page.getByRole('button', { name: 'Folha PDF' }).click()
  const labels = page.getByRole('dialog')
  for (const copies of [4, 8, 16]) {
    await labels.getByRole('button', { name: String(copies), exact: true }).click()
    await expect(labels.getByText(`Pré-visualização · ${copies} etiquetas`)).toBeVisible()
    const [pdf] = await Promise.all([
      page.waitForEvent('download'),
      labels.getByRole('button', { name: 'Baixar PDF' }).click(),
    ])
    expect((await readFile((await pdf.path())!)).subarray(0, 5).toString()).toBe('%PDF-')
  }
  await labels.getByRole('button', { name: 'Fechar', exact: true }).click()

  // 6. A phone that scanned the label, with no session, sees what was recorded
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
  // Seven lifecycle stages plus the document attachment.
  await expect(passport.locator('ol > li article')).toHaveCount(8)
  await expect(passport.getByText('Armazém da cooperativa, Rio Verde/GO')).toBeVisible()
  await expect(passport.getByText('Recebidas 60 sacas de 60 kg')).toBeVisible()
  await expect(passport.getByText(`nota-${runId}.pdf`).first()).toBeVisible()
  await expect(passport.getByText('Passaporte encerrado').first()).toBeVisible()
  await expect(passport.getByText('Confere com o hash final da cadeia de eventos')).toBeVisible()

  const scrollWidth = await passport.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
  await phone.close()
})

test('papel limitado: o produtor registra a colheita e é orientado sobre a próxima etapa', async ({ page }) => {
  await login(page, PRODUCER)
  // The property is linked to the producer's own account: no producer picker.
  await page.goto('/farms/new')
  await expect(page.getByText(/Vinculada à sua conta de produtor/)).toBeVisible()
  await startFromZero(page, `Sítio do Produtor ${Date.now()}`, false)

  await recordStage(page, STAGES[0])

  await expect(page.getByText('Próxima etapa: Recebido, registrada pela cooperativa.')).toBeVisible()
  await expect(page.getByText('Entre com uma conta de cooperativa para continuar.').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Registrar etapa/ })).toHaveCount(0)
  // Documents and publication belong to other roles too.
  await expect(page.getByText('Documentos são anexados pela cooperativa ou por um administrador.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Publicar passaporte' })).toHaveCount(0)
  await expect(page.getByText('Passaporte ainda não publicado')).toBeVisible()
})
