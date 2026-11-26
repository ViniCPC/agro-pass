import { expect, test } from '@playwright/test'

// "Entrar na demo" with the API up: an isolated visit on the server, no
// sign-up. Needs a build with VITE_DEMO_MODE=server (see the CI workflow).
test('demo no servidor: sessão isolada, fazenda pronta e um perfil por papel', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Entrar na demo' }).first().click()
  await expect(page).toHaveURL(/\/dashboard$/)
  // A real session (not the browser demo), starting as the admin.
  await expect(page.getByLabel('Atuando como')).toHaveValue('ADMIN')
  expect(await page.evaluate(() => localStorage.getItem('agropass.demoMode'))).not.toBe('true')

  // Only the visit's own farm: the seeded real data stays out of reach.
  await page.goto('/farms')
  await expect(page.getByText('Fazenda Boa Vista').first()).toBeVisible()
  await expect(page.getByText('Fazenda Santa Fé')).toHaveCount(0)

  await page.goto('/batches/new')
  await page.getByLabel('Fazenda de origem').selectOption({ label: 'Fazenda Boa Vista — Patrocínio/MG' })
  await page.getByLabel('Produto').selectOption('COFFEE')
  await page.getByLabel('Quantidade').fill('40')
  await page.getByLabel('Unidade').fill('sacas')
  await page.getByRole('button', { name: 'Criar lote' }).first().click()
  const dialog = page.getByRole('dialog')
  const batchCode = (await dialog.getByRole('heading').textContent())?.trim() ?? ''
  // Demo visits have their own series: real AGP- codes are never taken.
  expect(batchCode).toMatch(/^DEMO-\d{4}-\d{4}$/)
  await dialog.getByRole('button', { name: 'Ver detalhes do lote' }).click()
  await expect(page.getByRole('heading', { name: batchCode })).toBeVisible()
  const batchUrl = page.url()

  // The producer account of the visit records the harvest.
  await page.getByLabel('Atuando como').selectOption('PRODUCER')
  await page.getByLabel(/^Local/).fill('Talhão 1')
  await page.getByRole('button', { name: 'Registrar etapa: Colhido' }).click()
  await expect(page.getByText('Etapa “Colhido” registrada')).toBeVisible()

  // Operators only see a batch once the cooperative received it.
  await page.getByLabel('Atuando como').selectOption('OPERATOR')
  await page.goto(batchUrl)
  await expect(page.getByText('Lote não encontrado')).toBeVisible()

  await page.getByLabel('Atuando como').selectOption('COOPERATIVE')
  await page.goto(batchUrl)
  await page.getByRole('button', { name: 'Registrar etapa: Recebido' }).click()
  await expect(page.getByText('Etapa “Recebido” registrada')).toBeVisible()

  // Going to /login ends the visit and shows the form.
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('agropass.demoSession'))).toBeNull()
})
