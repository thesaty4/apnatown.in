import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.APP_BASE_URL;
if (!baseURL)
  throw new Error(
    'APP_BASE_URL is required; invoke through the root local environment loader',
  );

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'pnpm start',
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    // Probe transport readiness separately so a broken page redirect fails its
    // own assertion instead of hiding behind a two-minute server-start timeout.
    url: new URL('/api/health/live', baseURL).toString(),
    reuseExistingServer: false,
    timeout: 120_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 860 } } },
    { name: 'small-mobile', use: { viewport: { width: 360, height: 800 } } },
  ],
});
