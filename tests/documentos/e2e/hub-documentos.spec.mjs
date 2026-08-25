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

test("cabeçalho em viewer split reflui marca, ações, sessão e navegação sem sobreposição", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop-1440x900");
  await openCatalog(page);
  await page
    .getByRole("button", { name: "Ver detalhes de Manual Seguro em PDF" })
    .click();
  await page.getByRole("button", { name: "Abrir Documento" }).click();
  await expect(page.locator("#docs-viewer")).toBeVisible();

  for (const width of [800, 1024, 1280, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.evaluate(() => {
      const selectors = [
        ".docs-brand",
        ".docs-topbar__actions",
        ".docs-nav",
      ];
      const rectangle = (element) => {
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        };
      };
      const sections = selectors.map((selector) => ({
        selector,
        ...rectangle(document.querySelector(selector)),
      }));
      const actionChildren = [
        ...document.querySelectorAll(".docs-topbar__actions > *"),
      ]
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => rectangle(element));
      const nav = document.querySelector(".docs-nav");
      const navChildren = [...nav.children]
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => rectangle(element));
      return {
        sections,
        actionChildren,
        navChildren,
        navFitsWithoutScroll: nav.scrollWidth <= nav.clientWidth,
        viewerLeft: document
          .querySelector("#docs-viewer")
          .getBoundingClientRect().left,
      };
    });
    for (const section of geometry.sections) {
      expect(section.left, `${width}px: ${section.selector}`).toBeGreaterThanOrEqual(-0.5);
      expect(section.right, `${width}px: ${section.selector}`).toBeLessThanOrEqual(
        geometry.viewerLeft + 0.5,
      );
    }
    for (let index = 1; index < geometry.sections.length; index += 1) {
      expect(
        geometry.sections[index].top,
        `${width}px: as linhas do cabeçalho não podem se sobrepor`,
      ).toBeGreaterThanOrEqual(geometry.sections[index - 1].bottom - 0.5);
    }
    for (const child of geometry.actionChildren) {
      expect(child.right, `${width}px: ação ou sessão fora da área útil`).toBeLessThanOrEqual(
        geometry.viewerLeft + 0.5,
      );
    }
    for (const child of geometry.navChildren) {
      expect(child.right, `${width}px: item de navegação cortado`).toBeLessThanOrEqual(
        geometry.viewerLeft + 0.5,
      );
    }
    expect(
      geometry.navFitsWithoutScroll,
      `${width}px: a navegação deve refluir sem rolagem horizontal`,
    ).toBe(true);
    await expectNoHorizontalOverflow(page);
  }
});

test("detalhe cria, lista e inativa link público preso à versão atual", async ({
  page,
}) => {
  await openCatalog(page);
  await page
    .getByRole("button", { name: "Ver detalhes de Manual Seguro em PDF" })
    .click();
  const publicLinks = page.locator("#docs-public-links");
  await expect(publicLinks).toBeVisible();
  await expect(publicLinks).toContainText(
    "A classificação do documento não cria um link público.",
  );
  await page.getByRole("button", { name: "Criar Link", exact: true }).click();
  const slug = page.getByLabel("Endereço Curto");
  await slug.fill("admin");
  await page.getByRole("button", { name: "Criar Link Público" }).click();
  await expect
    .poll(() => slug.evaluate((element) => element.validationMessage))
    .toContain("reservado");
  await slug.fill("manual-publico-e2e");
  await page.getByLabel("Forçar download ao abrir").check();
  await page.getByRole("button", { name: "Criar Link Público" }).click();
  await expect(publicLinks).toContainText("/manual-publico-e2e");
  await expect(publicLinks).toContainText("Ativo");
  await expect(publicLinks).toContainText("Forçar download");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Inativar link /manual-publico-e2e" }).click();
  await expect(publicLinks).toContainText("Inativo");

  const log = await requestLog(page);
  const creation = log.find(
    (entry) =>
      entry.path === "/v1/documents/document-pdf/public-links" &&
      entry.method === "POST",
  );
  expect(creation.body).toEqual({
    version_id: "version-pdf",
    slug: "manual-publico-e2e",
    expires_at: null,
    allow_download: true,
  });
  expect(creation.idempotencyKey).toBeTruthy();
  expect(
    log.some(
      (entry) =>
        entry.path.endsWith("/public-links/link-e2e-created") &&
        entry.method === "PATCH" &&
        Boolean(entry.idempotencyKey) &&
        entry.body.status === "inactive",
    ),
  ).toBe(true);
  await expectNoWcagViolations(page, "#docs-detail");
});

test("painel tenant-wide percorre cursores e administra links públicos", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4180",
  });
  await openCatalog(page);
  const navigation = page.getByRole("button", {
    name: "Links Públicos",
    exact: true,
  });
  await expect(navigation).toBeVisible();
  await navigation.click();
  await expect(page.locator("#docs-load-more")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Links Públicos" })).toBeVisible();
  await expect(page.locator(".docs-public-link--admin")).toHaveCount(2);
  await expect(page.locator("#docs-content")).toContainText("Documento document-privacy");
  await expect(page.locator("#docs-content")).toContainText(
    "Central: contexto autenticado atual",
  );
  await expect(page.locator("#docs-content")).toContainText("Abrir no navegador");
  await expect(page.locator("#docs-content")).toContainText("Forçar download");
  await expect(page.locator("#docs-content")).not.toContainText("Somente visualização");

  const filters = page.locator("#docs-public-links-admin-filters");
  await filters.locator("select[name=status]").selectOption("active");
  await filters.getByRole("button", { name: "Aplicar Filtros" }).click();
  await expect(page.locator(".docs-public-link--admin")).toHaveCount(1);
  await filters.getByRole("button", { name: "Limpar", exact: true }).click();
  await expect(page.locator(".docs-public-link--admin")).toHaveCount(2);

  await page.getByRole("button", { name: "Copiar URL do link /politica-publica" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("https://documentos-api.grupocsv.com/s/politica-publica");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Inativar link /politica-publica" }).click();
  await expect(
    page.locator(".docs-public-link--admin").filter({ hasText: "politica-publica" }),
  ).toContainText("Inativo");

  const log = await requestLog(page);
  expect(
    log.some(
      (entry) =>
        entry.path === "/v1/public-links" &&
        entry.search === "?limit=100&cursor=links-page-2",
    ),
  ).toBe(true);
  expect(
    log.some(
      (entry) =>
        entry.path === "/v1/public-links" &&
        entry.search === "?limit=100&status=active",
    ),
  ).toBe(true);
  expect(
    log.some(
      (entry) =>
        entry.path.endsWith("/public-links/link-global-active") &&
        entry.method === "PATCH" &&
        entry.body.status === "inactive" &&
        Boolean(entry.idempotencyKey),
    ),
  ).toBe(true);
  await expectNoHorizontalOverflow(page);
  await expectNoWcagViolations(page);
});

test("administração aprova somente exclusão lógica e mantém linguagem explícita", async ({
  page,
}) => {
  await openCatalog(page);
  const navigation = page.getByRole("button", { name: "Exclusões", exact: true });
  await expect(navigation).toBeVisible();
  await navigation.click();
  await expect(page.locator("#docs-load-more")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Solicitações de Exclusão" })).toBeVisible();
  await expect(page.locator(".docs-deletion-intro")).toContainText(
    "os bytes físicos não são apagados",
  );
  await expect(page.getByRole("heading", { name: "Norma Arquivada" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Política de Privacidade" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Aprovar Exclusão Lógica" }).click();
  await expect(
    page.locator(".docs-deletion-card").filter({ hasText: "Norma Arquivada" }),
  ).toContainText(
    "Excluído Logicamente",
  );
  const log = await requestLog(page);
  expect(
    log.some(
      (entry) =>
        entry.path === "/v1/deletion-requests" &&
        entry.search === "?cursor=deletion-page-2",
    ),
  ).toBe(true);
  expect(
    log.some(
      (entry) =>
        entry.path === "/v1/deletion-requests/deletion-e2e/approve" &&
        entry.method === "POST" &&
        Boolean(entry.idempotencyKey),
    ),
  ).toBe(true);
  expect(log.some((entry) => /hard-delete|\/delete$/u.test(entry.path))).toBe(false);
  await expectNoHorizontalOverflow(page);
  await expectNoWcagViolations(page);
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
