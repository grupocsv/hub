import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const port = 4182;
export default defineConfig({
  testDir: "./tests/central-links/e2e",
  testMatch: "**/*.spec.mjs",
  outputDir: path.join(os.tmpdir(), "hub-central-links-playwright"),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: "line",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    headless: true,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    serviceWorkers: "block",
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command: `node tests/central-links/e2e/server.mjs --port ${port}`,
    url: `http://127.0.0.1:${port}/__e2e__/health`,
    reuseExistingServer: !process.env.CI,
  },
});
