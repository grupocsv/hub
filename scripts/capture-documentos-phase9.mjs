import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";

const VIEWPORTS = Object.freeze([
  Object.freeze({
    fileName: "desktop-1440x900.png",
    width: 1440,
    height: 900,
  }),
  Object.freeze({
    fileName: "mobile-390x844.png",
    width: 390,
    height: 844,
  }),
]);

function fail(message) {
  throw new Error(message);
}

async function capture(browser, baseUrl, outputDirectory, viewport) {
  const context = await browser.newContext({
    colorScheme: "light",
    locale: "pt-BR",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    timezoneId: "America/Sao_Paulo",
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();
  const externalRequests = [];
  const pageErrors = [];
  const consoleErrors = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== baseUrl
    ) {
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(`${error.name}: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    await page.goto(`${baseUrl}/documentos/?portal=unimed`, {
      waitUntil: "networkidle",
    });
    await page.locator("#docs-content").waitFor({ state: "visible" });
    await page
      .getByRole("button", { name: "Ver detalhes de Manual Seguro em PDF" })
      .click();
    await page.locator("#docs-detail").waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Abrir Documento" }).click();
    await page.locator("#docs-viewer").waitFor({ state: "visible" });
    await page.locator("#docs-viewer-canvas").waitFor({ state: "visible" });
    await page.evaluate(async () => {
      await document.fonts?.ready;
    });

    const dimensions = await page.evaluate(() => ({
      rootClientWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      viewerRole: document.querySelector("#docs-viewer")?.getAttribute("role"),
    }));
    if (dimensions.rootScrollWidth > dimensions.rootClientWidth) {
      fail(`Overflow horizontal em ${viewport.fileName}.`);
    }
    const expectedRole = viewport.width <= 768 ? "dialog" : "region";
    if (dimensions.viewerRole !== expectedRole) {
      fail(`Semântica responsiva divergente em ${viewport.fileName}.`);
    }
    if (page.url().match(/ticket|token|auth/i)) {
      fail(`URL sensível em ${viewport.fileName}.`);
    }
    if (
      externalRequests.length > 0 ||
      pageErrors.length > 0 ||
      consoleErrors.length > 0
    ) {
      fail(
        `Diagnóstico do navegador falhou em ${viewport.fileName}: ${JSON.stringify(
          {
            externalRequests,
            pageErrors,
            consoleErrors,
          },
        )}`,
      );
    }

    const outputPath = path.join(outputDirectory, viewport.fileName);
    await page.screenshot({
      animations: "disabled",
      fullPage: false,
      path: outputPath,
      type: "png",
    });
    const bytes = await readFile(outputPath);
    return Object.freeze({
      fileName: viewport.fileName,
      height: viewport.height,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      width: viewport.width,
    });
  } finally {
    await context.close();
  }
}

async function main() {
  if (process.argv.length !== 3) {
    fail(
      "Uso: node scripts/capture-documentos-phase9.mjs <diretório-de-evidências>.",
    );
  }
  const outputDirectory = path.resolve(process.argv[2]);
  try {
    await lstat(outputDirectory);
    fail(`Diretório de evidências já existe: ${outputDirectory}.`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const outputParent = path.dirname(outputDirectory);
  await mkdir(outputParent, { recursive: true });
  const stagingDirectory = await mkdtemp(
    path.join(outputParent, `.capture-${path.basename(outputDirectory)}-`),
  );

  process.env.DOCUMENTOS_E2E_PUBLIC_ROOT = path.join(
    "docs",
    ".vitepress",
    "dist",
  );
  let browser;
  let server;
  let serverListening = false;
  let promoted = false;
  try {
    const { createBrowserFixtureServer } =
      await import("../tests/documentos/browser-fixture-server.mjs");
    server = createBrowserFixtureServer();
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    serverListening = true;
    const address = server.address();
    if (address === null || typeof address === "string") {
      fail("A fixture não informou uma porta TCP válida.");
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;

    browser = await chromium.launch({ headless: true });
    const evidence = [];
    for (const viewport of VIEWPORTS) {
      evidence.push(
        await capture(browser, baseUrl, stagingDirectory, viewport),
      );
    }
    await rename(stagingDirectory, outputDirectory);
    promoted = true;
    process.stdout.write(
      `${JSON.stringify(
        evidence.map(({ fileName, ...item }) => ({
          ...item,
          file: path.join(outputDirectory, fileName),
        })),
        null,
        2,
      )}\n`,
    );
  } finally {
    try {
      await browser?.close();
      if (serverListening) {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      } else {
        server?.close();
      }
    } finally {
      if (!promoted) {
        await rm(stagingDirectory, { force: true, recursive: true });
      }
    }
  }
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
