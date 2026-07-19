import { defineConfig, devices } from '@playwright/test'

// Enterprise Verification & Certification Program — Phase 3 (Enterprise Test Suite).
//
// This suite drives the RealEstateProperty Wizard end to end against a real
// running instance of this app (which itself talks to the live EspoCRM
// staging API at ESPO_API_URL — see .env.local). There is no mocked backend:
// every spec creates, edits, or reads real records.
//
// Required environment variables (none are committed, none are guessed):
//   E2E_BASE_URL   - app origin to test against (defaults to localhost:3000)
//   E2E_USERNAME   - a real EspoCRM login with permission to manage RealEstateProperty
//   E2E_PASSWORD   - that user's password
// Without E2E_USERNAME/E2E_PASSWORD, the auth setup project fails fast with a
// clear error instead of silently skipping authentication.
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // property records created by one spec can affect list/search state for another
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Auto-starts the app against the real EspoCRM staging API (ESPO_API_URL in
  // .env.local) when E2E_BASE_URL isn't set to point at an already-running one.
  // Not used in CI, where the app should already be deployed/running.
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
})
