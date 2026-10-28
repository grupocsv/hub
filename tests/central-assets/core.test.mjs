import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const file = new URL("../../admin/central-assets.js", import.meta.url);
const mirror = new URL("../../docs/public/admin/central-assets.js", import.meta.url);
const manifest = JSON.parse(
  fs.readFileSync(new URL("./fixtures/manifest.json", import.meta.url), "utf8"),
);

function core() {
  assert.ok(fs.existsSync(file), "O módulo da Central de Assets precisa existir");
  const ctx = { window: {}, URL, Intl, Date, Map, Set };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
  return ctx.window.CsvAssetsCore;
}
const clone = (value) => JSON.parse(JSON.stringify(value));
const plain = clone;
const filters = (changes = {}) => ({
  q: "",
  brand: "",
  category: "",
  purpose: "",
  type: "",
  format: "",
  polarity: "",
  sit: "",
  order: "marca",
  ...changes,
});

test("o espelho em docs/public/admin é idêntico ao módulo do Admin", () => {
  assert.equal(fs.readFileSync(mirror, "utf8"), fs.readFileSync(file, "utf8"));
});

test("as contagens saem do manifesto e somam o total", () => {
  const c = core();
  const data = c.prepare(clone(manifest));
  const s = data.summary;
  assert.equal(s.total, manifest.assets.length);
  const byCategory = Object.values(s.categories).reduce((a, b) => a + b, 0);
  const byBrand = data.brands.reduce((a, b) => a + b.total, 0);
  const byGroup = data.groups.reduce((a, g) => a + g.total, 0);
  assert.equal(byCategory, s.total);
  assert.equal(byBrand, s.total);
  assert.equal(byGroup, s.total);
  assert.equal(s.brands, new Set(manifest.assets.map((a) => a.brand)).size);
  assert.equal(s.copies, manifest.assets.filter((a) => a.canonical_of).length);
});

test("marcas principais seguem a ordem do cadastro, com logo pela URL estável", () => {
  const c = core();
  const data = c.prepare(clone(manifest));
  const featured = data.summary.featured;
  assert.equal(featured.length, 12);
  const orders = featured.map((b) => b.order);
  assert.deepEqual(plain(orders), plain(orders).sort((a, b) => a - b));
  assert.equal(featured[0].slug, "grupo-csv");
  for (const b of featured)
    assert.match(b.logo, /^https:\/\/assets\.grupocsv\.com\/logos\//);
});

test("marca incorporada sem assets não aparece nos grupos", () => {
  const c = core();
  const data = c.prepare(clone(manifest));
  const slugs = data.groups.flatMap((g) => g.brands.map((b) => b.slug));
  assert.equal(manifest.brand_registry.gabi.status, "incorporado");
  assert.ok(!slugs.includes("gabi"));
  assert.ok(slugs.includes("gabi-care"));
});

test("busca ignora acentos e encontra pelo valor anterior preservado em legacy", () => {
  const c = core();
  const data = c.prepare(clone(manifest));
  const withAccent = c.filterAssets(data, filters({ q: "saúde" })).length;
  const without = c.filterAssets(data, filters({ q: "saude" })).length;
  assert.ok(withAccent > 0);
  assert.equal(withAccent, without);
  const legacyGabi = c.filterAssets(data, filters({ q: "gabi" })).map((a) => a.key);
  assert.ok(legacyGabi.includes("logos/gabi/simbolo-gabi-1024.png"));
});

test("filtros combinados e paginação de 24 itens", () => {
  const c = core();
  const data = c.prepare(clone(manifest));
  const logos = c.filterAssets(data, filters({ brand: "axiacare", category: "logo" }));
  assert.ok(logos.length > 0);
  assert.ok(logos.every((a) => a.brand === "axiacare" && a.category === "logo"));
  const page1 = c.paginate(data.assets, 1);
  const page3 = c.paginate(data.assets, 3);
  assert.equal(c.PER_PAGE, 24);
  assert.equal(page1.items.length, 24);
  assert.equal(page1.pages, Math.ceil(data.assets.length / 24));
  assert.equal(page3.page, 3);
  assert.equal(page3.items.length, data.assets.length - 48);
  assert.equal(c.paginate(data.assets, 99).page, page1.pages);
  assert.deepEqual(plain(c.pageList(5, 10)), [1, "…", 4, 5, 6, "…", 10]);
});

test("pendências: incompleto, sem cadastro, transparência e revisão", () => {
  const c = core();
  const m = clone(manifest);
  const base = m.assets.find((a) => a.brand === "thera" && a.format === "svg");
  m.assets.push(
    { ...clone(base), key: "teste/sem-url.svg", url: "" },
    { ...clone(base), key: "teste/sem-cadastro.svg", brand: "marca-inexistente" },
    {
      ...clone(base),
      key: "teste/opaco.png",
      transparent: true,
      tech: { has_alpha: false, transparent_fraction: 0 },
    },
    { ...clone(base), key: "teste/revisao.svg", review_status: "pendente" },
  );
  const data = c.prepare(m);
  const issues = (key) => plain(data.byKey.get(key).issues);
  assert.deepEqual(issues("teste/sem-url.svg"), ["incompleto"]);
  assert.deepEqual(issues("teste/sem-cadastro.svg"), ["sem-cadastro"]);
  assert.deepEqual(issues("teste/opaco.png"), ["transparencia"]);
  assert.deepEqual(issues("teste/revisao.svg"), ["revisao"]);
  assert.equal(data.summary.pending, c.prepare(clone(manifest)).summary.pending + 4);
});

test("o manifesto de referência não tem pendências e conta as reclassificações", () => {
  const c = core();
  const s = c.prepare(clone(manifest)).summary;
  assert.equal(s.pending, 0);
  assert.equal(
    s.reclassified,
    manifest.assets.filter(
      (a) => a.legacy && ["brand", "category", "transparent"].some((k) => k in a.legacy),
    ).length,
  );
});

test("manifesto antigo (sem cadastro nem campos novos) continua funcionando", () => {
  const c = core();
  const old = {
    version: "1.0.0",
    updated: "2026-10-27T23:35:51Z",
    assets: manifest.assets.map((a) => ({
      key: a.key,
      brand: (a.legacy && a.legacy.brand) || a.brand,
      category: (a.legacy && a.legacy.category) || a.category,
      description: a.description,
      orientation: a.orientation,
      polarity: a.polarity,
      format: a.format,
      transparent: a.transparent,
      url: a.url,
      added: a.added,
      tags: a.tags,
    })),
  };
  const data = c.prepare(old);
  assert.equal(data.summary.total, old.assets.length);
  assert.equal(data.summary.issues["sem-cadastro"], 0);
  assert.equal(data.summary.featured.length, 0);
  assert.equal(data.groups.length, 1);
  assert.equal(data.groups[0].total, old.assets.length);
  assert.equal(data.byKey.get(old.assets[0].key).title, old.assets[0].key.split("/").pop());
});

test("referência copiada traz URL estável, key e slug técnico", () => {
  const c = core();
  const data = c.prepare(clone(manifest));
  const asset = data.byKey.get("logos/unimed-gv/box-pinheiro.png");
  const ref = c.reference(asset);
  assert.match(ref, /URL: https:\/\/assets\.grupocsv\.com\/logos\/unimed-gv\/box-pinheiro\.png/);
  assert.match(ref, /Key: logos\/unimed-gv\/box-pinheiro\.png/);
  assert.match(ref, /brand=unimed-gv/);
});

test("URL fora do domínio de assets é ignorada e o texto é escapado", () => {
  const c = core();
  assert.equal(
    c.assetURL({ key: "logos/x/a b.png", url: "javascript:alert(1)" }),
    "https://assets.grupocsv.com/logos/x/a%20b.png",
  );
  assert.equal(
    c.assetURL({ key: "k", url: 'https://assets.grupocsv.com/a" onerror="x' }),
    "https://assets.grupocsv.com/k",
  );
  assert.equal(c.esc('<img src=x onerror="a">'), "&lt;img src=x onerror=&quot;a&quot;&gt;");
});

test("fundo da pré-visualização segue o arquivo, com troca manual", () => {
  const c = core();
  assert.equal(c.previewClass({ dark: true, alpha: true }, "auto"), "ca-dark");
  assert.equal(c.previewClass({ dark: false, alpha: true }, "auto"), "ca-check");
  assert.equal(c.previewClass({ dark: false, alpha: false }, "auto"), "");
  assert.equal(c.previewClass({ dark: true, alpha: true }, "claro"), "");
  assert.equal(c.previewClass({ dark: false, alpha: false }, "escuro"), "ca-dark");
});

test("o módulo não grava nada: sem métodos de escrita nem credenciais", () => {
  const source = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(source, /method\s*:\s*["'](POST|PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(source, /Authorization|X-Auth-Token|localStorage/i);
  assert.doesNotMatch(source, /\son(click|error|load)=/i);
});

test("manifesto vazio ou sem a lista de assets não quebra a aba", () => {
  const c = core();
  for (const empty of [{}, { assets: [] }, { assets: null }]) {
    const data = c.prepare(empty);
    assert.equal(data.summary.total, 0);
    assert.equal(data.summary.pending, 0);
    assert.equal(c.filterAssets(data, filters()).length, 0);
    assert.equal(c.paginate([], 1).items.length, 0);
  }
});
