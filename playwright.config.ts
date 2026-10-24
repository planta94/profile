import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // `veriscribe scan` expects journeys at e2e/journeys/<slice>.e2e.spec.ts
  testDir: './e2e',
  // Journeys write manual artifacts and share one dev server; keep them sequential.
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // Evidence consumed by `veriscribe gate` (gate.playwrightReport in veriscribe.config.ts)
    ['json', { outputFile: 'qa-system/reports/playwright-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 1280px compresses the floating navbar; capture manuals at a realistic laptop width.
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },
});
