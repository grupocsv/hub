import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { assertRequests, mockApi } from "./fixtures.mjs";

const item = (page, tab) => page.locator(`.sidebar-item[data-tab="${tab}"]`);
const linksSection = (page) =>
  page
    .locator(".sidebar-section")
    .filter({ has: page.locator('[data-tab="central-links"]') });

async function start(page) {
  const state = await mockApi(page);
  await page.goto("/admin/");
  await expect(item(page, "overview")).toBeVisible();
  return state;
}

test("Links e Páginas: dois itens na mesma seção, aria-current e Central só carrega quando aberta", async ({
  page,
}) => {
  const state = await start(page);
  await expect(linksSection(page).locator(".sidebar-section-label")).toHaveText(
    "Links e Páginas",
  );
  expect(
    await linksSection(page)
      .locator(".sidebar-item")
      .evaluateAll((items) => items.map((i) => i.dataset.tab)),
  ).toEqual(["central-links", "public-links"]);
  await expect(item(page, "central-links")).toContainText("Central de Links");
  await expect(item(page, "public-links")).toContainText("Páginas Públicas");
  await expect(item(page, "overview")).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#s-public")).toBeVisible();
  await expect(
    page.locator(".summary-card", { has: page.locator("#s-public") }),
  ).toContainText("Páginas Públicas");

  await item(page, "public-links").click();
  await expect(
    page.locator('.admin-tab-content[data-tab="public-links"]'),
  ).toBeVisible();
  await expect(item(page, "public-links")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(item(page, "overview")).not.toHaveAttribute("aria-current");
  expect(state.requests).toHaveLength(0);

  await page.getByRole("button", { name: "Abrir Central de Links" }).click();
  await expect(page.locator("#centralLinks")).toBeVisible();
  await expect(item(page, "central-links")).toHaveClass(/active/);
  await expect(item(page, "central-links")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(item(page, "public-links")).not.toHaveAttribute("aria-current");
  await expect
    .poll(() => state.requests.some((request) => request.path === "/me"))
    .toBe(true);
  expect(state.consoleErrors).toEqual([]);
  assertRequests(state);
});

test("Links e Páginas: navegação por teclado entre os dois itens", async ({
  page,
}) => {
  const state = await start(page);
  await item(page, "central-links").focus();
  await page.keyboard.press("Tab");
  await expect(item(page, "public-links")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.locator('.admin-tab-content[data-tab="public-links"]'),
  ).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(item(page, "central-links")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator("#centralLinks")).toBeVisible();
  await expect(item(page, "central-links")).toHaveAttribute(
    "aria-current",
    "page",
  );
  assertRequests(state);
});

test("Links e Páginas: menu e Páginas Públicas sem violação séria ou crítica de acessibilidade", async ({
  page,
}) => {
  const state = await start(page);
  await item(page, "public-links").click();
  const result = await new AxeBuilder({ page })
    .include("#sidebar")
    .include('.admin-tab-content[data-tab="public-links"] > .section-header')
    .include(".pl-central-hint")
    .analyze();
  expect(
    result.violations
      .filter((v) => ["serious", "critical"].includes(v.impact))
      .map((v) => v.id),
  ).toEqual([]);
  assertRequests(state);
});

for (const width of [390, 320]) {
  test(`Links e Páginas: menu móvel em ${width}px fecha ao escolher e não cria rolagem horizontal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    const state = await start(page);
    const toggle = page.locator("#sidebar-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator("#sidebar")).toHaveClass(/open/);
    await expect(linksSection(page)).toContainText("Links e Páginas");
    await item(page, "public-links").click();
    await expect(page.locator("#sidebar")).not.toHaveClass(/open/);
    await expect(page.locator(".pl-central-hint")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    assertRequests(state);
  });
}
