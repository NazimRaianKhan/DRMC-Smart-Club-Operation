import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const existingServer = process.env.REGISTRATION_TEST_BASE_URL;
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'registration.spec.ts', workers: 1,
  timeout: 60000, reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL: existingServer || 'http://localhost:3100', trace: 'retain-on-failure' },
  webServer: existingServer ? undefined : {
    command: 'pnpm exec next start --port 3100', url: 'http://localhost:3100/en',
    reuseExistingServer: false, timeout: 60000,
  },
});
