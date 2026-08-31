import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { normalizeEditionMetadata, validateEditionMetadata } from './schema.mjs';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractBlocks(source, className) {
  const classPattern = escapeRegExp(className);
  const expression = new RegExp(
    `<div\\s+class=["']${classPattern}["']\\s*>([\\s\\S]*?)<\\/div>`,
    'giu',
  );
  return [...String(source).matchAll(expression)].map((match) => match[1].trim());
}

function extractSingleBlock(source, className) {
  return extractBlocks(source, className)[0] ?? null;
}

function extractLegacyNav(source) {
  const nav = extractSingleBlock(source, 'compass-nav');
  return nav ? `<nav class="compass-nav" aria-label="Navegação entre edições">\n${nav}\n</nav>` : '';
}

function extractLegacyDownload(source, { editionSlug, year }) {
  const block = extractSingleBlock(source, 'compass-download');
  if (!block) {
    return `<a class="compass-download" href="/compass/edicoes/${year}/${editionSlug}/compass_${editionSlug}_${year}.pdf" download>Baixar PDF</a>`;
  }
  return `<div class="compass-download">\n${block}\n</div>`;
}

function normalizeReferenceLinks(section) {
  return String(section).replace(
    /<a([^>]*\bhref=["']https?:\/\/[^"']+["'][^>]*)>\s*https?:\/\/[^<]+\s*<\/a>/giu,
    '<a$1>Link</a>',
  );
}

export function buildLegacyEditionContent({ legacyMarkdown, editionSlug, year }) {
  const sections = extractBlocks(legacyMarkdown, 'compass-section').map(normalizeReferenceLinks);
  if (sections.length === 0) throw new Error('Nenhuma seção editorial legada foi encontrada.');

  const scope = extractSingleBlock(legacyMarkdown, 'compass-scope');
  const content = sections
    .map((section) => `<section class="compass-section">\n${section}\n</section>`)
    .join('\n\n');
  const scopeBlock = scope
    ? `<aside class="compass-scope" aria-label="Nota de escopo">\n${scope}\n</aside>`
    : '';
  const actions = [
    extractLegacyDownload(legacyMarkdown, { editionSlug, year }),
    extractLegacyNav(legacyMarkdown),
  ].filter(Boolean).join('\n\n');

  return `<template>\n${content}\n\n${scopeBlock}\n\n<div class="compass-download-actions">\n${actions}\n</div>\n</template>\n`;
}

export async function extractLegacyPdfText(legacyPdf) {
  const document = await getDocument({ data: new Uint8Array(legacyPdf) }).promise;
  try {
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    }
    return pages.join('\n');
  } finally {
    if (typeof document.cleanup === 'function') await document.cleanup();
  }
}

export function detectLegacyPdfEditionLabel(legacyPdfText) {
  const labels = [...String(legacyPdfText ?? '').matchAll(/E\s*d\s*i\s*ç\s*ã\s*o\s+(\d\s*\d\s*\d)\s*\/\s*(\d\s*\d\s*\d\s*\d)/giu)]
    .map((match) => `${match[1].replaceAll(/\s/gu, '')}/${match[2].replaceAll(/\s/gu, '')}`);
  const uniqueLabels = [...new Set(labels)];
  if (uniqueLabels.length > 1) {
    throw new Error(`PDF legado com numeração ambígua: ${uniqueLabels.join(', ')}.`);
  }
  return uniqueLabels[0] ?? null;
}

export function buildLegacyEditionMetadata({ legacyMetadata, legacyMarkdown, legacyPdf, legacyPdfText = '' }) {
  const metadata = normalizeEditionMetadata(legacyMetadata);
  const validation = validateEditionMetadata(metadata);
  if (!validation.valid) {
    throw new Error(`Metadados Compass™ inválidos: ${validation.errors.map((item) => item.path).join(', ')}.`);
  }

  const canonicalLabel = `${metadata.slug}/${metadata.year}`;
  const legacyPdfDisplayedLabel = detectLegacyPdfEditionLabel(legacyPdfText);
  const numberingCorrection = legacyPdfDisplayedLabel && legacyPdfDisplayedLabel !== canonicalLabel
    ? {
        state: 'corrected-crossed-label',
        canonicalLabel,
        legacyPdfDisplayedLabel,
      }
    : null;

  return {
    ...metadata,
    migration: {
      ...metadata.migration,
      sourceSha256: sha256(legacyMarkdown),
      originalPdfSha256: sha256(legacyPdf),
      originalPdfBytes: legacyPdf.length,
      ...(numberingCorrection ? { numberingCorrection } : {}),
    },
  };
}

function buildFrontmatter(metadata) {
  return {
    title: metadata.title,
    description: metadata.summary,
    layout: 'doc',
    aside: false,
    outline: false,
    editLink: false,
    lastUpdated: false,
    prev: false,
    next: false,
    head: [
      ['meta', { property: 'og:title', content: `Compass™ ${metadata.slug}/${metadata.year} — ${metadata.title}` }],
      ['meta', { property: 'og:description', content: metadata.summary ?? metadata.title }],
      ['meta', { property: 'og:image', content: 'https://hub.grupocsv.com/og/og_compass.png' }],
      ['meta', { property: 'og:url', content: `https://hub.grupocsv.com${metadata.routes.web}` }],
      ['meta', { property: 'og:type', content: 'website' }],
    ],
    compass: {
      schemaVersion: metadata.schemaVersion,
      id: metadata.id,
      edition: metadata.slug,
      number: metadata.number,
      year: metadata.year,
      title: metadata.title,
      subtitle: metadata.subtitle,
      publishedAt: metadata.publishedAt,
      status: metadata.status,
      mode: 'flow',
      product: metadata.product,
      editorial: metadata.editorial,
      elaboration: metadata.elaboration,
    },
  };
}

export function buildLegacyEditionMarkdown(metadata) {
  const componentName = `Compass${metadata.slug}Content`;
  const frontmatter = stringifyYaml(buildFrontmatter(metadata)).trimEnd();
  return `---\n${frontmatter}\n---\n\n<script setup>\nimport ${componentName} from './${componentName}.vue'\n</script>\n\n<!-- Fonte: edição legada ${metadata.slug}/${metadata.year}. Conteúdo editorial preservado e adaptado ao motor Compass™ v2; proveniência registrada em metadata.yml. -->\n\n<CompassEdition>\n  <${componentName} />\n</CompassEdition>\n\n<style src="./edition.css"></style>\n`;
}

export function buildLegacyEditionCss() {
  return `.compass-v2:not(.compass-v2--paged) .compass-section {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.compass-v2 .compass-section + .compass-section {
  margin-top: 3.5rem;
}

.compass-v2 .compass-section:first-child h2 {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.compass-v2 .compass-scope {
  margin-top: 3rem;
  padding: 1.25rem 1.4rem;
  border: 1px solid var(--compass-line);
  border-left: 4px solid var(--compass-orange);
  border-radius: 0 12px 12px 0;
  color: var(--compass-muted);
  background: color-mix(in srgb, var(--compass-orange) 8%, transparent);
  font-size: 0.9rem;
  line-height: 1.65;
}

.compass-v2 .compass-download-actions {
  display: grid;
  justify-items: center;
  gap: 1rem;
  margin-top: 2.5rem;
}

.compass-v2 .compass-download a,
.compass-v2 .compass-nav a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.72rem 1.2rem;
  border: 1px solid var(--compass-line);
  border-radius: 10px;
  color: #ffffff;
  background: var(--compass-blue);
  font-weight: 700;
  text-decoration: none;
}

.compass-v2 .compass-download svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: currentColor;
}

.compass-v2 .compass-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.compass-v2 .compass-nav .nav-secondary {
  color: var(--compass-ink);
  background: var(--compass-cream);
}

.dark .compass-v2 .compass-download a,
.dark .compass-v2 .compass-nav .nav-primary {
  color: #ffffff;
}

.compass-v2 .ref-table {
  white-space: normal;
}

.compass-v2 .ref-table td:last-child {
  width: 5.5rem;
}

@media (max-width: 768px) {
  .compass-v2 .comparison-table {
    display: block;
    overflow-x: auto;
  }

  .compass-v2 .ref-table {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    table-layout: auto;
    font-size: 0.78rem;
    white-space: normal;
  }

  .compass-v2 .ref-table th,
  .compass-v2 .ref-table td {
    padding: 0.55rem 0.5rem;
    overflow-wrap: normal;
    word-break: normal;
    white-space: normal;
  }

  .compass-v2 .ref-table th:first-child,
  .compass-v2 .ref-table td:first-child {
    min-width: 18rem;
  }

  .compass-v2 .ref-table th:nth-child(2),
  .compass-v2 .ref-table td:nth-child(2) {
    min-width: 16rem;
  }

  .compass-v2 .ref-table th:last-child,
  .compass-v2 .ref-table td:last-child {
    min-width: 5rem;
  }
}

@media print {
  .dark .compass-v2:not(.compass-v2--paged) .compass-section,
  .compass-v2:not(.compass-v2--paged) .compass-section {
    background: #ffffff !important;
  }

  .compass-v2:not(.compass-v2--paged) .compass-v2__content table,
  .compass-v2:not(.compass-v2--paged) .compass-v2__content table thead,
  .compass-v2:not(.compass-v2--paged) .compass-v2__content table tbody,
  .compass-v2:not(.compass-v2--paged) .compass-v2__content table tr,
  .compass-v2:not(.compass-v2--paged) .compass-v2__content table td {
    background: #ffffff !important;
  }

  .compass-v2:not(.compass-v2--paged) .compass-v2__content table th {
    color: #ffffff !important;
    background: #0d264c !important;
  }

  .compass-v2:not(.compass-v2--paged) .compass-scope {
    color: #334155 !important;
    background: #fff8ed !important;
  }

  .compass-v2:not(.compass-v2--paged) .compass-scope strong {
    color: #0d264c !important;
  }

  .compass-v2:not(.compass-v2--paged) .comparison-table {
    break-inside: auto !important;
  }

  .compass-v2:not(.compass-v2--paged) .comparison-table tr {
    break-inside: avoid;
  }

  .compass-v2 .compass-section + .compass-section {
    margin-top: 10mm;
  }

  .compass-v2 .ref-table {
    break-inside: auto;
    font-size: 7.2pt;
  }

  .compass-v2 .ref-table tr {
    break-inside: avoid;
  }
}
`;
}

export async function importLegacyEdition({ inputDir, outputDir }) {
  const [legacyMetadataText, legacyMarkdown] = await Promise.all([
    readFile(path.join(inputDir, 'metadata.yml'), 'utf8'),
    readFile(path.join(inputDir, 'compass.md'), 'utf8'),
  ]);
  const legacyMetadata = parseYaml(legacyMetadataText);
  const identity = normalizeEditionMetadata(legacyMetadata);
  const pdfName = `compass_${identity.slug}_${identity.year}.pdf`;
  const legacyPdf = await readFile(path.join(inputDir, pdfName));
  const legacyPdfText = await extractLegacyPdfText(legacyPdf);
  const metadata = buildLegacyEditionMetadata({ legacyMetadata, legacyMarkdown, legacyPdf, legacyPdfText });
  const componentName = `Compass${metadata.slug}Content.vue`;

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, 'metadata.yml'), stringifyYaml(metadata), 'utf8'),
    writeFile(path.join(outputDir, 'compass.md'), buildLegacyEditionMarkdown(metadata), 'utf8'),
    writeFile(
      path.join(outputDir, componentName),
      buildLegacyEditionContent({ legacyMarkdown, editionSlug: metadata.slug, year: metadata.year }),
      'utf8',
    ),
    writeFile(path.join(outputDir, 'edition.css'), buildLegacyEditionCss(), 'utf8'),
  ]);

  const inputPdf = path.join(inputDir, pdfName);
  const outputPdf = path.join(outputDir, pdfName);
  if (path.resolve(inputPdf) !== path.resolve(outputPdf)) await copyFile(inputPdf, outputPdf);
  return metadata;
}

function parseArgs(argv) {
  const get = (name) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : null;
  };
  const inputDir = get('--input');
  const outputDir = get('--output');
  if (!inputDir || !outputDir) {
    throw new Error('Uso: node import-legacy.mjs --input <diretório-legado> --output <diretório-canônico>');
  }
  return { inputDir: path.resolve(inputDir), outputDir: path.resolve(outputDir) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const metadata = await importLegacyEdition(args);
  console.log(`Compass™ ${metadata.slug}/${metadata.year} migrado para o schema v2.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
