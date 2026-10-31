import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { assertRequests, mockApi } from "./fixtures.mjs";

const card = (page) => page.locator("#blogLinkCard");
const post = (id, slug, title, publishedAt) => ({
  id,
  slug,
  title,
  publishedAt: Date.parse(publishedAt),
  url: `https://grupocsv.com/blog/${slug}`,
});
const POSTS = [
  post(9, "os-4-ps", "Os 4 Ps da evolução do modelo de pagamento", "2026-10-21T20:05:00.000Z"),
  post(8, "blog", "Organizar o cuidado por condição", "2026-10-20T19:26:00.000Z"),
];

async function openBlogTab(page, options = {}) {
  const state = await mockApi(page, options);
  await page.goto("/admin/");
  await expect(page.locator('.sidebar-item[data-tab="overview"]')).toBeVisible();
  if (await page.locator("#sidebar-toggle").isVisible())
    await page.locator("#sidebar-toggle").click();
  await page.locator('.sidebar-item[data-tab="blog-admin"]').click();
  await expect(card(page)).toBeVisible();
  return state;
}

test("Blog: o cartão mostra o destino atual, o post mais recente e a situação", async ({ page }) => {
  const state = await openBlogTab(page, { blogPosts: POSTS });
  await expect(card(page).locator('[data-role="badge"]')).toHaveText("Desatualizado");
  await expect(card(page).locator('[data-role="current"]')).toContainText(
    "Organizar o cuidado por condição",
  );
  await expect(card(page).locator('[data-role="latest"]')).toContainText(
    "Os 4 Ps da evolução do modelo de pagamento",
  );
  await expect(card(page).getByRole("button", { name: "Apontar para o último post" })).toBeEnabled();
  const reads = state.requests.map((r) => `${r.method} ${r.path}`);
  expect(reads).toContain("GET /links");
  expect(reads).toContain("GET /blog/posts");
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
  assertRequests(state);
});

test("Blog: o clique confirmado publica o post mais recente e confirma no ar", async ({ page }) => {
  const state = await openBlogTab(page, { blogPosts: POSTS });
  const dialogs = [];
  page.on("dialog", (dialog) => {
    dialogs.push(dialog.message());
    dialog.accept();
  });
  await card(page).getByRole("button", { name: "Apontar para o último post" }).click();
  await expect(card(page).locator('[data-role="message"]')).toContainText("Em propagação");
  await expect(card(page).locator('[data-role="message"]')).not.toContainText("Confirmado no ar");
  await page.clock.setFixedTime(new Date("2026-10-22T15:02:00.000Z"));
  await expect(card(page).locator('[data-role="message"]')).toContainText("Confirmado no ar", {
    timeout: 15000,
  });
  expect(dialogs).toHaveLength(1);
  expect(dialogs[0]).toContain("Os 4 Ps da evolução do modelo de pagamento");
  const writes = state.requests.filter((r) => r.method === "POST");
  expect(writes).toHaveLength(1);
  expect(writes[0].path).toBe("/links/rotativo-blog/destination");
  expect(writes[0].body).toEqual({
    expected_version: 1,
    url: "https://grupocsv.com/blog/os-4-ps",
    label: "Os 4 Ps da evolução do modelo de pagamento",
    source: "blog",
    blog_post_id: 9,
  });
  await expect(card(page).locator('[data-role="badge"]')).toHaveText("Em dia");
  await expect(card(page).getByRole("button", { name: "Apontar para o último post" })).toBeDisabled();
  expect(state.external).toContain("https://csv.online/_csv/v/blog");
  expect(state.external.some((u) => u.startsWith("https://pre.csv.online"))).toBe(false);
  assertRequests(state);
});

test("Blog: sem a versão pública em 5 minutos, informa propagação não confirmada", async ({ page }) => {
  const state = await openBlogTab(page, { blogPosts: POSTS });
  state.publicVersion = 0;
  page.on("dialog", (dialog) => dialog.accept());
  await card(page).getByRole("button", { name: "Apontar para o último post" }).click();
  await expect(card(page).locator('[data-role="message"]')).toContainText("Em propagação");
  await page.clock.setFixedTime(new Date("2026-10-22T15:06:00.000Z"));
  await expect(card(page).locator('[data-role="message"]')).toContainText(
    "a propagação não foi confirmada em 5 minutos",
    { timeout: 15000 },
  );
  assertRequests(state);
});

test("Blog: cancelar a confirmação não grava nada", async ({ page }) => {
  const state = await openBlogTab(page, { blogPosts: POSTS });
  page.on("dialog", (dialog) => dialog.dismiss());
  await card(page).getByRole("button", { name: "Apontar para o último post" }).click();
  await expect(card(page).locator('[data-role="badge"]')).toHaveText("Desatualizado");
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
  assertRequests(state);
});

test("Blog: quando já aponta para o post mais recente, o botão fica desativado", async ({ page }) => {
  const state = await openBlogTab(page, {
    blogPosts: [post(8, "blog", "Organizar o cuidado por condição", "2026-10-20T19:26:00.000Z")],
  });
  await expect(card(page).locator('[data-role="badge"]')).toHaveText("Em dia");
  await expect(card(page).getByRole("button", { name: "Apontar para o último post" })).toBeDisabled();
  assertRequests(state);
});

test("Blog: conflito de versão recarrega os dados e informa que nada foi gravado", async ({ page }) => {
  const state = await openBlogTab(page, { blogPosts: POSTS });
  state.failures.set("POST /links/rotativo-blog/destination", {
    status: 409,
    code: "version_conflict",
    message: "Outra pessoa alterou este link enquanto você editava. Recarregue para ver a versão atual. Nada foi gravado.",
  });
  page.on("dialog", (dialog) => dialog.accept());
  await card(page).getByRole("button", { name: "Apontar para o último post" }).click();
  await expect(card(page).locator('[data-role="message"]')).toContainText("Nada foi gravado");
  await expect(card(page).locator('[data-role="badge"]')).toHaveText("Desatualizado");
  assertRequests(state);
});

test("Blog: falha da API mostra a referência e mantém o botão desativado", async ({ page }) => {
  const state = await mockApi(page, { blogPosts: POSTS });
  state.failures.set("GET /blog/posts", {
    status: 502,
    code: "blog_unavailable",
    message: "O blog não respondeu agora.",
  });
  await page.goto("/admin/");
  if (await page.locator("#sidebar-toggle").isVisible())
    await page.locator("#sidebar-toggle").click();
  await page.locator('.sidebar-item[data-tab="blog-admin"]').click();
  await expect(card(page).locator('[data-role="badge"]')).toHaveText("Indisponível");
  await expect(card(page).locator('[data-role="message"]')).toContainText("Referência:");
  await expect(card(page).getByRole("button", { name: "Apontar para o último post" })).toBeDisabled();
  expect(state.errors).toEqual([]);
});

test("Blog: o cartão passa na verificação de acessibilidade e cabe em 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await openBlogTab(page, { blogPosts: POSTS });
  await expect(card(page).locator('[data-role="badge"]')).toHaveText("Desatualizado");
  const results = await new AxeBuilder({ page }).include("#blogLinkCard").analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  const overflow = await card(page).evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  assertRequests(state);
});

test("Blog: sem o módulo do cartão, o Admin e a aba do blog continuam funcionando", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await mockApi(page, { blogPosts: POSTS });
  await page.route("**/admin/blog-link.js", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/admin/");
  await expect(page.locator('.sidebar-item[data-tab="overview"]')).toBeVisible();
  if (await page.locator("#sidebar-toggle").isVisible())
    await page.locator("#sidebar-toggle").click();
  await page.locator('.sidebar-item[data-tab="blog-admin"]').click();
  await expect(page.locator('.admin-tab-content[data-tab="blog-admin"]')).toBeVisible();
  await expect(card(page)).toBeEmpty();
  if (await page.locator("#sidebar-toggle").isVisible())
    await page.locator("#sidebar-toggle").click();
  await page.locator('.sidebar-item[data-tab="central-links"]').click();
  await expect(page.locator('.admin-tab-content[data-tab="central-links"]')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
