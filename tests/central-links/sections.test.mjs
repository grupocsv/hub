import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");
const file = resolve(root, "admin/central-links-sections.js");

function load() {
  assert.ok(existsSync(file), "Módulo das seções ausente");
  const window = {};
  vm.runInNewContext(readFileSync(file, "utf8"), {
    window,
    Date,
    Intl,
    URL,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
    Blob,
  });
  return window;
}

test("seções usam contrato explícito e preservam o espelho do Admin", () => {
  const window = load();
  assert.equal(typeof window.createCentralLinksSections, "function");
  assert.deepEqual(
    readFileSync(file),
    readFileSync(resolve(root, "docs/public/admin/central-links-sections.js")),
  );
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(
    source,
    /\.innerHTML\s*=|insertAdjacentHTML|document\.write/,
  );
  assert.match(source, /https:\/\/csv\.online\/_csv\/health/);
  assert.doesNotMatch(source, /pre\.csv\.online/);
});

test("períodos de métricas seguem o calendário de Brasília sem depender do fuso local", () => {
  const window = load();
  assert.equal(
    JSON.stringify(
      window.centralLinksPeriod(7, new Date("2026-10-22T01:00:00Z")),
    ),
    JSON.stringify({ from: "2026-10-15", to: "2026-10-21" }),
  );
  assert.equal(
    JSON.stringify(
      window.centralLinksPeriod(30, new Date("2026-01-01T15:00:00Z")),
    ),
    JSON.stringify({ from: "2025-12-03", to: "2026-01-01" }),
  );
});

test("limite de 24 meses respeita 29 de fevereiro e nomes reutilizados continuam identificáveis", () => {
  const window = load();
  assert.equal(typeof window.centralLinksRetentionDay, "function");
  assert.equal(typeof window.centralLinksChoiceLabel, "function");
  assert.equal(
    window.centralLinksRetentionDay(new Date("2024-02-29T15:00:00Z")),
    "2022-02-28",
  );
  assert.equal(
    window.centralLinksRetentionDay(new Date("2026-10-22T01:00:00Z")),
    "2024-10-21",
  );
  const active = { slug: "guia", deleted_at: null, archived_at: null };
  const removed = { ...active, deleted_at: "2026-10-20T15:00:00Z" };
  const archived = { ...active, archived_at: "2026-10-21T15:00:00Z" };
  assert.equal(
    window.centralLinksChoiceLabel(active, () => "DATA"),
    "csv.online/guia",
  );
  assert.equal(
    window.centralLinksChoiceLabel(removed, () => "DATA"),
    "csv.online/guia · Excluído em DATA",
  );
  assert.equal(
    window.centralLinksChoiceLabel(archived, () => "DATA"),
    "csv.online/guia · Arquivado",
  );
});

test("série diária preserva dias sem cliques e separa robôs", () => {
  const window = load();
  const rows = [
    { value: "2026-10-20", traffic: "clique", count: 4 },
    { value: "2026-10-22", traffic: "robo", count: 2 },
  ];
  const actual = window.centralLinksDailySeries(
    rows,
    "2026-10-20",
    "2026-10-22",
  );
  assert.equal(
    JSON.stringify(actual),
    JSON.stringify([
      { day: "2026-10-20", clique: 4, robo: 0 },
      { day: "2026-10-21", clique: 0, robo: 0 },
      { day: "2026-10-22", clique: 0, robo: 2 },
    ]),
  );
});

function node(tag, text = "") {
  return {
    nodeType: 1,
    tagName: tag,
    textContent: text,
    dataset: {},
    children: [],
    append(...items) {
      this.children.push(...items);
    },
    replaceChildren(...items) {
      this.children = items;
    },
    setAttribute() {},
  };
}

function contents(parent) {
  return [parent.textContent, ...parent.children.map(contents)].join(" ");
}

async function overviewText(jobs) {
  const window = load();
  const view = node("div");
  const format = (value) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(value));
  const sections = window.createCentralLinksSections({
    api: async (path) =>
      path === "/metrics/overview"
        ? { jobs }
        : { at: "2026-10-22T15:00:00Z", domains: [] },
    el: node,
    button: (text) => node("button", text),
    notice() {},
    view,
    role: "admin",
    date: format,
  });
  await sections.overview();
  return contents(view);
}

test("visão geral informa última execução bem-sucedida de cada etapa diária em Brasília", async () => {
  const text = await overviewText([
    { job: "conciliacao_kv", last_success: "2026-10-22T09:00:01Z" },
    { job: "teste_diario", last_success: "2026-10-22T09:02:00Z" },
    { job: "retencao_metricas", last_success: "2026-10-22T09:02:10Z" },
  ]);
  assert.match(text, /Últimas execuções bem-sucedidas da tarefa diária/);
  assert.match(text, /Teste diário dos destinos 22\/10\/2026, 06:02:00/);
  assert.match(text, /Conciliação das rotas 22\/10\/2026, 06:00:01/);
  assert.match(text, /Retenção das métricas 22\/10\/2026, 06:02:10/);
});

test("ausência de execução diária confirmada permanece explícita", async () => {
  const text = await overviewText([]);
  assert.match(
    text,
    /Teste diário dos destinos Nenhuma execução bem-sucedida informada/,
  );
});
