import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (p) => fs.readFileSync(new URL("../../" + p, import.meta.url), "utf8");

test("Cartão csv.online/blog: módulo espelhado no Admin publicado", () => {
  assert.equal(read("admin/blog-link.js"), read("docs/public/admin/blog-link.js"));
});

test("Cartão csv.online/blog: carregado na aba Blog e incluído no artefato do deploy", () => {
  const html = read("admin/index.html");
  assert.match(html, /<script src="\/admin\/blog-link\.js"><\/script>/);
  const tab = html.slice(
    html.indexOf('<div class="admin-tab-content" data-tab="blog-admin">'),
    html.indexOf('id="blog-admin-iframe"'),
  );
  assert.match(tab, /<div id="blogLinkCard"><\/div>/);
  assert.match(html, /if \(tabName === 'blog-admin'\) \{ loadBlogAdmin\(\); blogLink\.open\(\); \}/);
  assert.match(html, /window\.createBlogLink\(\{ root: document\.getElementById\('blogLinkCard'\), apiBase: LINKS_API, getToken, clearAuth, showAuth \}\)/);
  assert.ok(read(".github/workflows/deploy.yml").includes("admin/blog-link.js"));
});

test("Cartão csv.online/blog: só troca sob demanda, pela API da Central, com confirmação", () => {
  const js = read("admin/blog-link.js");
  assert.match(js, /"\/links\/" \+ encodeURIComponent\(link\.id\) \+ "\/destination"/);
  assert.match(js, /source: "blog"/);
  assert.match(js, /expected_version: link\.version/);
  assert.match(js, /window\.confirm\(/);
  assert.doesNotMatch(js, /setInterval\(/);
  assert.doesNotMatch(js, /pre\.csv\.online/);
  assert.doesNotMatch(js, /publish_despite_failure/);
  assert.doesNotMatch(js, /localStorage/);
});
