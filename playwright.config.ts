import { defineConfig, devices } from '@playwright/test';
import { testOrigin, testPort } from './e2e/test-origin';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: { baseURL: testOrigin, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      process.env.E2E_PRODUCTION === '1'
        ? `npm run start -- --port ${testPort}`
        : `npm run dev -- --port ${testPort}`,
    url: testOrigin + '/login',
    env: { APP_URL: testOrigin },
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    timeout: 120_000,
  },
});
