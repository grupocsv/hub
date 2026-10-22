import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import YAML from "yaml";
const read = (p) =>
  fs.readFileSync(new URL("../../" + p, import.meta.url), "utf8");
test("Central de Links integra Comunicação, carrega sob demanda e mantém autenticação do Admin", () => {
  const html = read("admin/index.html");
  assert.match(
    html,
    /Comunicação<\/div>\s*<button[^>]+data-tab="central-links"/,
  );
  assert.match(
    html,
    /const LINKS_API = 'https:\/\/links-api.grupocsv.com\/v1'/,
  );
  assert.match(
    html,
    /if \(tabName === 'central-links'\) centralLinks.open\(\)/,
  );
  assert.doesNotMatch(
    html.match(/async function loadAll\(\) \{([\s\S]*?)\n    \}/)[1],
    /centralLinks/,
  );
  assert.match(
    html,
    /createCentralLinks\(\{ apiBase: LINKS_API, getToken, clearAuth, showAuth \}\)/,
  );
  assert.doesNotMatch(
    read("admin/central-links.js"),
    /innerHTML|op_admin_token|Authorization/,
  );
});
test("workflow valida a Central em PR, depois da instalação do navegador e no smoke test", () => {
  const source = read(".github/workflows/deploy.yml"),
    y = YAML.parse(source),
    steps = y.jobs.build.steps;
  assert.ok(y.on.pull_request);
  assert.ok(steps.some((s) => s.run === "npm run central-links:test"));
  const browser = steps.findIndex(
    (s) => s.name === "Install pinned Chromium for Hub Documentos E2E",
  );
  assert.ok(
    steps.findIndex((s) => s.run === "npm run central-links:e2e") > browser,
  );
  assert.match(source, /grep -q 'data-tab="central-links"'/);
  for (const p of fs.readdirSync(
    new URL("../../admin/vendor/", import.meta.url),
  ))
    assert.ok(source.includes("admin/vendor/" + p), p);
  for (const p of [
    "central-links.js",
    "central-links-sections.js",
    "central-links.css",
  ])
    assert.ok(source.includes("admin/" + p));
});
