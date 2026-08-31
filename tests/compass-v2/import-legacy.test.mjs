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

test('preserva o href e abrevia URLs visíveis em tabelas de referência', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const rawUrl = 'https://example.com/caminho-muito-longo-para-a-referencia';
  const content = importer.buildLegacyEditionContent({
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

test('mantém links primários legíveis no tema escuro', async () => {
  const importer = await loadImporter();
  assert.notEqual(importer, null, 'import-legacy.mjs ainda não existe');
  const css = importer.buildLegacyEditionCss();

  assert.match(css, /\.dark\s+\.compass-v2\s+\.compass-download\s+a[^}]*\{[^}]*color:\s*#(?:fff|ffffff)/si);
  assert.match(css, /\.dark\s+\.compass-v2\s+\.compass-nav\s+\.nav-primary[^}]*\{[^}]*color:\s*#(?:fff|ffffff)/si);
  assert.match(css, /@media\s*\(max-width:\s*768px\)[\s\S]*\.compass-v2\s+\.ref-table\s*\{[^}]*display:\s*block[^}]*overflow-x:\s*auto[^}]*table-layout:\s*auto/si);
  assert.match(css, /\.compass-v2\s+\.ref-table\s+(?:th|td)[^}]*\{[^}]*padding:\s*0\.55rem\s+0\.5rem[^}]*overflow-wrap:\s*normal/si);
  assert.match(css, /\.compass-v2\s+\.ref-table\s+(?:th|td):first-child[^}]*\{[^}]*min-width:\s*18rem/si);
  assert.match(css, /\.compass-v2\s+\.ref-table\s+(?:th|td):nth-child\(2\)[^}]*\{[^}]*min-width:\s*16rem/si);
  assert.match(css, /\.compass-v2\s+\.ref-table\s+(?:th|td):last-child[^}]*\{[^}]*min-width:\s*5rem/si);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*768px\)[\s\S]*\.compass-v2\s+\.ref-table\s*\{[^}]*table-layout:\s*fixed/si);
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
  assert.match(markdown, /prev: false/u);
  assert.match(markdown, /next: false/u);
  assert.doesNotMatch(markdown, /docFooter:/u);
  assert.doesNotMatch(markdown, /<style>/u);
  assert.equal((component.match(/<section class="compass-section">/g) ?? []).length, 2);
  assert.doesNotMatch(component, /compass-hero/u);
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
