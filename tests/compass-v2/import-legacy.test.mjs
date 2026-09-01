import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const importerPath = path.join(repoRoot, 'scripts/compass-v2/import-legacy.mjs');
const edition001 = path.join(repoRoot, 'compass/edicoes/2026/001');
const edition002 = path.join(repoRoot, 'compass/edicoes/2026/002');
const edition003 = path.join(repoRoot, 'compass/edicoes/2026/003');
const edition004 = path.join(repoRoot, 'compass/edicoes/2026/004');
const edition005 = path.join(repoRoot, 'compass/edicoes/2026/005');
const edition006 = path.join(repoRoot, 'compass/edicoes/2026/006');
const edition007 = path.join(repoRoot, 'compass/edicoes/2026/007');
const edition007Pdf = path.join(edition007, 'compass_007_2026.pdf');

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

const LEGACY_PURE_MARKDOWN = `# Compass™ | Base de Conhecimento Corporativa do Grupo CSV

![Compass Header](assets/compass_header.png)

**Edição:** 001/2026
**Título:** Edição Markdown de teste
**Data:** 19 de fevereiro de 2026
**Status:** Publicado

**Assets:**
- [compass_header.png](assets/compass_header.png)
- [compass_letterhead.pdf](assets/compass_letterhead.pdf)

---

## Primeira Seção

Conteúdo editorial com **ênfase** e [fonte](https://example.com/fonte).

~~~text
Fluxo de teste
~~~

## Referências

[1] Fonte de teste — https://example.com/referencia

---

[Voltar para a Central Compass™](../../README.md)
`;

const LEGACY_METADATA = {
  edition: '007/2026',
  title: 'Crise de sustentabilidade e eficiência na saúde suplementar brasileira',
  date: '07 de junho de 2026',
  status: 'Publicado',
  tags: ['saúde suplementar'],
  abstract: 'Resumo de teste.',
};
const LEGACY_PDF = await readFile(path.join(repoRoot, 'compass/edicoes/2026/001/assets/compass_letterhead.pdf'));

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

  const content = await importer.buildLegacyEditionContent({
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

test('preserva blocos `div` aninhados dentro das seções legadas', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const nested = LEGACY_MARKDOWN.replace(
    '<p>Conteúdo [1].</p>',
    '<div class="compass-figure"><img src="/compass/edicoes/2026/003/figura.png" alt="Figura" /><figcaption>Legenda</figcaption></div><p>Conteúdo [1].</p>',
  );

  const content = await importer.buildLegacyEditionContent({
    legacyMarkdown: nested,
    editionSlug: '003',
    year: 2026,
  });

  assert.equal((content.match(/<section class="compass-section">/g) ?? []).length, 2);
  assert.match(content, /<div class="compass-figure">[\s\S]*<\/div>[\s\S]*<p>Conteúdo \[1\]\.<\/p>/u);
  assert.match(content, /src="\.\/assets\/figura\.png"/u);
  assert.match(content, /<a class="compass-figure__source" href="\.\/assets\/figura\.png" target="_blank" rel="noreferrer" aria-label="Abrir Figura em tamanho original">[\s\S]*<img[^>]*>[\s\S]*<\/a>/u);
  assert.match(importer.buildLegacyEditionCss(), /\.compass-figure__source::after[^}]*\{[^}]*content:\s*"Abrir imagem em tamanho original"/si);
});

test('converte legado Markdown puro em seções semânticas e ações padronizadas', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');

  const content = await importer.buildLegacyEditionContent({
    legacyMarkdown: LEGACY_PURE_MARKDOWN,
    editionSlug: '001',
    year: 2026,
    sourceDir: repoRoot,
  });

  assert.equal((content.match(/<section class="compass-section">/g) ?? []).length, 2);
  assert.equal((content.match(/<h2>/g) ?? []).length, 2);
  assert.match(content, /<strong>ênfase<\/strong>/u);
  assert.match(content, /href="https:\/\/example\.com\/fonte"/u);
  assert.match(content, /<pre tabindex="0">/u);
  assert.match(content, /href="\/compass\/edicoes\/2026\/001\/compass_001_2026\.pdf"[^>]*download/u);
  assert.match(content, /<nav class="compass-nav"[^>]*>[\s\S]*href="\/compass\/"/u);
  assert.doesNotMatch(content, /compass_header\.png/u);
  assert.doesNotMatch(content, /compass_letterhead\.pdf/u);
  assert.doesNotMatch(content, /Voltar para a Central/u);
});

test('preserva o href e abrevia URLs visíveis em tabelas de referência', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const rawUrl = 'https://example.com/caminho-muito-longo-para-a-referencia';
  const content = await importer.buildLegacyEditionContent({
    legacyMarkdown: LEGACY_MARKDOWN.replace(
      'href="https://example.com/fonte">Link</a>',
      `href="${rawUrl}">${rawUrl}</a>`,
    ),
    editionSlug: '007',
    year: 2026,
  });

  assert.match(content, new RegExp(`href="${rawUrl.replaceAll('/', '\\/')}"[^>]*>Link<\\/a>`, 'u'));
  assert.doesNotMatch(content, new RegExp(`>${rawUrl.replaceAll('/', '\\/')}<\\/a>`, 'u'));
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

test('detecta e documenta numeração cruzada no PDF sem alterar a identidade canônica', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');

  const legacyMetadata = { ...LEGACY_METADATA, edition: '005/2026' };
  const metadata = importer.buildLegacyEditionMetadata({
    legacyMetadata,
    legacyMarkdown: LEGACY_MARKDOWN.replaceAll('/007/', '/005/').replaceAll('007/2026', '005/2026'),
    legacyPdf: LEGACY_PDF,
    legacyPdfText: 'Capa\nEdição 006/2026 | 19 de fevereiro de 2026 | Publicado\nMiolo\nEdição 006/2026',
  });

  assert.equal(metadata.id, '005-2026');
  assert.equal(metadata.slug, '005');
  assert.equal(metadata.routes.web, '/compass/edicoes/2026/005/compass');
  assert.equal(metadata.routes.pdf, '/compass/edicoes/2026/005/compass_005_2026.pdf');
  assert.deepEqual(metadata.migration.numberingCorrection, {
    state: 'corrected-crossed-label',
    canonicalLabel: '005/2026',
    legacyPdfDisplayedLabel: '006/2026',
  });
});

test('rejeita PDF legado com mais de um rótulo de edição distinto', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  assert.throws(
    () => importer.detectLegacyPdfEditionLabel('Edição 005/2026\nEdição 006/2026'),
    /numeração ambígua/u,
  );
});

test('o importador lê o PDF e registra automaticamente a divergência de numeração', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const input = await mkdtemp(path.join(os.tmpdir(), 'compass-crossed-input-'));
  const output = await mkdtemp(path.join(os.tmpdir(), 'compass-crossed-output-'));
  const markdown = LEGACY_MARKDOWN.replaceAll('/007/', '/005/').replaceAll('007/2026', '005/2026');
  await Promise.all([
    writeFile(path.join(input, 'metadata.yml'), 'edition: 005/2026\ntitle: Edição cruzada de teste\ndate: 19 de fevereiro de 2026\nstatus: Publicado\nabstract: Resumo.\n', 'utf8'),
    writeFile(path.join(input, 'compass.md'), markdown, 'utf8'),
    copyFile(edition007Pdf, path.join(input, 'compass_005_2026.pdf')),
  ]);

  const metadata = await importer.importLegacyEdition({ inputDir: input, outputDir: output });
  assert.equal(metadata.migration.numberingCorrection.canonicalLabel, '005/2026');
  assert.equal(metadata.migration.numberingCorrection.legacyPdfDisplayedLabel, '007/2026');
});

test('marca referências indexadas de duas colunas para distribuição mobile legível', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const indexed = LEGACY_MARKDOWN.replace(
    '<table><tbody><tr><td>[1]</td><td>Fonte</td><td><a href="https://example.com/fonte">Link</a></td></tr></tbody></table>',
    '<table class="ref-table"><thead><tr><th>#</th><th>Referência</th></tr></thead><tbody><tr><td>1</td><td>Fonte</td></tr></tbody></table>',
  );

  const content = await importer.buildLegacyEditionContent({
    legacyMarkdown: indexed,
    editionSlug: '002',
    year: 2026,
  });
  const css = importer.buildLegacyEditionCss();

  assert.match(content, /class="ref-table ref-table--indexed"/u);
  assert.match(css, /\.ref-table--indexed\s+(?:th|td):first-child[^}]*\{[^}]*min-width:\s*3\.5rem[^}]*max-width:\s*3\.5rem/si);
  assert.match(css, /\.ref-table--indexed\s+(?:th|td):nth-child\(2\)[^}]*\{[^}]*min-width:\s*28rem/si);
});

test('mantém links primários legíveis no tema escuro', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const css = importer.buildLegacyEditionCss();

  assert.match(css, /\.dark\s+\.compass-v2\s+\.compass-download\s+a[^}]*\{[^}]*color:\s*#(?:fff|ffffff)/si);
  assert.match(css, /\.dark\s+\.compass-v2\s+\.compass-nav\s+\.nav-primary[^}]*\{[^}]*color:\s*#(?:fff|ffffff)/si);
  assert.match(css, /@media\s*\(max-width:\s*768px\)[\s\S]*\.compass-v2\s+\.ref-table\s*\{[^}]*display:\s*block[^}]*overflow-x:\s*auto[^}]*table-layout:\s*auto/si);
  assert.match(css, /\.compass-v2\s+\.ref-table\s+(?:th|td)[^}]*\{[^}]*padding:\s*0\.55rem\s+0\.5rem[^}]*overflow-wrap:\s*normal/si);
  assert.match(css, /\.compass-v2\s+\.ref-table:not\(\.ref-table--indexed\)\s+(?:th|td):first-child[^}]*\{[^}]*min-width:\s*18rem/si);
  assert.match(css, /\.compass-v2\s+\.ref-table:not\(\.ref-table--indexed\)\s+(?:th|td):nth-child\(2\)[^}]*\{[^}]*min-width:\s*16rem/si);
  assert.match(css, /\.compass-v2\s+\.ref-table:not\(\.ref-table--indexed\)\s+(?:th|td):last-child[^}]*\{[^}]*min-width:\s*5rem/si);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*768px\)[\s\S]*\.compass-v2\s+\.ref-table\s*\{[^}]*table-layout:\s*fixed/si);
  assert.match(css, /\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-section\s*\{[^}]*padding:\s*0[^}]*border:\s*0[^}]*border-radius:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/si);
  assert.match(css, /@media\s+print[\s\S]*\.dark\s+\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-section[^}]*\{[^}]*background:\s*#(?:fff|ffffff)\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-v2__content\s+table\s+tr[^}]*\{[^}]*background:\s*#(?:fff|ffffff)\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-v2__content\s+table\s+th[^}]*\{[^}]*color:\s*#(?:fff|ffffff)\s*!important[^}]*background:\s*#0d264c\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.compass-scope\s*\{[^}]*color:\s*#334155\s*!important[^}]*background:\s*#fff8ed\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.comparison-table\s*\{[^}]*break-inside:\s*auto\s*!important/si);
  assert.match(css, /@media\s+print[\s\S]*\.compass-v2:not\(\.compass-v2--paged\)\s+\.comparison-table\s+tr\s*\{[^}]*break-inside:\s*avoid/si);
});

test('copia assets locais referenciados pela fonte Markdown para a saída v2', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const input = await mkdtemp(path.join(os.tmpdir(), 'compass-markdown-assets-input-'));
  const output = await mkdtemp(path.join(os.tmpdir(), 'compass-markdown-assets-output-'));
  await mkdir(path.join(input, 'assets'));
  await Promise.all([
    writeFile(path.join(input, 'metadata.yml'), 'id: "001/2026"\ntitulo: "Edição Markdown com figura"\nano: 2026\nedicao: 1\nstatus: Publicado\n', 'utf8'),
    writeFile(path.join(input, 'compass.md'), LEGACY_PURE_MARKDOWN.replace('Conteúdo editorial', '![Figura](assets/figure.png)\n\nConteúdo editorial'), 'utf8'),
    writeFile(path.join(input, 'compass_001_2026.pdf'), LEGACY_PDF),
    writeFile(path.join(input, 'assets/figure.png'), Buffer.from('figura-de-teste')),
  ]);

  await importer.importLegacyEdition({ inputDir: input, outputDir: output });
  const [asset, component] = await Promise.all([
    readFile(path.join(output, 'assets/figure.png')),
    readFile(path.join(output, 'Compass001Content.vue'), 'utf8'),
  ]);
  assert.equal(asset.toString('utf8'), 'figura-de-teste');
  assert.match(component, /src="\.\/assets\/figure\.png"/u);
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
  assert.match(markdown, /prev: false/u);
  assert.match(markdown, /next: false/u);
  assert.doesNotMatch(markdown, /docFooter:/u);
  assert.doesNotMatch(markdown, /<style>/u);
  assert.equal((component.match(/<section class="compass-section">/g) ?? []).length, 2);
  assert.doesNotMatch(component, /compass-hero/u);
});

test('as fontes migradas 001–004 preservam conteúdo, rotas, assets e proveniência', async () => {
  const expected = {
    '001': {
      directory: edition001,
      sourceSha256: '6b9280b5a2f9f12feb7ef9008c40e5d08c4ee0123fd64d74192f5bbe3e6f6c2c',
      originalPdfSha256: '499602c385e8b1ecb6c578fb14c35bdc13eb782a2bdf2c144da97a3dd2ad49c9',
      originalPdfBytes: 465461,
      sections: 9,
      headings: 9,
    },
    '002': {
      directory: edition002,
      sourceSha256: '1890f2b2066fc5738dace0d5fb8369b4d395d6f6e267394d3fa45392c5c70baf',
      originalPdfSha256: '69fcd62e2decfdea10123a9cc0a9c3b77b1de5b6306f46eaa88e4de37c84c52c',
      originalPdfBytes: 476815,
      sections: 10,
      headings: 10,
      paragraphs: 46,
      listItems: 11,
      rows: 56,
    },
    '003': {
      directory: edition003,
      sourceSha256: 'f569243a1033b466db5833e82fc985221b41eb2d7041df8b6e451fae4fb364cc',
      originalPdfSha256: '7a9ea11beb371dcbcfc4201bc8594c25ca99750fd08d30b1a6d744c3b0e78b42',
      originalPdfBytes: 1412287,
      sections: 10,
      headings: 10,
      paragraphs: 56,
      listItems: 3,
      rows: 42,
      figures: 3,
    },
    '004': {
      directory: edition004,
      sourceSha256: 'ce0230b6e327ec3f18aac322df04d6b1421d49a13755e3aee611b5f8a615a90c',
      originalPdfSha256: 'd2c53ce09aa8b265a93f2310af5addaa20066afe45bebfdcd2901f798828d7ed',
      originalPdfBytes: 504599,
      sections: 11,
      headings: 11,
      paragraphs: 50,
      listItems: 19,
      rows: 58,
    },
  };

  for (const [slug, item] of Object.entries(expected)) {
    const [metadataText, markdown, component, pdf, releaseText] = await Promise.all([
      readFile(path.join(item.directory, 'metadata.yml'), 'utf8'),
      readFile(path.join(item.directory, 'compass.md'), 'utf8'),
      readFile(path.join(item.directory, `Compass${slug}Content.vue`), 'utf8'),
      readFile(path.join(item.directory, `compass_${slug}_2026.pdf`)),
      readFile(path.join(item.directory, 'release.json'), 'utf8'),
    ]);
    const metadata = parseYaml(metadataText);
    const release = JSON.parse(releaseText);

    assert.equal(metadata.schemaVersion, 2);
    assert.equal(metadata.id, `${slug}-2026`);
    assert.equal(metadata.slug, slug);
    assert.equal(metadata.routes.web, `/compass/edicoes/2026/${slug}/compass`);
    assert.equal(metadata.routes.pdf, `/compass/edicoes/2026/${slug}/compass_${slug}_2026.pdf`);
    assert.equal(metadata.migration.sourceSha256, item.sourceSha256);
    assert.equal(metadata.migration.originalPdfSha256, item.originalPdfSha256);
    assert.equal(metadata.migration.originalPdfBytes, item.originalPdfBytes);
    assert.equal(metadata.migration.numberingCorrection, undefined);
    assert.notEqual(sha256(pdf), item.originalPdfSha256);
    assert.equal(sha256(pdf), release.pdf.sha256);
    assert.equal(release.pdf.filename, `compass_${slug}_2026.pdf`);
    assert.ok(release.pdf.bytes > 0 && release.pdf.bytes <= 4_000_000);
    assert.equal((component.match(/<section class="compass-section">/g) ?? []).length, item.sections);
    assert.equal((component.match(/<h2>/g) ?? []).length, item.headings);
    if (item.paragraphs) assert.equal((component.match(/<p\b[^>]*>/g) ?? []).length, item.paragraphs);
    if (item.listItems) assert.equal((component.match(/<li>/g) ?? []).length, item.listItems);
    if (item.rows) assert.equal((component.match(/<tr/g) ?? []).length, item.rows);
    if (item.figures) {
      assert.equal((component.match(/class="compass-figure"/g) ?? []).length, item.figures);
      for (const name of ['fig1_incidencia_termo.png', 'fig2_cascata_causal.png', 'fig3_fatores_risco.png']) {
        await readFile(path.join(item.directory, 'assets', name));
        assert.match(component, new RegExp(`src="\\./assets/${name}"`, 'u'));
      }
    }
    assert.match(markdown, new RegExp(`Compass${slug}Content`, 'u'));
    assert.match(markdown, /mode: flow/u);
    assert.match(markdown, /prev: false/u);
    assert.match(markdown, /next: false/u);
    assert.doesNotMatch(markdown, /docFooter:/u);
    assert.doesNotMatch(component, /compass-hero/u);
  }
});

test('as fontes migradas 005/006 preservam conteúdo, rotas e documentam a numeração cruzada', async () => {
  const expected = {
    '005': {
      directory: edition005,
      sourceSha256: 'eb57e43cd3fb997884924032e84dcb6c6895f54fe7d68d73aef65e4f97a27615',
      originalPdfSha256: 'a8fff1b3118ad34ebd32a6bb8f2200aa79d733c4c4f6bff3abceb058644e08da',
      originalPdfBytes: 483057,
      legacyPdfDisplayedLabel: '006/2026',
      sections: 9,
      headings: 9,
      paragraphs: 56,
      listItems: 11,
      rows: 89,
    },
    '006': {
      directory: edition006,
      sourceSha256: '19fd67a59cf44bc7b4d87e69d58f94aaef1906302a93d726cbe80aa33a6d18a1',
      originalPdfSha256: '81cb3495c751ebe9ff98f33d4a807f0f805568d6abd4f259cd7974ec9605264a',
      originalPdfBytes: 445956,
      legacyPdfDisplayedLabel: '005/2026',
      sections: 6,
      headings: 6,
      paragraphs: 18,
      listItems: 8,
      rows: 7,
    },
  };

  for (const [slug, item] of Object.entries(expected)) {
    const [metadataText, markdown, component, pdf, releaseText] = await Promise.all([
      readFile(path.join(item.directory, 'metadata.yml'), 'utf8'),
      readFile(path.join(item.directory, 'compass.md'), 'utf8'),
      readFile(path.join(item.directory, `Compass${slug}Content.vue`), 'utf8'),
      readFile(path.join(item.directory, `compass_${slug}_2026.pdf`)),
      readFile(path.join(item.directory, 'release.json'), 'utf8'),
    ]);
    const metadata = parseYaml(metadataText);
    const release = JSON.parse(releaseText);

    assert.equal(metadata.schemaVersion, 2);
    assert.equal(metadata.id, `${slug}-2026`);
    assert.equal(metadata.slug, slug);
    assert.equal(metadata.routes.web, `/compass/edicoes/2026/${slug}/compass`);
    assert.equal(metadata.routes.pdf, `/compass/edicoes/2026/${slug}/compass_${slug}_2026.pdf`);
    assert.equal(metadata.migration.sourceSha256, item.sourceSha256);
    assert.equal(metadata.migration.originalPdfSha256, item.originalPdfSha256);
    assert.equal(metadata.migration.originalPdfBytes, item.originalPdfBytes);
    assert.deepEqual(metadata.migration.numberingCorrection, {
      state: 'corrected-crossed-label',
      canonicalLabel: `${slug}/2026`,
      legacyPdfDisplayedLabel: item.legacyPdfDisplayedLabel,
    });
    assert.notEqual(sha256(pdf), item.originalPdfSha256);
    assert.equal(sha256(pdf), release.pdf.sha256);
    assert.equal(release.pdf.filename, `compass_${slug}_2026.pdf`);
    assert.ok(release.pdf.bytes > 0 && release.pdf.bytes <= 4_000_000);
    assert.equal((component.match(/<section class="compass-section">/g) ?? []).length, item.sections);
    assert.equal((component.match(/<h2>/g) ?? []).length, item.headings);
    assert.equal((component.match(/<p>/g) ?? []).length, item.paragraphs);
    assert.equal((component.match(/<li>/g) ?? []).length, item.listItems);
    assert.equal((component.match(/<tr/g) ?? []).length, item.rows);
    assert.match(markdown, new RegExp(`Compass${slug}Content`, 'u'));
    assert.match(markdown, /mode: flow/u);
    assert.match(markdown, /prev: false/u);
    assert.match(markdown, /next: false/u);
    assert.doesNotMatch(markdown, /docFooter:/u);
    assert.doesNotMatch(markdown, /compass-hero/u);
    assert.doesNotMatch(component, />https?:\/\/[^<]+<\/a>/u);
  }
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
