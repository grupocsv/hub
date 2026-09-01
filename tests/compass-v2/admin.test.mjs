import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const [admin, publishedAdmin] = await Promise.all([
  readFile(new URL("admin/index.html", root), "utf8"),
  readFile(new URL("docs/public/admin/index.html", root), "utf8"),
]);

test("mantém o Admin fonte e a cópia pública byte a byte", () => {
  assert.equal(publishedAdmin, admin);
});

test("expõe a aba Compass™ com catálogo, checksums, versões e downloads", () => {
  assert.match(admin, /data-tab="compass"/u);
  assert.match(admin, /id="compass-summary-released"/u);
  assert.match(admin, /id="compass-summary-draft"/u);
  assert.match(admin, /id="compass-summary-downloads"/u);
  assert.match(admin, /id="compass-tbody"/u);
  assert.match(admin, /id="compass-error"/u);
  assert.match(admin, /Checksums/u);
  assert.match(admin, /Versões/u);
  assert.match(admin, /Downloads/u);
  assert.match(
    admin,
    /Compass™ — um produto do Grupo CSV \| Responsabilidade editorial: MedValor®/u,
  );
  assert.match(admin, /AxiaCare®/u);
});

test("consome o domínio confirmado do csv-documents com a sessão humana existente", () => {
  assert.match(
    admin,
    /const DOCUMENTS_API = 'https:\/\/documentos-api\.grupocsv\.com';/u,
  );
  assert.match(admin, /async function documentsApiCall\(/u);
  assert.match(admin, /'X-Auth-Token': token/u);
  assert.match(admin, /if \(resp\.status === 401\)/u);
  assert.match(admin, /if \(resp\.status === 403\)/u);
  assert.match(admin, /if \(resp\.status === 503\)/u);
  assert.doesNotMatch(admin, /DOCUMENTS_API_(?:TOKEN|KEY|SECRET)/u);
  assert.doesNotMatch(admin, /documents:publish[^<\n]*Bearer/u);
});

test("carrega o catálogo sob demanda e mantém mutações indisponíveis sem autorização explícita", () => {
  assert.match(admin, /if \(tabName === 'compass'\) loadCompass\(\);/u);
  assert.match(admin, /async function loadCompass\(\)/u);
  assert.match(admin, /documentsApiCall\('\/v1\/compass\/editions'\)/u);
  assert.match(admin, /id="compass-refresh"/u);
  assert.match(admin, /Operações de publicação permanecem indisponíveis/u);
  assert.doesNotMatch(admin, /documentsApiCall\([^)]*method:\s*'POST'/u);
});

const centralCompass = await readFile(new URL("docs/compass/index.md", root), "utf8");

test("deriva a Central Compass™ do catálogo gerado sem duplicar a lista de edições", () => {
  assert.match(centralCompass, /import catalog from '\.\/catalog\.json'/u);
  assert.match(centralCompass, /v-for="edition in editions"/u);
  assert.match(centralCompass, /edition\.routes\.web/u);
  assert.doesNotMatch(
    centralCompass,
    /<td><a href="\/compass\/edicoes\/2026\/00[1-8]\/compass">/u,
  );
  assert.match(
    centralCompass,
    /Compass&trade; — um produto do Grupo CSV \| Responsabilidade editorial: MedValor&reg;/u,
  );
  assert.match(centralCompass, /AxiaCare&reg;/u);
});

const [deployWorkflow, syncWorkflow, infraCompass] = await Promise.all([
  readFile(new URL(".github/workflows/deploy.yml", root), "utf8"),
  readFile(new URL(".github/workflows/sync-r2-ai-search.yml", root), "utf8"),
  readFile(new URL("docs/_infra/ferramentas/compass.md", root), "utf8"),
]);

test("bloqueia deploy com contratos ou artefatos Compass™ divergentes", () => {
  assert.match(deployWorkflow, /run: npm run compass:test/u);
  assert.match(deployWorkflow, /git diff --exit-code -- docs\/compass/u);
  assert.match(deployWorkflow, /admin\/index\.html/u);
  assert.match(deployWorkflow, /compass\/catalog\.json/u);
  assert.match(deployWorkflow, /for edition in 001 002 003 004 005 006 007 008/u);
  assert.match(deployWorkflow, /compass\/edicoes\/2026\/\$edition\/compass\.html/u);
  assert.match(deployWorkflow, /compass\/edicoes\/2026\/\$edition\/compass_\$\{edition\}_2026\.pdf/u);
  assert.match(deployWorkflow, /cp "docs\/compass\/edicoes\/2026\/\$edition\/compass_\$\{edition\}_2026\.pdf"/u);
  assert.match(deployWorkflow, /catálogo Compass não contém exatamente as edições 001–008/u);
  assert.match(deployWorkflow, /pdf_bytes[\s\S]*4194304/u);
  assert.match(deployWorkflow, /data-tab="compass"/u);
});

test("mantém PDF no AI Search sob limite de 4 MB e documenta n8n fora do caminho crítico", () => {
  assert.match(syncWorkflow, /--include "\*\.pdf"/u);
  assert.match(syncWorkflow, /--max-size 4M/u);
  assert.match(infraCompass, /O n8n não integra o caminho crítico e não foi alterado\./u);
  assert.match(infraCompass, /migration 0021 não foi aplicada/u);
});
