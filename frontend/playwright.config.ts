import { defineConfig, devices } from '@playwright/test'

// Browser E2E of the main flow against the real API and the production
// build. Requires a migrated and seeded database (see README).
const APP_URL = process.env.E2E_APP_URL ?? 'http://localhost:4173'
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000'
const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://agro_pass_test:agro_pass_test@localhost:55432/agro_pass_test'

if (!new URL(DATABASE_URL).pathname.toLowerCase().includes('test')) {
  throw new Error('O E2E precisa de um banco exclusivo com test no nome.')
}

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: APP_URL,
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Locally, PLAYWRIGHT_CHANNEL=chrome reuses the installed Chrome.
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start:prod',
      cwd: '../backend',
      url: `${API_URL}/health/live`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL,
        NODE_ENV: 'production',
        JWT_SECRET: 'agropass-e2e-browser-secret-for-tests-only',
        PORT: new URL(API_URL).port || '3000',
        PUBLIC_APP_URL: APP_URL,
        PUBLIC_BACKEND_URL: API_URL,
        CORS_ORIGINS: APP_URL,
        // Proofs go to the in-memory provider: no network in tests.
        BLOCKCHAIN_ENABLED: 'true',
        BLOCKCHAIN_PROVIDER: 'local',
      },
    },
    {
      command: `npm run preview -- --port ${new URL(APP_URL).port} --strictPort`,
      url: APP_URL,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
