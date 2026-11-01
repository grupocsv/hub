import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

async function captureSyntheticExample(page, testInfo, name) {
  if (!testInfo.project.name.includes("desktop") && !testInfo.project.name.includes("mobile")) return;
  const directory = path.resolve(process.cwd(), "../../artifacts/central-ui-20261101");
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => {
    document.activeElement?.blur();
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: path.join(directory, `${name}-sintetico-${testInfo.project.name}.png`), fullPage: true, animations: "disabled" });
}

for (const portal of ["grupo-csv", "unimed", "unihealth", "icds", "2im"]) {
  test(`catálogo equivalente e favorito acessível em ${portal}`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/documentos/?portal=${portal}`);
    await expect(page.locator(".docs-card")).toHaveCount(2);
    for (const destination of ["documentos", "colecoes", "favoritos", "recentes", "links-publicos", "exclusoes"]) {
      await expect(page.locator(`[data-view="${destination}"]`)).toBeEnabled();
    }
    await expect(page.locator("#docs-upload")).toBeEnabled();
    await expect(page.locator("#docs-search")).toBeEnabled();
    await expect(page.locator(".docs-card__format").first()).toHaveText("PDF");
    await expect(page.locator('#docs-lifecycle-filter option[value="draft"]')).toHaveCount(0);
    await expect(page.locator('#docs-lifecycle-filter option[value="active"]')).toHaveCount(0);
    const star = page.getByRole("button", { name: "Favoritar: Manual Seguro em PDF", exact: true });
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await expect(star).toHaveText("");
    await expect(star.locator("svg")).toBeVisible();
    await star.click();
    await expect(page.getByRole("button", { name: "Remover dos favoritos: Manual Seguro em PDF", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(errors).toEqual([]);
    if (portal === "unimed") await captureSyntheticExample(page, testInfo, "catalogo");
  });
}

test("tags podem ser salvas no detalhe e não aparecem para leitor sem edição", async ({ page }, testInfo) => {
  await page.goto("/documentos/?portal=unimed");
  await page.getByRole("button", { name: "Ver detalhes de Manual Seguro em PDF" }).click();
  const form = page.locator("#docs-tags-form");
  await form.getByRole("textbox").fill("Gestão, Relatório");
  await form.getByRole("button", { name: "Salvar Tags" }).click();
  await expect(page.locator(".docs-tags > p")).toHaveText("Gestão · Relatório");
  const request = await page.evaluate(() => globalThis.__DOCS_E2E_LOG.find((entry) => entry.method === "PUT" && entry.path.endsWith("/tags")));
  expect(request.body).toEqual({ tags: ["Gestão", "Relatório"] });
  expect(request.idempotencyKey).toBeTruthy();
  await captureSyntheticExample(page, testInfo, "tags-historico");
  await page.getByRole("button", { name: "Fechar Detalhes" }).click();
  await page.getByRole("button", { name: "Ver detalhes de Política de Privacidade" }).click();
  await expect(form).toHaveCount(0);
});

test("histórico abre a versão escolhida e preserva identificação no link interno", async ({ page }) => {
  await page.goto("/documentos/?portal=unimed");
  await page.getByRole("button", { name: "Ver detalhes de Manual Seguro em PDF" }).click();
  await expect(page.locator(".docs-version-list li")).toHaveCount(2);
  await page.locator("#docs-version-filter").fill("anterior");
  await expect(page.locator(".docs-version-list li")).toHaveCount(1);
  await page.getByRole("button", { name: "Abrir versão 1", exact: true }).click();
  await expect(page).toHaveURL(/version=version-pdf-previous/);
  await expect(page.locator(".docs-viewer__pdf-text")).toBeVisible();
  const paths = await page.evaluate(() => globalThis.__DOCS_E2E_LOG.map((entry) => entry.path));
  expect(paths).toContain("/v1/documents/document-pdf/versions/version-pdf-previous/viewer-tickets");
  expect(paths).toContain("/v1/documents/document-pdf/versions/version-pdf-previous/bytes");
});
