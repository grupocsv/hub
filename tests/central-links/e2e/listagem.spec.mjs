import { expect, test } from "@playwright/test";
import { assertRequests, mockApi, openCentral, section } from "./fixtures.mjs";

test("uma página com 25 rotativos usa apenas a listagem e carrega detalhes sob demanda", async ({
  page,
}) => {
  const state = await mockApi(page);
  const sample = state.links[0];
  state.links = Array.from({ length: 25 }, (_, index) => {
    const item = structuredClone(sample);
    item.id = `rotativo-${index}`;
    item.slug = `conteudo-${index}`;
    item.destination.id = `destino-${index}`;
    item.destination.link_id = item.id;
    item.destination.url = `https://grupocsv.com/blog/conteudo-${index}`;
    item.destination.label = `Conteúdo ${index}`;
    item.destination.source = "blog";
    item.destination.blog_post_id = 1000 + index;
    item.current_destination_id = item.destination.id;
    item.last_check.url = item.destination.url;
    item.last_check.final_url = item.destination.url;
    item.last_check.status = index === 0 ? "falhou" : "ok";
    state.histories.set(item.id, [structuredClone(item.destination)]);
    return item;
  });

  await openCentral(page);
  const root = page.locator("#centralLinks");
  await expect(
    root.getByRole("heading", { name: "Últimas 10 alterações", exact: true }),
  ).toBeVisible();
  state.requests.length = 0;
  await section(page, "Rotativos");
  const rows = root.locator(".cl-link-table tbody tr");
  await expect(rows).toHaveCount(25);
  expect(
    state.requests.filter((request) => request.path === "/links"),
  ).toHaveLength(1);
  expect(
    state.requests.filter((request) => /^\/links\/[^/]+$/.test(request.path)),
  ).toHaveLength(0);
  expect(state.requests).toHaveLength(1);
  await expect(root.locator(".cl-list > p")).toHaveText("25 links");
  await expect(rows.first()).toContainText("Conteúdo 0");
  await expect(rows.first()).toContainText("Destino com falha");
  await expect(rows.first().locator(".cl-destination")).toHaveAttribute(
    "title",
    state.links[0].destination.url,
  );

  await rows
    .first()
    .getByRole("button", { name: "Detalhes", exact: true })
    .click();
  await expect(
    root.getByRole("heading", { name: "Detalhes do link", exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      () =>
        state.requests.filter((request) => request.path === "/links/rotativo-0")
          .length,
    )
    .toBe(1);
  await expect(root).toContainText("Destino com falha");
  assertRequests(state);
});
