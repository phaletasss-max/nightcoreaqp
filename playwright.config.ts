import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// En esta máquina el cache global de Playwright (ms-playwright) es un junction
// roto → los navegadores viven en .pw-browsers/ del proyecto (gitignored).
// Si la carpeta existe, se usa; si no (CI u otra máquina), el default de siempre.
const localBrowsers = path.join(__dirname, '.pw-browsers');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(localBrowsers)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsers;
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3092',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3092',
    reuseExistingServer: true,
  },
});
