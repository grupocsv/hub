import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const diagnostics = new WeakMap();

test.beforeEach(async ({ page }) => {
  const state = { externalRequests: [], pageErrors: [], consoleErrors: [] };
  diagnostics.set(page, state);

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== "http://127.0.0.1:4180"
    ) {
      state.externalRequests.push(
        `${request.method()} ${url.origin}${url.pathname}`,
      );
    }
  });
  page.on("pageerror", (error) => {
    state.pageErrors.push(`${error.name}: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") state.consoleErrors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  const state = diagnostics.get(page);
  expect(
    state?.externalRequests ?? [],
    "A suíte não pode acessar serviços externos.",
  ).toEqual([]);
  expect(
    state?.pageErrors ?? [],
    "A página não pode emitir exceções não tratadas.",
  ).toEqual([]);
  expect(
    state?.consoleErrors ?? [],
    "A página não pode registrar erros no console.",
  ).toEqual([]);
});

async function openCatalog(page) {
  await page.goto("/documentos/?portal=unimed");
  await expect(page.locator("#docs-content")).toBeVisible();
  await expect(page.locator(".docs-card")).toHaveCount(2);
}

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    rootClientWidth: document.documentElement.clientWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    dimensions.rootScrollWidth,
    `Overflow horizontal no documento: ${JSON.stringify(dimensions)}`,
  ).toBeLessThanOrEqual(dimensions.rootClientWidth);
  expect(
    dimensions.bodyScrollWidth,
    `Overflow horizontal no corpo: ${JSON.stringify(dimensions)}`,
  ).toBeLessThanOrEqual(dimensions.bodyClientWidth);
}

async function expectNoWcagViolations(page, include) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (include) builder = builder.include(include);
  const result = await builder.analyze();
  expect(
    result.violations,
    result.violations
      .map((violation) => {
        const targets = violation.nodes
          .flatMap((node) => node.target)
          .join(", ");
        return `${violation.id}: ${targets}`;
      })
      .join("\n"),
  ).toEqual([]);
}

function requestLog(page) {
  return page
    .locator("html")
    .getAttribute("data-e2e-requests")
    .then((value) => {
      return value ? JSON.parse(value) : [];
    });
}

test("catálogo cobre paginação, busca, filtros e favorito sem perder foco", async ({
  page,
}) => {
  await openCatalog(page);

  const loadMore = page.getByRole("button", { name: "Carregar Mais" });
  await expect(loadMore).toBeVisible();
  await loadMore.click();
  await expect(page.locator(".docs-card")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "Norma Arquivada" }),
  ).toBeVisible();

  await page
    .getByRole("searchbox", { name: "Buscar Documentos" })
    .fill("privacidade");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.locator(".docs-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Política de Privacidade" }),
  ).toBeVisible();

  await page.getByRole("searchbox", { name: "Buscar Documentos" }).fill("");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.locator(".docs-card")).toHaveCount(2);
  await page.locator("#docs-classification-filter").selectOption("public");
  await page.getByRole("button", { name: "Aplicar Filtros" }).click();
  await expect(page.locator(".docs-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Política de Privacidade" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Limpar" }).click();
  await expect(page.locator(".docs-card")).toHaveCount(2);
  const favorite = page.getByRole("button", {
    name: "Favoritar: Manual Seguro em PDF",
  });
  await favorite.focus();
  await page.keyboard.press("Enter");
  const unfavorite = page.getByRole("button", {
    name: "Remover dos favoritos: Manual Seguro em PDF",
  });
  await expect(unfavorite).toHaveAttribute("aria-pressed", "true");
  await expect(unfavorite).toBeFocused();

  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(page.locator(".docs-card")).toHaveCount(2);
  await expect(
    page.getByRole("heading", { name: "Manual Seguro em PDF" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Política de Privacidade" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("viewer usa PDF Range autenticado, rota sem segredo e teclado coerente", async ({
  page,
}, testInfo) => {
  await openCatalog(page);
  await page
    .getByRole("button", { name: "Ver detalhes de Manual Seguro em PDF" })
    .click();
  await expect(page.locator("#docs-detail")).toBeVisible();
  await page.getByRole("button", { name: "Abrir Documento" }).click();

  const viewer = page.locator("#docs-viewer");
  await expect(viewer).toBeVisible();
  await expect(page.locator("#docs-viewer-canvas")).toBeVisible();
  await expect(page.locator("#docs-viewer-page")).toHaveText("Página 1 de 1");

  await expect
    .poll(async () => {
      const log = await requestLog(page);
      return log.filter(
        (entry) =>
          entry.path ===
            "/v1/documents/document-pdf/versions/version-pdf/bytes" &&
          entry.method === "GET" &&
          typeof entry.range === "string",
      ).length;
    })
    .toBeGreaterThan(0);

  const log = await requestLog(page);
  const ticketRequest = log.find((entry) =>
    entry.path.endsWith("/viewer-tickets"),
  );
  const headRequest = log.find(
    (entry) => entry.path.endsWith("/bytes") && entry.method === "HEAD",
  );
  const rangeRequests = log.filter(
    (entry) =>
      entry.path.endsWith("/bytes") &&
      entry.method === "GET" &&
      typeof entry.range === "string",
  );
  expect(ticketRequest).toMatchObject({
    method: "POST",
    hasSession: true,
    hasViewerTicket: false,
  });
  expect(headRequest).toMatchObject({
    hasSession: true,
    hasViewerTicket: true,
  });
  expect(rangeRequests.length).toBeGreaterThan(0);
  expect(rangeRequests.every((entry) => entry.hasViewerTicket === true)).toBe(
    true,
  );
  expect(page.url()).not.toMatch(/ticket|token|auth/i);

  if (testInfo.project.name !== "chromium-desktop-1440x900") {
    await expect(viewer).toHaveAttribute("role", "dialog");
    await expect(viewer).toHaveAttribute("aria-modal", "true");
    await expect(
      page.locator('button[data-action="close-viewer"]'),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator('[data-action="viewer-download"]')).toBeFocused();
  } else {
    await expect(viewer).toHaveAttribute("role", "region");
    await expect(viewer).not.toHaveAttribute("aria-modal", "true");
  }

  await expectNoHorizontalOverflow(page);
  await expectNoWcagViolations(page, "#docs-viewer");
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  expect(page.url()).not.toContain("#document=");
  const detail = page.locator("#docs-detail");
  const openDocument = page.getByRole("button", { name: "Abrir Documento" });
  await expect(detail).toBeVisible();
  await expect(openDocument).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(detail).toBeHidden();
  await expect(
    page.getByRole("button", {
      name: "Ver detalhes de Manual Seguro em PDF",
    }),
  ).toBeFocused();
});

test("catálogo e diálogo de upload cumprem axe, overflow e navegação por teclado", async ({
  page,
}) => {
  await openCatalog(page);
  await expectNoHorizontalOverflow(page);
  await expectNoWcagViolations(page);

  const uploadButton = page.getByRole("button", { name: "Enviar Documento" });
  await expect(uploadButton).toBeVisible();
  await uploadButton.focus();
  await page.keyboard.press("Enter");

  const dialog = page.locator("#docs-upload-dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("#docs-upload-document-title")).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await expectNoWcagViolations(page, "#docs-upload-dialog");

  const uploadClose = page.getByRole("button", { name: "Cancelar Envio" });
  const uploadSubmit = page
    .locator("#docs-upload-form")
    .getByRole("button", { name: "Enviar" });
  await uploadClose.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(uploadSubmit).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(uploadClose).toBeFocused();

  await page.locator("#docs-upload-document-title").fill("Evidência E2E");
  await page
    .locator("#docs-upload-description")
    .fill("Arquivo local sintético para validar o fluxo progressivo.");
  await page
    .locator("#docs-upload-collection")
    .selectOption("collection-guides");
  await page.locator("#docs-upload-file").setInputFiles({
    name: "evidencia-e2e.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Evidência local sem dados pessoais."),
  });
  await uploadSubmit.click();

  await expect(page.locator("#docs-upload-status")).toHaveText(
    "Documento processado com sucesso.",
    { timeout: 15_000 },
  );
  await expect(page.locator("#docs-upload-processing")).toBeVisible();
  await expect(page.locator("#docs-upload-processing")).toContainText(
    "Segurança",
  );
  await expect(page.locator("#docs-upload-processing")).toContainText("clean");

  const log = await requestLog(page);
  expect(
    log.some(
      (entry) =>
        entry.path === "/v1/upload-sessions/upload-e2e/bytes" &&
        entry.method === "PUT" &&
        entry.hasContentSha256 === true,
    ),
  ).toBe(true);
  expect(
    log.some(
      (entry) =>
        entry.path === "/v1/upload-sessions/upload-e2e/complete" &&
        entry.method === "POST",
    ),
  ).toBe(true);

  await uploadClose.focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(uploadButton).toBeFocused();
});
