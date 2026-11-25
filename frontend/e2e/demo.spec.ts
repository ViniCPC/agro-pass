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
