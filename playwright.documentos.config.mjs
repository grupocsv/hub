import os from 'node:os';
import path from 'node:path';

import { defineConfig } from '@playwright/test';

const E2E_PORT = 4180;
const BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

export default defineConfig({
  testDir: './tests/documentos/e2e',
  testMatch: '**/*.spec.mjs',
  outputDir: path.join(os.tmpdir(), 'hub-documentos-playwright-results'),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    colorScheme: 'light',
    headless: true,
    locale: 'pt-BR',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `node tests/documentos/browser-fixture-server.mjs --port ${E2E_PORT}`,
    url: `${BASE_URL}/__e2e__/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium-mobile-390x844',
      testIgnore: '**/hub-documentos-reflow.spec.mjs',
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'chromium-tablet-768x1024',
      testIgnore: '**/hub-documentos-reflow.spec.mjs',
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'chromium-desktop-1440x900',
      testIgnore: '**/hub-documentos-reflow.spec.mjs',
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-reflow-320x800-reduced-motion',
      testMatch: '**/hub-documentos-reflow.spec.mjs',
      use: {
        reducedMotion: 'reduce',
        viewport: { width: 320, height: 800 },
      },
    },
  ],
});
