import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const importerPath = path.join(repoRoot, 'scripts/compass-v2/import-008.mjs');
const editionPath = path.join(repoRoot, 'compass/edicoes/2026/008/compass.md');
const contentComponentPath = path.join(repoRoot, 'compass/edicoes/2026/008/Compass008Content.vue');

async function loadImporter() {
  try {
    return await import(pathToFileURL(importerPath).href);
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

test('recupera páginas que aparecem depois de um fechamento HTML prematuro', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-008.mjs ainda não existe');
  const sample = '<body><section class="page">A</section></body></html><section class="page back">B</section>';
  const pages = importer.extractPageSections(sample);
  assert.equal(pages.length, 2);
  assert.match(pages[1], /class="page back"/);
});

test('fixa a hierarquia canônica de marcas sem remover a AxiaCare®', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-008.mjs ainda não existe');
  const source = '<section class="page cover"><div>Compass<span>TM</span></div><div class="base"><div>Elaboração</div><img alt="AxiaCare"></div></section><section class="page back"><div class="base"><img class="csv"><img class="axia"></div></section>';
  const result = importer.canonicalizeBrandCredits(source);
  assert.match(result, /Compass™/);
  assert.match(result, /Compass™ — um produto do Grupo CSV/);
  assert.match(result, /Responsabilidade editorial: MedValor®/);
  assert.match(result, /Elaboração: AxiaCare®/);
  assert.match(result, /alt="AxiaCare®"/);
});

test('gera metadados nativos v2 para a edição 008 em estado de revisão', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-008.mjs ainda não existe');
  const metadata = importer.buildEdition008Metadata();
  assert.equal(metadata.schemaVersion, 2);
  assert.equal(metadata.id, '008-2026');
  assert.equal(metadata.status, 'Minuta para revisão');
  assert.equal(metadata.product.owner, 'Grupo CSV');
  assert.equal(metadata.editorial.responsible, 'MedValor®');
  assert.deepEqual(metadata.elaboration, ['AxiaCare®']);
  assert.equal(metadata.migration.state, 'native-v2');
  assert.equal(metadata.release.active, false);
});

test('a fonte canônica real preserva as 23 páginas em um componente Vue nativo, sem escape pelo Markdown', async () => {
  const [source, component] = await Promise.all([
    readFile(editionPath, 'utf8').catch(() => ''),
    readFile(contentComponentPath, 'utf8').catch(() => ''),
  ]);
  assert.ok(source, 'a fonte canônica 008 ainda não existe');
  assert.ok(component, 'o componente nativo da edição 008 ainda não existe');
  assert.match(source, /import Compass008Content from ['"]\.\/Compass008Content\.vue['"]/);
  assert.match(source, /<Compass008Content\s*\/>/);
  assert.match(source, /<style\s+src=["']\.\/edition\.css["']><\/style>/);
  assert.doesNotMatch(source, /<style\s+scoped\s+src=["']\.\/edition\.css["']/);
  assert.equal((component.match(/<section\b[^>]*\bcompass-page\b/g) ?? []).length, 23);
  assert.match(component, /Marcos Temporais do[\s\S]*Processo de Alta/);
  assert.match(component, /Referências/);
  assert.match(component, /Guilherme Thomé/);
  assert.match(component, /Compass™ — um produto do Grupo CSV/);
  assert.match(component, /Responsabilidade editorial: MedValor®/);
  assert.match(component, /Elaboração: AxiaCare®/);
  assert.match(component, /href=["']\.\/compass_008_2026\.pdf["'][^>]*\bdownload\b/);
  assert.match(component, /Baixar PDF da edição 008/);
  assert.doesNotMatch(component, /<\/body>|<\/html>/i);
});
