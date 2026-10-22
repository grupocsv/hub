import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function element(tag = "div") {
  return {
    tagName: tag.toUpperCase(),
    children: [],
    listeners: {},
    dataset: {},
    value: "",
    classList: { contains: () => true },
    append(...children) {
      this.children.push(...children);
      children.forEach((child) => {
        child.parentElement = this;
      });
    },
    replaceChildren(...children) {
      this.children = [];
      this.append(...children);
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    addEventListener(name, callback) {
      this.listeners[name] = callback;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function allChildren(parent) {
  return parent.children.flatMap((child) => [child, ...allChildren(child)]);
}

test("filtrar links sem etiqueta não envia filtro vazio ao servidor", async () => {
  const root = element(),
    view = element(),
    alert = element();
  const navigation = element("button");
  navigation.dataset.clSection = "rotativo";
  root.querySelectorAll = () => [navigation];
  const nodes = { centralLinks: root, "cl-view": view, "cl-notice": alert };
  const requests = [];
  const window = {
    createCentralLinksSections: () => ({ overview: async () => {} }),
  };
  const context = {
    window,
    URL,
    URLSearchParams,
    Date,
    Intl,
    AbortSignal,
    clearTimeout,
    setTimeout,
    document: {
      getElementById: (id) => nodes[id],
      createElement: element,
      querySelectorAll: () => [navigation],
    },
  };
  vm.runInNewContext(
    readFileSync(
      new URL("../../admin/central-links.js", import.meta.url),
      "utf8",
    ),
    context,
  );
  const controller = window.createCentralLinks({
    apiBase: "https://example.com/v1",
    getToken: () => "sessao-simulada",
    clearAuth() {},
    showAuth() {},
    fetch: async (url) => {
      requests.push(new URL(url));
      return {
        ok: true,
        json: async () =>
          url.endsWith("/me") ? { role: "admin" } : { links: [], total: 0 },
      };
    },
  });
  await controller.open();
  await navigation.listeners.click();
  const filter = allChildren(view).find(
    (node) => node.tagName === "BUTTON" && node.textContent === "Filtrar",
  );
  assert.ok(filter, "A lista precisa oferecer a aplicação de filtros.");
  await filter.listeners.click();
  const lastList = requests
    .filter((url) => url.pathname === "/v1/links")
    .at(-1);
  assert.equal(
    lastList.searchParams.has("tag"),
    false,
    "O servidor trata tag vazio como filtro por etiqueta vazia.",
  );
  assert.equal(lastList.searchParams.get("kind"), "rotativo");
});

test("resposta atrasada de teste não valida outra URL digitada durante a consulta", async () => {
  const root = element(),
    view = element(),
    alert = element();
  const navigation = element("button");
  navigation.dataset.clSection = "rotativo";
  root.querySelectorAll = () => [navigation];
  const nodes = { centralLinks: root, "cl-view": view, "cl-notice": alert };
  let replyToCheck;
  const window = {
    createCentralLinksSections: () => ({ overview: async () => {} }),
  };
  vm.runInNewContext(
    readFileSync(
      new URL("../../admin/central-links.js", import.meta.url),
      "utf8",
    ),
    {
      window,
      URL,
      URLSearchParams,
      Date,
      Intl,
      AbortSignal,
      clearTimeout,
      setTimeout,
      document: {
        getElementById: (id) => nodes[id],
        createElement: element,
        createTextNode: (text) =>
          Object.assign(element("#text"), { textContent: text }),
        querySelectorAll: () => [navigation],
      },
    },
  );
  const controller = window.createCentralLinks({
    apiBase: "https://example.com/v1",
    getToken: () => "sessao-simulada",
    clearAuth() {},
    showAuth() {},
    fetch: async (url) => {
      if (url.endsWith("/checks"))
        return new Promise((resolve) => {
          replyToCheck = resolve;
        });
      return {
        ok: true,
        json: async () =>
          url.endsWith("/me") ? { role: "admin" } : { links: [], total: 0 },
      };
    },
  });
  await controller.open();
  await navigation.listeners.click();
  await allChildren(view)
    .find((node) => node.textContent === "Criar rotativo")
    .listeners.click();
  const destination = allChildren(view).find((node) => node.type === "url");
  destination.value = "https://example.com/primeiro";
  destination.listeners.input();
  const pending = allChildren(view)
    .find((node) => node.textContent === "Testar destino")
    .listeners.click();
  assert.ok(
    replyToCheck,
    "A consulta do primeiro destino deve estar em andamento.",
  );
  destination.value = "https://example.com/segundo";
  destination.listeners.input();
  replyToCheck({
    ok: true,
    json: async () => ({
      url: "https://example.com/primeiro",
      status: "ok",
      http_status: 200,
      final_url: "https://example.com/primeiro",
      redirects: 0,
      has_og_image: false,
      check_id: "consulta-simulada",
      credential_warning: false,
    }),
  });
  await pending;
  const result = allChildren(view).find(
    (node) => node.className === "cl-check-result",
  );
  assert.equal(destination.value, "https://example.com/segundo");
  assert.equal(
    result.children.length,
    0,
    "O resultado do primeiro destino não pode aparecer como teste do segundo.",
  );
});

test("um reteste bem-sucedido revoga a autorização anterior para publicar com falha", async () => {
  const root = element(),
    view = element(),
    alert = element();
  const navigation = element("button");
  navigation.dataset.clSection = "rotativo";
  root.querySelectorAll = () => [navigation];
  const nodes = { centralLinks: root, "cl-view": view, "cl-notice": alert };
  const window = {
    createCentralLinksSections: () => ({ overview: async () => {} }),
  };
  let attempts = 0;
  vm.runInNewContext(
    readFileSync(
      new URL("../../admin/central-links.js", import.meta.url),
      "utf8",
    ),
    {
      window,
      URL,
      URLSearchParams,
      Date,
      Intl,
      AbortSignal,
      clearTimeout,
      setTimeout,
      document: {
        getElementById: (id) => nodes[id],
        createElement: element,
        createTextNode: (text) =>
          Object.assign(element("#text"), { textContent: text }),
        querySelectorAll: () => [navigation],
      },
    },
  );
  const controller = window.createCentralLinks({
    apiBase: "https://example.com/v1",
    getToken: () => "sessao-simulada",
    clearAuth() {},
    showAuth() {},
    fetch: async (url) => ({
      ok: true,
      json: async () => {
        if (url.endsWith("/me")) return { role: "admin" };
        if (url.endsWith("/checks"))
          return {
            url: "https://example.com/destino",
            status: ++attempts === 1 ? "falhou" : "ok",
            http_status: attempts === 1 ? 503 : 200,
            final_url: "https://example.com/destino",
            redirects: 0,
            has_og_image: false,
            check_id: "consulta-simulada",
            credential_warning: false,
          };
        return { links: [], total: 0 };
      },
    }),
  });
  await controller.open();
  await navigation.listeners.click();
  await allChildren(view)
    .find((node) => node.textContent === "Criar rotativo")
    .listeners.click();
  const destination = allChildren(view).find((node) => node.type === "url");
  destination.value = "https://example.com/destino";
  destination.listeners.input();
  const testButton = allChildren(view).find(
    (node) => node.textContent === "Testar destino",
  );
  await testButton.listeners.click();
  const override = allChildren(view).find((node) => node.type === "checkbox");
  assert.equal(override.parentElement.hidden, false);
  override.checked = true;
  await testButton.listeners.click();
  assert.equal(override.parentElement.hidden, true);
  assert.equal(
    override.checked,
    false,
    "A publicação não pode herdar uma autorização que ficou oculta após o reteste.",
  );
});

test("resposta atrasada de identidade não reabre a seção após sair da aba", async () => {
  const root = element(),
    view = element(),
    alert = element();
  const nodes = { centralLinks: root, "cl-view": view, "cl-notice": alert };
  let replyToIdentity;
  let openings = 0;
  const window = {
    createCentralLinksSections: () => ({
      overview: async () => {
        openings++;
      },
    }),
  };
  vm.runInNewContext(
    readFileSync(
      new URL("../../admin/central-links.js", import.meta.url),
      "utf8",
    ),
    {
      window,
      URL,
      URLSearchParams,
      Date,
      Intl,
      AbortSignal,
      clearTimeout,
      setTimeout,
      document: {
        getElementById: (id) => nodes[id],
        createElement: element,
        querySelectorAll: () => [],
      },
    },
  );
  const controller = window.createCentralLinks({
    apiBase: "https://example.com/v1",
    getToken: () => "sessao-simulada",
    clearAuth() {},
    showAuth() {},
    fetch: async () =>
      new Promise((resolve) => {
        replyToIdentity = resolve;
      }),
  });
  const opening = controller.open();
  assert.ok(replyToIdentity, "A identidade deve estar sendo consultada.");
  controller.close();
  replyToIdentity({ ok: true, json: async () => ({ role: "admin" }) });
  await opening;
  assert.equal(
    openings,
    0,
    "A resposta de uma abertura encerrada deve ser descartada.",
  );
});

test("resposta atrasada de criação não abre detalhes depois de sair da aba", async () => {
  const root = element(),
    view = element(),
    alert = element();
  const navigation = element("button");
  navigation.dataset.clSection = "rotativo";
  root.querySelectorAll = () => [navigation];
  const nodes = { centralLinks: root, "cl-view": view, "cl-notice": alert };
  const requests = [];
  let replyToCreation;
  const window = {
    createCentralLinksSections: () => ({ overview: async () => {} }),
  };
  vm.runInNewContext(
    readFileSync(
      new URL("../../admin/central-links.js", import.meta.url),
      "utf8",
    ),
    {
      window,
      URL,
      URLSearchParams,
      Date,
      Intl,
      AbortSignal,
      clearTimeout,
      setTimeout,
      document: {
        getElementById: (id) => nodes[id],
        createElement: element,
        createTextNode: (text) =>
          Object.assign(element("#text"), { textContent: text }),
        querySelectorAll: () => [navigation],
      },
    },
  );
  const controller = window.createCentralLinks({
    apiBase: "https://example.com/v1",
    getToken: () => "sessao-simulada",
    clearAuth() {},
    showAuth() {},
    fetch: async (url, options) => {
      requests.push({ url, method: options.method });
      if (url.endsWith("/links") && options.method === "POST") {
        return new Promise((resolve) => {
          replyToCreation = resolve;
        });
      }
      return {
        ok: true,
        json: async () => {
          if (url.endsWith("/me")) return { role: "admin" };
          if (url.endsWith("/checks"))
            return {
              url: "https://example.com/destino",
              status: "ok",
              http_status: 200,
              final_url: "https://example.com/destino",
              redirects: 0,
              has_og_image: false,
              check_id: "consulta-simulada",
              credential_warning: false,
            };
          return { links: [], total: 0 };
        },
      };
    },
  });
  await controller.open();
  await navigation.listeners.click();
  await allChildren(view)
    .find((node) => node.textContent === "Criar rotativo")
    .listeners.click();
  for (const [label, value] of [
    ["Nome curto", "guia"],
    ["Título interno", "Guia de exemplo"],
  ]) {
    const wrapper = allChildren(view).find(
      (node) => node.tagName === "LABEL" && node.textContent === label,
    ).parentElement;
    wrapper.children.find((node) => node.tagName === "INPUT").value = value;
  }
  const destination = allChildren(view).find((node) => node.type === "url");
  destination.value = "https://example.com/destino";
  destination.listeners.input();
  await allChildren(view)
    .find((node) => node.textContent === "Testar destino")
    .listeners.click();
  const form = allChildren(view).find((node) => node.id === "cl-form");
  form.listeners.submit({ preventDefault() {} });
  assert.ok(
    replyToCreation,
    "A criação deve estar aguardando a resposta do servidor.",
  );
  controller.close();
  replyToCreation({
    ok: true,
    json: async () => ({ id: "link-novo", route_written: true }),
  });
  await new Promise(setImmediate);
  assert.equal(
    requests.some((request) => request.url.endsWith("/links/link-novo")),
    false,
    "A gravação concluída não deve iniciar outra navegação depois que a aba foi fechada.",
  );
});
