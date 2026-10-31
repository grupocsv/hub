import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import jsQR from "jsqr";
import {
  assertRequests,
  mockApi,
  openCentral,
  openDetail,
  REQUEST_ID,
  section,
} from "./fixtures.mjs";

const root = (page) => page.locator("#centralLinks");
const button = (page, name) =>
  root(page).getByRole("button", { name, exact: true });
const input = (page, name) => root(page).getByLabel(name, { exact: true });

async function createForm(page, kind = "rotativo") {
  await section(page, kind === "rotativo" ? "Rotativos" : "Estáticos");
  await button(
    page,
    kind === "rotativo" ? "Criar rotativo" : "Criar estático",
  ).click();
  await input(page, "Nome curto").fill("guia-novo");
  await input(page, "Título interno").fill("Guia novo");
  await input(page, "Origem do destino").selectOption("manual");
  await input(page, "Destino").fill("https://grupocsv.com/guia");
}
async function testDestination(page) {
  await button(page, "Testar destino").click();
  await expect(root(page)).toContainText("200");
}
async function changeDestination(page, url = "https://grupocsv.com/blog/novo") {
  await button(page, "Trocar destino").click();
  await input(page, "Origem do destino").selectOption("manual");
  await input(page, "Destino").fill(url);
  await testDestination(page);
  await button(page, "Salvar destino").click();
}

const states = new WeakMap();
test.afterEach(async ({ page }) => {
  const state = states.get(page);
  if (state) assertRequests(state);
});
async function start(page, options) {
  const state = await mockApi(page, options);
  states.set(page, state);
  await openCentral(page);
  return state;
}

test("T20: item em Links e Páginas e carga apenas quando a aba abre", async ({
  page,
}) => {
  const state = await mockApi(page);
  states.set(page, state);
  await page.goto("/admin/");
  await expect(
    page.locator('.sidebar-item[data-tab="central-links"]'),
  ).toBeVisible();
  expect(state.requests).toHaveLength(0);
  const menuSection = page
    .locator(".sidebar-section")
    .filter({ has: page.locator('[data-tab="central-links"]') });
  await expect(menuSection).toContainText("Links e Páginas");
  await page.locator('.sidebar-item[data-tab="central-links"]').click();
  await expect(root(page)).toBeVisible();
  await expect
    .poll(() => state.requests.some((request) => request.path === "/me"))
    .toBe(true);
  await expect(root(page)).toContainText("17");
  expect(state.consoleErrors).toEqual([]);
});

test("T20: criar rotativo testa a URL e usa a sessão do Admin", async ({
  page,
}) => {
  const state = await start(page);
  await createForm(page);
  await testDestination(page);
  await button(page, "Criar link").click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) => request.path === "/links" && request.method === "POST",
      ),
    )
    .toBe(true);
  const creation = state.requests.find(
    (request) => request.path === "/links" && request.method === "POST",
  );
  expect(creation.body).toMatchObject({
    slug: "guia-novo",
    kind: "rotativo",
    title: "Guia novo",
    destination: { url: "https://grupocsv.com/guia", source: "manual" },
    check_id: "teste-novo",
  });
  await expect(root(page)).toContainText("csv.online/guia-novo");
});

test("T20: trocar destino e restaurar preservam o endereço e enviam expected_version", async ({
  page,
}) => {
  const state = await start(page);
  await openDetail(page);
  await changeDestination(page);
  await expect(root(page)).toContainText("https://grupocsv.com/blog/novo");
  expect(
    state.requests.find((request) => request.path.endsWith("/destination")).body
      .expected_version,
  ).toBe(1);
  await button(page, "Restaurar este destino").first().click();
  await testDestination(page);
  await button(page, "Restaurar destino").click();
  await expect
    .poll(() =>
      state.requests.some((request) => request.path.endsWith("/restore")),
    )
    .toBe(true);
  const restored = state.requests.find((request) =>
    request.path.endsWith("/restore"),
  );
  expect(restored.body).toMatchObject({
    expected_version: 2,
    destination_id: "destino-rotativo-blog",
  });
  await expect(root(page)).toContainText("csv.online/blog");
});

test("T20: conflito 409 informa que nada foi gravado e permite recarregar", async ({
  page,
}) => {
  const state = await start(page);
  await openDetail(page);
  state.links[0].version = 2;
  await changeDestination(page);
  await expect(root(page)).toContainText(
    "Outra pessoa alterou este link enquanto você editava. Recarregue para ver a versão atual. Nada foi gravado.",
  );
  await button(page, "Recarregar").click();
  await expect(root(page)).toContainText("Versão 2");
  expect(state.histories.get("rotativo-blog")).toHaveLength(1);
});

for (const role of ["admin", "superadmin"]) {
  test(`T20: ${role} recebe somente as ações permitidas`, async ({ page }) => {
    await start(page, { role });
    await openDetail(page, "Estáticos");
    const correction = button(page, "Corrigir destino");
    const deletion = button(page, "Excluir");
    if (role === "admin") {
      await expect(correction).toHaveCount(0);
      await expect(deletion).toHaveCount(0);
    } else {
      await expect(correction).toBeVisible();
      await expect(deletion).toBeVisible();
    }
    await section(page, "Visão geral");
    for (const action of ["Reconstruir KV", "Exportar cópia de segurança"]) {
      if (role === "admin") await expect(button(page, action)).toHaveCount(0);
      else await expect(button(page, action)).toBeVisible();
    }
  });
}

test("publicação após falha exige caixa marcada e confirmação explícita", async ({
  page,
}) => {
  const state = await start(page);
  state.checkFailure = true;
  await createForm(page);
  await button(page, "Testar destino").click();
  const confirmation = root(page).getByRole("checkbox", {
    name: "Publicar mesmo assim",
    exact: true,
  });
  await expect(confirmation).toBeVisible();
  await button(page, "Criar link").click();
  expect(
    state.requests.filter(
      (request) => request.method === "POST" && request.path === "/links",
    ),
  ).toHaveLength(0);
  await confirmation.check();
  let confirmed = false;
  page.once("dialog", async (dialog) => {
    confirmed = true;
    await dialog.accept();
  });
  await button(page, "Criar link").click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) => request.path === "/links" && request.method === "POST",
      ),
    )
    .toBe(true);
  expect(confirmed).toBe(true);
  expect(
    state.requests.find(
      (request) => request.path === "/links" && request.method === "POST",
    ).body.publish_despite_failure,
  ).toBe(true);
});

for (const [status, code, message] of [
  [403, "forbidden", "Esta operação exige o papel de superadmin."],
  [403, "must_change_password", "Altere sua senha antes de gravar."],
  [422, "invalid_field", "Campo inválido."],
  [429, "rate_limited", "Aguarde um minuto antes de tentar novamente."],
  [503, "auth_unavailable", "Autenticação temporariamente indisponível."],
]) {
  test(`erro ${status} ${code} mostra mensagem e request_id sem encerrar a sessão`, async ({
    page,
  }) => {
    const state = await start(page);
    state.failures.set("GET /links", { status, code, message });
    await section(page, "Rotativos");
    await expect(root(page)).toContainText(
      code === "must_change_password"
        ? "Troque sua senha no Admin antes de realizar esta ação."
        : message,
    );
    await expect(root(page)).toContainText(REQUEST_ID);
    expect(
      await page.evaluate(() => localStorage.getItem("hub_auth_admin_token")),
    ).toBe("sessao-admin-simulada");
  });
}

test("401 limpa a sessão e volta ao login", async ({ page }) => {
  const state = await start(page);
  state.failures.set("GET /links", {
    status: 401,
    code: "unauthorized",
    message: "Entre novamente.",
  });
  await section(page, "Rotativos");
  await expect(page.locator("#admin-auth-overlay")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("hub_auth_admin_token")),
  ).toBeNull();
});

test("falha 502 no blog preserva entrada manual do destino", async ({
  page,
}) => {
  const state = await start(page);
  state.failures.set("GET /blog/posts", {
    status: 502,
    code: "blog_unavailable",
    message:
      "Não foi possível consultar o blog. Você ainda pode informar a URL do destino.",
  });
  await createForm(page);
  await input(page, "Origem do destino").selectOption("blog");
  await expect(root(page)).toContainText("Não foi possível consultar o blog.");
  await input(page, "Origem do destino").selectOption("manual");
  await expect(input(page, "Destino")).toBeEditable();
  await testDestination(page);
});

test("Domínios tolera falha do csv.online e registra a hora da tentativa", async ({
  page,
}) => {
  const state = await start(page);
  state.healthFailure = true;
  await section(page, "Domínios");
  await expect(root(page)).toContainText("Sem resposta");
  await expect(root(page)).toContainText("12:00");
  expect(state.external).toContain("https://csv.online/_csv/health");
  expect(state.external).not.toContain("https://pre.csv.online/_csv/health");
});

test("valores de administradores permanecem texto e destinos têm proteção de abertura", async ({
  page,
}) => {
  const state = await mockApi(page);
  states.set(page, state);
  const payload = '<img src=x onerror="window.executouInjecao=true">';
  state.links[0].title = payload;
  state.links[0].notes = payload;
  state.links[0].destination.label = payload;
  state.links[0].destination.url = "https://open.grupocsv.com/relatorio";
  await openCentral(page);
  await openDetail(page);
  await expect(root(page)).toContainText(payload);
  await expect(root(page).locator('img[src="x"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.executouInjecao)).toBeUndefined();
  await expect(root(page)).toContainText(
    "A revogação desta página é feita em Páginas Públicas",
  );
  const externalLinks = root(page).locator('a[target="_blank"]');
  for (const link of await externalLinks.all()) {
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(link).toHaveAttribute("rel", /noreferrer/);
  }
});

test("todas as abas existentes continuam abrindo sem pageerror", async ({
  page,
}) => {
  const state = await start(page);
  const tabs = await page
    .locator(".sidebar-item[data-tab]")
    .evaluateAll((items) =>
      items
        .map((item) => item.dataset.tab)
        .filter((name) => name !== "central-links"),
    );
  for (const tab of tabs) {
    await page.locator(`.sidebar-item[data-tab="${tab}"]`).click();
    await expect(
      page.locator(`.admin-tab-content[data-tab="${tab}"]`),
    ).toBeVisible();
  }
  expect(state.errors).toEqual([]);
});

for (const width of [1440, 768, 390, 320])
  for (const theme of ["light", "dark"]) {
    test(`T20: ${width}px ${theme} sem rolagem horizontal e sem violações graves`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 768 ? 1024 : 900 });
      await page.emulateMedia({ colorScheme: theme });
      const state = await start(page);
      const palette = () =>
        root(page).evaluate((element) => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, color: style.color };
        });
      const originalColors = await palette();
      await page.emulateMedia({
        colorScheme: theme === "light" ? "dark" : "light",
      });
      await expect
        .poll(palette, {
          message: "A aba mantém as cores do Admin ao alternar o esquema do sistema.",
        })
        .toEqual(originalColors);
      await page.emulateMedia({ colorScheme: theme });
      const adminColors = await page.locator("body").evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, color: style.color };
      });
      expect(await palette()).toEqual(adminColors);
      for (const sectionName of [
        "Visão geral",
        "Rotativos",
        "Estáticos",
        "Domínios",
        "Métricas",
        "csv.email",
      ]) {
        await section(page, sectionName);
        await expect(root(page)).toBeVisible();
        const dimensions = await page.evaluate(() => ({
          root: document.documentElement.clientWidth,
          rootScroll: document.documentElement.scrollWidth,
          body: document.body.clientWidth,
          bodyScroll: document.body.scrollWidth,
        }));
        expect(dimensions.rootScroll, sectionName).toBeLessThanOrEqual(
          dimensions.root,
        );
        expect(dimensions.bodyScroll, sectionName).toBeLessThanOrEqual(
          dimensions.body,
        );
        const accessibility = await new AxeBuilder({ page })
          .include("#centralLinks")
          .analyze();
        expect(
          accessibility.violations.filter((item) =>
            ["serious", "critical"].includes(item.impact),
          ),
          sectionName,
        ).toEqual([]);
      }
      await section(page, "Rotativos");
      if (process.env.CENTRAL_LINKS_CAPTURES) {
        await mkdir(process.env.CENTRAL_LINKS_CAPTURES, { recursive: true });
        await page.screenshot({
          path: path.join(
            process.env.CENTRAL_LINKS_CAPTURES,
            `central-links-${width}-${theme}.png`,
          ),
          fullPage: true,
        });
      }
      expect(state.consoleErrors).toEqual([]);
    });
  }

test("T20: downloads PNG e SVG decodificam o endereço público, nunca o destino", async ({
  page,
}) => {
  await start(page);
  await openDetail(page);
  await button(page, "QR Code").click();
  for (const [name, mime, extension] of [
    ["Baixar PNG", "image/png", ".png"],
    ["Baixar SVG", "image/svg+xml", ".svg"],
  ]) {
    const pending = page.waitForEvent("download");
    await button(page, name).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe("blog" + extension);
    const bytes = await readFile(await download.path());
    if (extension === ".png")
      expect(bytes.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
    else expect(bytes.toString()).toContain("<svg");
    const pixels = await page.evaluate(
      async ({ data, mimeType }) => {
        const image = new Image();
        image.src = `data:${mimeType};base64,${data}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        return {
          width: canvas.width,
          height: canvas.height,
          data: Array.from(
            context.getImageData(0, 0, canvas.width, canvas.height).data,
          ),
        };
      },
      { data: bytes.toString("base64"), mimeType: mime },
    );
    const decoded = jsQR(
      Uint8ClampedArray.from(pixels.data),
      pixels.width,
      pixels.height,
    );
    expect(decoded?.data).toBe("https://csv.online/blog");
  }
});

test("superadmin corrige estático somente com motivo e confirmação do nome", async ({
  page,
}) => {
  const state = await start(page, { role: "superadmin" });
  await openDetail(page, "Estáticos");
  await button(page, "Corrigir destino").click();
  await input(page, "Destino").fill("https://grupocsv.com/manual-corrigido");
  await input(page, "Motivo da correção (mínimo de 10 caracteres)").fill(
    "Correção do documento publicado.",
  );
  await input(page, "Digite o nome curto para confirmar").fill(
    "nome-incorreto",
  );
  await button(page, "Salvar destino").click();
  await expect(root(page)).toContainText(
    "Digite o nome curto exatamente como exibido: manual",
  );
  expect(
    state.requests.filter((request) => request.path.endsWith("/destination")),
  ).toHaveLength(0);
  await input(page, "Digite o nome curto para confirmar").fill("manual");
  await button(page, "Salvar destino").click();
  await expect
    .poll(() =>
      state.requests.some((request) => request.path.endsWith("/destination")),
    )
    .toBe(true);
  expect(
    state.requests.find((request) => request.path.endsWith("/destination"))
      .body,
  ).toMatchObject({
    confirm_slug: "manual",
    reason: "Correção do documento publicado.",
    expected_version: 1,
  });
});

test("superadmin exclui somente após digitar o nome curto", async ({
  page,
}) => {
  const state = await start(page, { role: "superadmin" });
  await openDetail(page, "Estáticos");
  await button(page, "Excluir").click();
  await input(page, "Digite o nome curto para excluir").fill("errado");
  await button(page, "Confirmar exclusão").click();
  await expect(root(page)).toContainText("O nome curto não confere.");
  expect(
    state.requests.filter((request) => request.method === "DELETE"),
  ).toHaveLength(0);
  await input(page, "Digite o nome curto para excluir").fill("manual");
  await button(page, "Confirmar exclusão").click();
  await expect
    .poll(() => state.requests.some((request) => request.method === "DELETE"))
    .toBe(true);
  expect(
    state.requests.find((request) => request.method === "DELETE").body,
  ).toEqual({ expected_version: 1, confirm_slug: "manual" });
});

test("propagação exige 90 segundos e versão observada antes de confirmar", async ({
  page,
}) => {
  const state = await start(page);
  state.links[0].published_at = "2026-10-22T14:59:30.000Z";
  await openDetail(page);
  await expect(root(page)).toContainText("Em propagação · 30 s");
  await page.clock.setFixedTime(new Date("2026-10-22T15:02:00.000Z"));
  await button(page, "Voltar à lista").click();
  await button(page, "Detalhes").first().click();
  await expect(root(page)).toContainText("Confirmado");
  state.publicVersion = 0;
  await page.clock.setFixedTime(new Date("2026-10-22T15:06:00.000Z"));
  await button(page, "Voltar à lista").click();
  await button(page, "Detalhes").first().click();
  await expect(root(page)).toContainText("Propagação não confirmada");
  await button(page, "Regravar rota").click();
  await expect
    .poll(() =>
      state.requests.some((request) => request.path.endsWith("/rewrite-route")),
    )
    .toBe(true);
});

test("Métricas separa robôs, consulta as cinco distribuições e filtra o histórico", async ({
  page,
}) => {
  const state = await start(page);
  await section(page, "Métricas");
  await expect(root(page).locator("svg polyline")).toHaveCount(2);
  for (const group of ["day", "destination", "country", "source", "campaign"]) {
    expect(
      state.requests.some(
        (request) =>
          request.path.endsWith("/metrics") && request.params.group === group,
      ),
    ).toBe(true);
  }
  await root(page)
    .getByRole("checkbox", { name: "Mostrar robôs no gráfico diário" })
    .uncheck();
  await expect(root(page).locator("svg polyline")).toHaveCount(1);
  await input(page, "Período").selectOption("7");
  await button(page, "Consultar métricas").click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) =>
          request.path.endsWith("/metrics") &&
          request.params.from === "2026-10-16" &&
          request.params.to === "2026-10-22",
      ),
    )
    .toBe(true);
  await input(page, "Link do histórico").selectOption("rotativo-blog");
  await input(page, "Tipo de evento").selectOption("destino_restaurado");
  await input(page, "Autor").fill("editor@exemplo.com");
  await button(page, "Filtrar histórico").click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) =>
          request.path === "/events" &&
          request.params.actor_email === "editor@exemplo.com",
      ),
    )
    .toBe(true);
  const filtered = state.requests
    .filter((request) => request.path === "/events")
    .at(-1);
  expect(filtered.params).toMatchObject({
    link_id: "rotativo-blog",
    type: "destino_restaurado",
    from: "2026-10-16T03:00:00.000Z",
    to: "2026-10-23T02:59:59.999Z",
  });
});

test("csv.email salva preparação versionada e verifica o checklist no servidor", async ({
  page,
}) => {
  const state = await start(page);
  await section(page, "csv.email");
  await input(page, "Finalidade pretendida").fill(
    "Comunicação institucional futura.",
  );
  await input(page, "Notas de briefing").fill(
    "Definir responsáveis antes de contratar.",
  );
  await button(page, "Adicionar decisão").click();
  await input(page, "Título da decisão").fill("Finalidade do domínio");
  await input(page, "Opções (uma por linha)").fill(
    "Encaminhamento\nManter proteção",
  );
  await button(page, "Salvar preparação").click();
  await expect(root(page)).toContainText(
    "Preparação salva. Nenhum serviço foi ativado.",
  );
  const save = state.requests.find(
    (request) => request.path === "/email-prep" && request.method === "PUT",
  );
  expect(save.body).toMatchObject({
    expected_version: 1,
    purpose: "Comunicação institucional futura.",
    pending_decisions: [
      {
        title: "Finalidade do domínio",
        options: ["Encaminhamento", "Manter proteção"],
        status: "pendente",
      },
    ],
  });
  await button(page, "Verificar configuração DNS").click();
  await expect(root(page)).toContainText("Verificação concluída.");
  await expect(root(page)).toContainText("DNS sobre HTTPS");
  expect(
    state.requests.some((request) => request.path === "/email-prep/verify"),
  ).toBe(true);
});

test("csv.email apresenta rejeição 422 de possível credencial e conflito sem sobrescrever", async ({
  page,
}) => {
  const state = await start(page);
  await section(page, "csv.email");
  state.failures.set("PUT /email-prep", {
    status: 422,
    code: "possivel_credencial",
    message:
      "Remova possíveis credenciais antes de salvar. Esta área não armazena segredos.",
  });
  await button(page, "Salvar preparação").click();
  await expect(root(page)).toContainText(
    "Remova possíveis credenciais antes de salvar.",
  );
  await expect(root(page)).toContainText(REQUEST_ID);
  state.failures.set("PUT /email-prep", {
    status: 409,
    code: "version_conflict",
    message: "Outra pessoa alterou esta área. Recarregue antes de salvar.",
    extra: { current_version: 2, current: { ...state.email, version: 2 } },
  });
  await button(page, "Salvar preparação").click();
  await expect(root(page)).toContainText(
    "Outra pessoa alterou esta área. Recarregue antes de salvar. Nada foi gravado.",
  );
  await expect(button(page, "Recarregar csv.email")).toBeVisible();
  expect(state.email.version).toBe(1);
});

test("informações, desativação e arquivamento mantêm concorrência e a URL pública", async ({
  page,
}) => {
  const state = await start(page);
  await openDetail(page);
  await button(page, "Editar informações").click();
  await input(page, "Título interno").fill("Título revisado");
  await input(page, "Validade (horário de Brasília)").fill("2026-12-01T12:30");
  await button(page, "Salvar informações").click();
  await expect(root(page)).toContainText("Título revisado");
  expect(
    state.requests.find((request) => request.method === "PATCH").body,
  ).toMatchObject({
    expected_version: 1,
    expires_at: "2026-12-01T15:30:00.000Z",
  });
  page.once("dialog", (dialog) => dialog.accept());
  await button(page, "Desativar").click();
  await expect(button(page, "Reativar")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await button(page, "Arquivar").click();
  await expect(button(page, "Desarquivar")).toBeVisible();
  expect(
    state.requests.find((request) => request.path.endsWith("/archive")).body
      .expected_version,
  ).toBe(3);
  await expect(root(page)).toContainText("csv.online/blog");
});

test("verificar DNS durante uma edição preserva a versão original e detecta concorrência", async ({
  page,
}) => {
  const state = await start(page);
  await section(page, "csv.email");
  await input(page, "Finalidade pretendida").fill("Rascunho local.");
  state.email.purpose = "Decisão de outra pessoa.";
  state.email.version = 2;
  await button(page, "Verificar configuração DNS").click();
  await expect(root(page)).toContainText("continuam baseados na versão 1");
  await expect(input(page, "Finalidade pretendida")).toHaveValue(
    "Rascunho local.",
  );
  await button(page, "Salvar preparação").click();
  await expect(root(page)).toContainText("Outra pessoa alterou esta área.");
  expect(
    state.requests.find((request) => request.method === "PUT").body
      .expected_version,
  ).toBe(1);
  expect(state.email.purpose).toBe("Decisão de outra pessoa.");
});

test("listas paginam em 25 itens e enviam busca, etiqueta, situação e ordenação", async ({
  page,
}) => {
  const state = await mockApi(page);
  states.set(page, state);
  const sample = state.links[0];
  for (let i = 0; i < 26; i++) {
    const item = structuredClone(sample);
    item.id = `rotativo-${i}`;
    item.slug = `guia-${i}`;
    item.destination.url = `https://grupocsv.com/guia-${i}`;
    item.destination.id = `destino-${i}`;
    item.destination.link_id = item.id;
    item.current_destination_id = item.destination.id;
    state.links.push(item);
    state.histories.set(item.id, [structuredClone(item.destination)]);
  }
  await openCentral(page);
  await section(page, "Rotativos");
  await expect(root(page).locator(".cl-link-table tbody tr")).toHaveCount(25);
  await button(page, "Próxima").click();
  await expect(root(page).locator(".cl-link-table tbody tr")).toHaveCount(2);
  await expect(root(page)).toContainText("Página 2");
  await input(page, "Buscar").fill("blog");
  await input(page, "Etiqueta").fill("institucional");
  await input(page, "Situação").selectOption("ativo");
  await input(page, "Ordenação").selectOption("slug");
  await button(page, "Filtrar").click();
  await expect(root(page).locator(".cl-link-table tbody tr")).toHaveCount(1);
  expect(
    state.requests.filter((request) => request.path === "/links").at(-1).params,
  ).toMatchObject({
    q: "blog",
    tag: "institucional",
    status: "ativo",
    sort: "slug",
    page: "1",
    page_size: "25",
    kind: "rotativo",
  });
});

test("regra provisória 302 mostra aviso explícito e não confirma sem a versão pública", async ({
  page,
}) => {
  const state = await start(page, { provisional: true });
  await openDetail(page);
  await expect(root(page)).toContainText(
    "A regra provisória ainda responde em csv.online",
  );
  await expect(root(page)).toContainText("Propagação não confirmada");
  expect(state.external).toContain("https://csv.online/_csv/v/blog");
  expect(
    state.external.some((url) => new URL(url).hostname === "pre.csv.online"),
  ).toBe(false);
});

test("alerta de credencial no destino exige reconhecimento antes de publicar", async ({
  page,
}) => {
  const state = await start(page, { credentialWarning: true });
  await createForm(page);
  await input(page, "Destino").fill("https://grupocsv.com/guia?key=exemplo");
  await button(page, "Testar destino").click();
  const confirmation = root(page).getByRole("checkbox", {
    name: "Este endereço parece conter uma credencial e ficará visível para quem usar o link",
    exact: true,
  });
  await expect(confirmation).toBeVisible();
  await button(page, "Criar link").click();
  await expect(root(page)).toContainText(
    "Confirme que o endereço ficará visível para quem usar o link.",
  );
  expect(
    state.requests.filter(
      (request) => request.method === "POST" && request.path === "/links",
    ),
  ).toHaveLength(0);
  await confirmation.check();
  await button(page, "Criar link").click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) => request.method === "POST" && request.path === "/links",
      ),
    )
    .toBe(true);
  expect(
    state.requests.find(
      (request) => request.method === "POST" && request.path === "/links",
    ).body.confirm_credential_url,
  ).toBe(true);
});

for (const width of [1440, 768, 390, 320]) {
  test(`H3: Filtrar acompanha a altura dos campos em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await start(page);
    await section(page, "Rotativos");
    const filter = await button(page, "Filtrar").boundingBox();
    const search = await input(page, "Buscar").boundingBox();
    expect(Math.abs(filter.height - search.height)).toBeLessThanOrEqual(2);
    if (width >= 768) {
      const alignedField =
        width === 1440
          ? search
          : await input(page, "Ordenação").boundingBox();
      expect(
        Math.abs(filter.y + filter.height - alignedField.y - alignedField.height),
      ).toBeLessThanOrEqual(2);
    } else {
      expect(Math.abs(filter.width - search.width)).toBeLessThanOrEqual(2);
    }
  });
}
