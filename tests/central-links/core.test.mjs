import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const file = new URL("../../admin/central-links.js", import.meta.url);
function core() {
  assert.ok(fs.existsSync(file), "O módulo administrativo precisa existir");
  const ctx = { window: {}, URL, URLSearchParams, Intl, Date, AbortSignal };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
  return ctx.window.CsvLinksCore;
}
test("datas são exibidas em Brasília e validade local é enviada em UTC", () => {
  const c = core();
  assert.match(c.date("2026-10-22T15:30:00Z"), /12:30/);
  assert.equal(c.toUTC("2026-10-22T12:30"), "2026-10-22T15:30:00.000Z");
  assert.equal(c.toLocal("2026-10-22T15:30:00Z"), "2026-10-22T12:30");
});
test("propagação exige tempo e versão, sem afirmar confirmação global", () => {
  const c = core(),
    published = "2026-10-22T12:00:00Z",
    now = Date.parse(published);
  assert.equal(
    c.propagation(published, 2, 2, now + 89000).status,
    "Em propagação",
  );
  assert.equal(
    c.propagation(published, 2, 1, now + 91000).status,
    "Em propagação",
  );
  assert.equal(
    c.propagation(published, 2, 2, now + 90000).status,
    "Confirmado",
  );
  assert.equal(
    c.propagation(published, 2, null, now + 300000).status,
    "Propagação não confirmada",
  );
});
test("endereços públicos e destinos mantêm a fronteira HTTPS", () => {
  const c = core();
  assert.equal(c.publicURL("blog"), "https://csv.online/blog");
  assert.equal(c.safeURL("javascript:alert(1)"), null);
  assert.equal(c.safeURL("https://user:password@example.com"), null);
  assert.equal(c.pageWarning("https://open.grupocsv.com/pagina"), true);
  assert.equal(c.pageWarning("https://hub.grupocsv.com/p/material"), true);
  assert.equal(c.pageWarning("https://example.com/p/material"), false);
});
test("cliente usa somente getToken e X-Auth-Token, com JSON e sem credenciais de navegador", async () => {
  const calls = [];
  const api = core().createApi({
    apiBase: "https://example.com/v1",
    getToken: () => "sessao-ficticia",
    clearAuth() {},
    showAuth() {},
    fetch: async (...args) => {
      calls.push(args);
      return { ok: true, status: 200, json: async () => ({ role: "admin" }) };
    },
  });
  assert.equal((await api("/me")).role, "admin");
  await api("/links", { method: "POST", body: { slug: "blog" } });
  assert.equal(calls[0][1].headers["X-Auth-Token"], "sessao-ficticia");
  assert.equal(calls[0][1].credentials, "omit");
  assert.equal(calls[1][1].body, '{"slug":"blog"}');
});
test("401 limpa autenticação; erros preservam código, identificador e conflito literal", async () => {
  const c = core();
  let cleared = 0,
    shown = 0;
  for (const status of [401, 403, 409, 422, 429, 502, 503]) {
    const error =
      status === 409
        ? "version_conflict"
        : status === 403
          ? "must_change_password"
          : "falha";
    const api = c.createApi({
      apiBase: "https://example.com",
      getToken: () => "sessao",
      clearAuth() {
        cleared++;
      },
      showAuth() {
        shown++;
      },
      fetch: async () => ({
        ok: false,
        status,
        json: async () => ({
          error,
          request_id: "req-ficticia",
          message: "Falha de teste",
        }),
      }),
    });
    await assert.rejects(
      api("/me"),
      (e) =>
        e.status === status &&
        e.requestId === "req-ficticia" &&
        e.code === error &&
        (status !== 409 ||
          e.message ===
            "Outra pessoa alterou este link enquanto você editava. Recarregue para ver a versão atual. Nada foi gravado."),
    );
  }
  assert.equal(cleared, 1);
  assert.equal(shown, 1);
});
test("Admin e módulos publicados permanecem espelhados", () => {
  for (const path of [
    "index.html",
    "central-links.js",
    "central-links.css",
    "central-links-sections.js",
  ]) {
    assert.ok(
      fs.existsSync(new URL("../../admin/" + path, import.meta.url)),
      path,
    );
    assert.equal(
      fs.readFileSync(new URL("../../admin/" + path, import.meta.url), "utf8"),
      fs.readFileSync(
        new URL("../../docs/public/admin/" + path, import.meta.url),
        "utf8",
      ),
    );
  }
});
test("identificador de erro também é lido no cabeçalho quando disponível", async () => {
  const api = core().createApi({
    apiBase: "https://example.com",
    getToken: () => "sessao",
    clearAuth() {},
    showAuth() {},
    fetch: async () => ({
      ok: false,
      status: 503,
      headers: {
        get: (name) => (name === "X-Request-Id" ? "req-cabecalho" : null),
      },
      json: async () => ({ error: "indisponivel" }),
    }),
  });
  await assert.rejects(api("/links"), (e) => e.requestId === "req-cabecalho");
});
