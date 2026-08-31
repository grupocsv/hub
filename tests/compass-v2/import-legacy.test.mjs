import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const importerPath = path.join(repoRoot, 'scripts/compass-v2/import-legacy.mjs');
const edition007 = path.join(repoRoot, 'compass/edicoes/2026/007');

const LEGACY_MARKDOWN = `---
title: Edição de teste
---
<style>.compass-hero { color: red; }</style>
<div class="compass-page">
<div class="compass-hero"><h1>Legado</h1></div>
<div class="compass-section">
<h2>Primeira seção</h2>
<p>Conteúdo [1].</p>
</div>
<div class="compass-section">
<h2>Referências</h2>
<table><tbody><tr><td>[1]</td><td>Fonte</td><td><a href="https://example.com/fonte">Link</a></td></tr></tbody></table>
</div>
<div class="compass-scope"><strong>Nota de Escopo:</strong> Uso interno.</div>
<div class="compass-download"><a href="/compass/edicoes/2026/007/compass_007_2026.pdf" download>Download PDF</a></div>
<div class="compass-nav"><a href="/compass/edicoes/2026/006/compass">Anterior</a><a href="/compass/">Central</a></div>
<div class="compass-edition-footer">Rodapé legado</div>
</div>
`;

const LEGACY_METADATA = {
  edition: '007/2026',
  title: 'Crise de sustentabilidade e eficiência na saúde suplementar brasileira',
  date: '07 de junho de 2026',
  status: 'Publicado',
  tags: ['saúde suplementar'],
  abstract: 'Resumo de teste.',
};
const LEGACY_PDF = Buffer.from('%PDF-1.4\nfixture-legada\n%%EOF\n', 'utf8');

async function loadImporter() {
  try {
    return await import(pathToFileURL(importerPath).href);
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function createLegacyInput() {
  const input = await mkdtemp(path.join(os.tmpdir(), 'compass-legacy-input-'));
  await Promise.all([
    writeFile(path.join(input, 'metadata.yml'), `edition: 007/2026\ntitle: Crise de sustentabilidade e eficiência na saúde suplementar brasileira\ndate: 07 de junho de 2026\nstatus: Publicado\nabstract: Resumo de teste.\n`, 'utf8'),
    writeFile(path.join(input, 'compass.md'), LEGACY_MARKDOWN, 'utf8'),
    writeFile(path.join(input, 'compass_007_2026.pdf'), LEGACY_PDF),
  ]);
  return input;
}

test('extrai somente conteúdo editorial, nota e ações históricas do formato legado', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');

  const content = importer.buildLegacyEditionContent({
    legacyMarkdown: LEGACY_MARKDOWN,
    editionSlug: '007',
    year: 2026,
  });

  assert.equal((content.match(/<section class="compass-section">/g) ?? []).length, 2);
  assert.equal((content.match(/<h2>/g) ?? []).length, 2);
  assert.equal((content.match(/<p>/g) ?? []).length, 1);
  assert.equal((content.match(/<tr><td>\[/g) ?? []).length, 1);
  assert.equal((content.match(/href="https?:\/\//g) ?? []).length, 1);
  assert.match(content, /Nota de Escopo:/u);
  assert.match(content, /href="\/compass\/edicoes\/2026\/007\/compass_007_2026\.pdf"/u);
  assert.match(content, /href="\/compass\/edicoes\/2026\/006\/compass"/u);
  assert.match(content, /href="\/compass\/"/u);
  assert.doesNotMatch(content, /compass-hero/u);
  assert.doesNotMatch(content, /compass-edition-footer/u);
  assert.doesNotMatch(content, /<style>/u);
});

test('normaliza o legado no schema v2 com marcas, rotas e proveniência imutáveis', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');

  const metadata = importer.buildLegacyEditionMetadata({
    legacyMetadata: LEGACY_METADATA,
    legacyMarkdown: LEGACY_MARKDOWN,
    legacyPdf: LEGACY_PDF,
  });

  assert.equal(metadata.schemaVersion, 2);
  assert.equal(metadata.id, '007-2026');
  assert.equal(metadata.number, 7);
  assert.equal(metadata.year, 2026);
  assert.equal(metadata.slug, '007');
  assert.equal(metadata.publishedAt, '2026-06-07');
  assert.equal(metadata.product.owner, 'Grupo CSV');
  assert.equal(metadata.editorial.responsible, 'MedValor®');
  assert.deepEqual(metadata.elaboration, ['AxiaCare®']);
  assert.equal(metadata.routes.web, '/compass/edicoes/2026/007/compass');
  assert.equal(metadata.routes.pdf, '/compass/edicoes/2026/007/compass_007_2026.pdf');
  assert.equal(metadata.migration.state, 'adapted-legacy');
  assert.equal(metadata.migration.sourceSchema, 1);
  assert.equal(metadata.migration.sourceSha256, sha256(LEGACY_MARKDOWN));
  assert.equal(metadata.migration.originalPdfSha256, sha256(LEGACY_PDF));
});

test('mantém links primários legíveis no tema escuro', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const css = importer.buildLegacyEditionCss();

  assert.match(css, /\.dark\s+\.compass-v2\s+\.compass-download\s+a[^}]*\{[^}]*color:\s*#(?:fff|ffffff)/si);
  assert.match(css, /\.dark\s+\.compass-v2\s+\.compass-nav\s+\.nav-primary[^}]*\{[^}]*color:\s*#(?:fff|ffffff)/si);
  assert.match(css, /@media\s*\(max-width:\s*768px\)[\s\S]*\.compass-v2\s+\.ref-table\s*\{[^}]*table-layout:\s*fixed/si);
  assert.match(css, /\.compass-v2\s+\.ref-table\s+(?:th|td)[^}]*\{[^}]*min-width:\s*0[^}]*padding:\s*0\.55rem\s+0\.35rem[^}]*overflow-wrap:\s*anywhere/si);
  assert.match(css, /\.compass-v2\s+\.ref-table\s+(?:th|td):first-child[^}]*\{[^}]*width:\s*2\.3rem/si);
  assert.match(css, /\.compass-v2\s+\.ref-table\s+(?:th|td):last-child[^}]*\{[^}]*width:\s*2\.75rem/si);
  assert.match(css, /\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-section\s*\{[^}]*padding:\s*0[^}]*border:\s*0[^}]*border-radius:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/si);
  assert.match(css, /@media\s+print[\s\S]*\.dark\s+\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-section[^}]*\{[^}]*background:\s*#(?:fff|ffffff)\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-v2__content\s+table\s+tr[^}]*\{[^}]*background:\s*#(?:fff|ffffff)\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-v2__content\s+table\s+th[^}]*\{[^}]*color:\s*#(?:fff|ffffff)\s*!important[^}]*background:\s*#0d264c\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-scope\s*\{[^}]*color:\s*#334155\s*!important[^}]*background:\s*#fff8ed\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.comparison-table\s*\{[^}]*break-inside:\s*auto\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.comparison-table\s+tr\s*\{[^}]*break-inside:\s*avoid/si);
});

test('gera fonte v2 determinística sem duplicar o legado', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const input = await createLegacyInput();
  const outputA = await mkdtemp(path.join(os.tmpdir(), 'compass-legacy-a-'));
  const outputB = await mkdtemp(path.join(os.tmpdir(), 'compass-legacy-b-'));

  await importer.importLegacyEdition({ inputDir: input, outputDir: outputA });
  await importer.importLegacyEdition({ inputDir: input, outputDir: outputB });

  const names = ['metadata.yml', 'compass.md', 'Compass007Content.vue', 'edition.css', 'compass_007_2026.pdf'];
  for (const name of names) {
    const [left, right] = await Promise.all([
      readFile(path.join(outputA, name)),
      readFile(path.join(outputB, name)),
    ]);
    assert.equal(sha256(left), sha256(right), `${name} deve ser determinístico`);
  }

  const markdown = await readFile(path.join(outputA, 'compass.md'), 'utf8');
  const component = await readFile(path.join(outputA, 'Compass007Content.vue'), 'utf8');
  assert.match(markdown, /<CompassEdition>/u);
  assert.match(markdown, /Compass007Content/u);
  assert.match(markdown, /mode: flow/u);
  assert.doesNotMatch(markdown, /<style>/u);
  assert.equal((component.match(/<section class="compass-section">/g) ?? []).length, 2);
  assert.doesNotMatch(component, /compass-hero/u);
});

test('a fonte migrada da 007 preserva o conteúdo e os artefatos congelados', async () => {
  const [metadataText, markdown, component, pdf, releaseText] = await Promise.all([
    readFile(path.join(edition007, 'metadata.yml'), 'utf8'),
    readFile(path.join(edition007, 'compass.md'), 'utf8'),
    readFile(path.join(edition007, 'Compass007Content.vue'), 'utf8'),
    readFile(path.join(edition007, 'compass_007_2026.pdf')),
    readFile(path.join(edition007, 'release.json'), 'utf8'),
  ]);
  const metadata = parseYaml(metadataText);
  const release = JSON.parse(releaseText);

  assert.equal(metadata.schemaVersion, 2);
  assert.equal(metadata.migration.sourceSha256, 'a2764829806b0c673b2e9bae3674153c50fd9b8f74230ae0ca21746216c6602f');
  assert.equal(metadata.migration.originalPdfSha256, 'ed5b7b5e90d39e60c744c72188617c94234460f376af991f360718221b5ec90d');
  assert.notEqual(sha256(pdf), metadata.migration.originalPdfSha256);
  assert.equal(sha256(pdf), release.pdf.sha256);
  assert.equal(release.pdf.filename, 'compass_007_2026.pdf');
  assert.ok(release.pdf.bytes > 0 && release.pdf.bytes <= 4_000_000);
  assert.equal((component.match(/<section class="compass-section">/g) ?? []).length, 8);
  assert.equal((component.match(/<h2>/g) ?? []).length, 8);
  assert.equal((component.match(/<p>/g) ?? []).length, 30);
  assert.equal((component.match(/<li>/g) ?? []).length, 5);
  assert.equal((component.match(/<tr><td>\[/g) ?? []).length, 44);
  assert.equal((component.match(/href="https?:\/\//g) ?? []).length, 44);
  assert.match(markdown, /Compass007Content/u);
  assert.match(markdown, /mode: flow/u);
  assert.doesNotMatch(markdown, /compass-hero/u);
});
