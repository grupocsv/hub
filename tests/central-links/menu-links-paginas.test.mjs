import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) =>
  fs.readFileSync(new URL("../../" + p, import.meta.url), "utf8");

function menu(html) {
  const start = html.indexOf('<div class="sidebar" id="sidebar">');
  const end = html.indexOf('id="sidebar-overlay"', start);
  assert.ok(start >= 0 && end > start, "menu lateral não encontrado");
  const block = html.slice(start, end);
  return block
    .split('<div class="sidebar-section">')
    .slice(1)
    .map((chunk) => ({
      label: chunk
        .match(/sidebar-section-label">([^<]+)</)[1]
        .replace("&uacute;", "ú")
        .trim(),
      tabs: [...chunk.matchAll(/class="sidebar-item[^"]*" data-tab="([^"]+)"/g)].map(
        (m) => m[1],
      ),
    }));
}

test("Links e Páginas reúne Central de Links e Páginas Públicas logo abaixo de Geral", () => {
  const sections = menu(read("admin/index.html"));
  assert.deepEqual(
    sections.map((s) => s.label),
    [
      "Geral",
      "Links e Páginas",
      "Deck",
      "Infraestrutura",
      "Comunicação",
      "Conteúdo",
      "Sistema",
    ],
  );
  const links = sections.find((s) => s.label === "Links e Páginas");
  assert.deepEqual(links.tabs, ["central-links", "public-links"]);
  assert.deepEqual(
    sections.find((s) => s.label === "Comunicação").tabs,
    ["waba"],
  );
  assert.deepEqual(
    sections.find((s) => s.label === "Geral").tabs,
    ["overview", "passwords", "users", "access-logs"],
  );
});

test("a reorganização preserva os mesmos identificadores de aba e de conteúdo", () => {
  const html = read("admin/index.html");
  const tabs = menu(html).flatMap((s) => s.tabs);
  const expected = [
    "access-logs",
    "admins",
    "asset-bucket",
    "blog-admin",
    "central-links",
    "compass",
    "cooperados-ugv",
    "deck-api",
    "deck-feedback",
    "deck-memories",
    "deck-users",
    "overview",
    "panta",
    "passwords",
    "public-links",
    "services",
    "users",
    "waba",
  ];
  assert.deepEqual([...tabs].sort(), expected);
  assert.equal(new Set(tabs).size, tabs.length);
  for (const tab of tabs)
    assert.match(
      html,
      new RegExp(`class="admin-tab-content[^"]*" data-tab="${tab}"`),
      tab,
    );
});

test("rótulos novos no menu, no card da Visão Geral e no aviso da Central", () => {
  const html = read("admin/index.html");
  assert.match(
    html,
    /data-tab="public-links">\s*<svg[^>]*>[\s\S]*?<\/svg>\s*Páginas Públicas\s*<\/button>/,
  );
  assert.match(html, /<div class="sc-label">Páginas Públicas<\/div>/);
  assert.doesNotMatch(html, /Links Públicos/);
  const js = read("admin/central-links.js");
  assert.equal(
    js.split("A revogação desta página é feita em Páginas Públicas").length - 1,
    2,
  );
  assert.doesNotMatch(js, /Links Públicos/);
});

test("o atalho de Páginas Públicas só aciona o item existente do menu", () => {
  const html = read("admin/index.html");
  const button = html.match(/<button[^>]*id="pl-open-central"[^>]*>[^<]*<\/button>/);
  assert.ok(button, "atalho ausente");
  assert.match(button[0], />Abrir Central de Links<\/button>$/);
  assert.match(
    button[0],
    /onclick="document\.querySelector\('\.sidebar-item\[data-tab=&quot;central-links&quot;\]'\)\.click\(\)"/,
  );
  assert.doesNotMatch(button[0], /fetch|https?:|localStorage/);
});

test("o item ativo do menu é anunciado com aria-current", () => {
  const html = read("admin/index.html");
  assert.match(
    html,
    /<button class="sidebar-item active" data-tab="overview" aria-current="page">/,
  );
  assert.match(html, /i\.removeAttribute\('aria-current'\)/);
  assert.match(html, /this\.setAttribute\('aria-current', 'page'\)/);
});

test("o espelho publicado do Admin é idêntico à fonte", () => {
  for (const file of ["index.html", "central-links.js"])
    assert.equal(
      read("docs/public/admin/" + file),
      read("admin/" + file),
      file,
    );
});
