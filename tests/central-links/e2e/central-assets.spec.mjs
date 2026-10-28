import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { assertRequests, mockApi } from "./fixtures.mjs";

const fixture = JSON.parse(
  await readFile(
    new URL("../../central-assets/fixtures/manifest.json", import.meta.url),
    "utf8",
  ),
);
const root = (page) => page.locator("#centralAssets");
const states = new WeakMap();

test.afterEach(async ({ page }) => {
  const state = states.get(page);
  if (state) {
    assertRequests(state);
    expect(state.errors).toEqual([]);
  }
});

async function start(page, { status = 200, open = true } = {}) {
  const state = await mockApi(page);
  states.set(page, state);
  state.manifestRequests = [];
  state.manifestStatus = status;
  await page.route(
    (url) => url.hostname === "assets.grupocsv.com" && url.pathname === "/manifest.json",
    (route) => {
      state.manifestRequests.push(route.request().url());
      if (state.manifestStatus !== 200)
        return route.fulfill({ status: state.manifestStatus, body: "" });
      return route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(fixture),
      });
    },
  );
  await page.goto("/admin/");
  if (open) await openTab(page);
  return state;
}

async function openTab(page) {
  if (await page.locator("#sidebar-toggle").isVisible())
    await page.locator("#sidebar-toggle").click();
  await page.locator('.sidebar-item[data-tab="asset-bucket"]').click();
  await expect(root(page)).toBeVisible();
}

const view = (page, name) =>
  root(page).getByRole("tab", { name: new RegExp("^" + name) }).click();

test("menu, carga sob demanda e totais vindos do manifesto", async ({ page }) => {
  const state = await start(page, { open: false });
  await expect(page.locator('.sidebar-item[data-tab="asset-bucket"]')).toContainText(
    "Central de Assets",
  );
  expect(state.manifestRequests).toEqual([]);
  await openTab(page);
  await expect(root(page).locator(".ca-kpi").first()).toContainText(
    String(fixture.assets.length),
  );
  expect(state.manifestRequests).toHaveLength(1);
  expect(new URL(state.manifestRequests[0]).searchParams.get("v")).toMatch(/^\d+$/);
  await expect(root(page).locator(".ca-brand")).toHaveCount(12);
  await expect(root(page).locator(".ca-brand").first()).toContainText("Grupo CSV");
  await page.locator('.sidebar-item[data-tab="dashboard"], .sidebar-item').first().click();
  await openTab(page);
  expect(state.manifestRequests).toHaveLength(1);
  await root(page).getByRole("button", { name: "Recarregar Catálogo" }).click();
  await expect.poll(() => state.manifestRequests.length).toBe(2);
});

test("card de marca abre o catálogo filtrado, com busca sem acento e paginação", async ({
  page,
}) => {
  await start(page);
  const axiacare = fixture.assets.filter((a) => a.brand === "axiacare").length;
  await root(page).locator('.ca-brand[data-ca-brand="axiacare"]').click();
  await expect(root(page).locator("#ca-view-catalogo")).toBeVisible();
  await expect(root(page).locator(".ca-card")).toHaveCount(axiacare);
  await expect(root(page).locator('[data-ca-filter="brand"]')).toHaveValue("axiacare");
  await root(page).getByRole("button", { name: "Limpar filtros" }).click();
  await expect(root(page).locator(".ca-card")).toHaveCount(24);
  await expect(root(page).locator("[data-ca-pager] button")).toHaveCount(3);
  await root(page).locator('[data-ca-page="3"]').click();
  await expect(root(page).locator(".ca-card")).toHaveCount(fixture.assets.length - 48);
  const search = root(page).getByRole("searchbox", { name: "Buscar assets" });
  await search.fill("saude");
  const without = await root(page).locator("[data-ca-result]").textContent();
  await search.fill("saúde");
  await expect(root(page).locator("[data-ca-result]")).toHaveText(without);
  await search.fill("gabi");
  await expect(
    root(page).locator('[data-ca-detail="logos/gabi/simbolo-gabi-1024.png"]'),
  ).toHaveCount(1);
});

test("detalhe mostra a URL estável, copia a referência e fecha com Escape", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await start(page);
  await root(page).locator('.ca-brand[data-ca-brand="unimed-gv"]').click();
  const key = "logos/unimed-gv/box-pinheiro.png";
  await root(page).locator(`[data-ca-detail="${key}"]`).click();
  const drawer = root(page).getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(drawer.locator("[data-ca-url]")).toHaveText(
    "https://assets.grupocsv.com/" + key,
  );
  await drawer.getByRole("button", { name: "Copiar Referência" }).click();
  await expect(page.locator("#toast")).toContainText("Referência copiada.");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("URL: https://assets.grupocsv.com/" + key);
  expect(copied).toContain("brand=unimed-gv");
  await drawer.getByRole("button", { name: "Escuro" }).click();
  await expect(drawer.locator(".ca-big")).toHaveClass(/ca-dark/);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(root(page).locator(`[data-ca-detail="${key}"]`)).toBeFocused();
});

test("aba Qualidade lista marcas por grupo e os arquivos de sistema", async ({ page }) => {
  await start(page);
  await view(page, "Qualidade");
  const table = root(page).locator(".ca-table").first();
  await expect(table.locator(".ca-group-row")).toHaveCount(
    Object.keys(fixture.brand_group_registry).length,
  );
  await expect(table).toContainText("Gabi Care");
  await expect(table).not.toContainText("gabi-care Gabi");
  await expect(root(page)).toContainText("Arquivos de Sistema");
  await expect(root(page)).toContainText("_assets/og/default.png");
});

test("falha ao ler o manifesto mostra aviso e permite tentar de novo", async ({ page }) => {
  const state = await start(page, { status: 503 });
  await expect(root(page).locator("[data-ca-status]")).toContainText(
    "Não foi possível carregar o catálogo",
  );
  state.manifestStatus = 200;
  await root(page).getByRole("button", { name: "Recarregar Catálogo" }).click();
  await expect(root(page).locator("[data-ca-status]")).toBeHidden();
  await expect(root(page).locator(".ca-brand")).toHaveCount(12);
});

for (const width of [1440, 768, 390, 320])
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: sem rolagem horizontal e sem violações graves`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 768 ? 1024 : 900 });
      await page.emulateMedia({ colorScheme: theme });
      const state = await start(page);
      for (const name of ["Visão Geral", "Catálogo", "Qualidade"]) {
        await view(page, name);
        await expect(root(page).locator(`.ca-view:not([hidden])`)).toHaveCount(1);
        const d = await page.evaluate(() => ({
          root: document.documentElement.clientWidth,
          rootScroll: document.documentElement.scrollWidth,
          body: document.body.clientWidth,
          bodyScroll: document.body.scrollWidth,
        }));
        expect(d.rootScroll, name).toBeLessThanOrEqual(d.root);
        expect(d.bodyScroll, name).toBeLessThanOrEqual(d.body);
        const axe = await new AxeBuilder({ page }).include("#centralAssets").analyze();
        expect(
          axe.violations.filter((v) => ["serious", "critical"].includes(v.impact)),
          name,
        ).toEqual([]);
        if (process.env.CENTRAL_ASSETS_CAPTURES) {
          await mkdir(process.env.CENTRAL_ASSETS_CAPTURES, { recursive: true });
          await page.screenshot({
            path: path.join(
              process.env.CENTRAL_ASSETS_CAPTURES,
              `central-assets-${width}-${theme}-${name.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase()}.png`,
            ),
            fullPage: true,
          });
        }
      }
      expect(state.consoleErrors).toEqual([]);
    });
  }
