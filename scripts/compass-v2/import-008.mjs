import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify as stringifyYaml } from 'yaml';

const ROUTE_ROOT = '/compass/edicoes/2026/008';
const CREDITS = Object.freeze({
  product: 'Compass™ — um produto do Grupo CSV',
  editorial: 'Responsabilidade editorial: MedValor®',
  elaboration: 'Elaboração: AxiaCare®',
});

export function extractPageSections(html) {
  const sections = String(html).match(/<section\b[^>]*class="[^"]*\bpage\b[^"]*"[^>]*>[\s\S]*?<\/section>/gi) ?? [];
  return sections.map((section) => section.trim());
}

function renamePageClass(section) {
  return section.replace(/^<section([^>]*)class="([^"]*)"([^>]*)>/i, (_match, before, classes, after) => {
    const source = new Set(classes.split(/\s+/).filter(Boolean));
    const target = ['compass-page'];
    if (source.has('cover')) target.push('compass-page--cover');
    if (source.has('back')) target.push('compass-page--back');
    return `<section${before}class="${target.join(' ')}"${after}>`;
  });
}

function rewriteAssetPaths(source) {
  return source.replace(/src="assets\/([^"]+)"/g, `src="${ROUTE_ROOT}/assets/$1"`);
}

function appendDownloadAction(section) {
  if (section.includes('class="compass-paged-download"')) return section;
  const action = '  <a class="compass-paged-download" href="./compass_008_2026.pdf" download>Baixar PDF da edição 008</a>';
  return section.replace(/\n?<\/section>\s*$/u, `\n${action}\n</section>`);
}

export function canonicalizeBrandCredits(source) {
  let result = String(source)
    .replace(/Compass\s*<span[^>]*>\s*TM\s*<\/span>/gi, 'Compass™')
    .replace(/alt="AxiaCare"/g, 'alt="AxiaCare®"');

  if (!result.includes(CREDITS.product)) {
    const block = `<div class="compass-brand-credits" aria-label="Créditos editoriais"><span>${CREDITS.product}</span><span>${CREDITS.editorial}</span><span>${CREDITS.elaboration}</span></div>`;
    result = result.replace(/(<div[^>]*>\s*Compass™\s*<\/div>)/i, `$1\n    ${block}`);
  }

  return result;
}

export function buildEdition008Metadata() {
  return {
    schemaVersion: 2,
    id: '008-2026',
    number: 8,
    year: 2026,
    slug: '008',
    title: 'Marcos temporais do processo de alta e da substituição do leito',
    subtitle: 'O que medir, quem responde por cada etapa e por onde começar.',
    publishedAt: '2026-08-31',
    status: 'Minuta para revisão',
    topics: ['alta hospitalar', 'gestão de leitos', 'fluxo hospitalar', 'substituição do leito'],
    tags: ['alta', 'gestão de leitos', 'marcos temporais', 'substituição do leito'],
    summary: 'Manual executivo sobre os marcos temporais entre a decisão de alta e a chegada do próximo paciente ao leito, com definições, responsabilidades e indicadores.',
    sources: [],
    product: { name: 'Compass™', owner: 'Grupo CSV' },
    editorial: { responsible: 'MedValor®' },
    elaboration: ['AxiaCare®'],
    engine: { name: 'compass-v2', version: '2.0.0', templateVersion: '2.0.0' },
    routes: {
      web: `${ROUTE_ROOT}/compass`,
      pdf: `${ROUTE_ROOT}/compass_008_2026.pdf`,
    },
    artifacts: { source: 'compass.md', pdf: 'compass_008_2026.pdf', manifest: 'release.json' },
    release: { version: 1, active: false, checksum: null, publishedAt: null },
    migration: { state: 'native-v2', sourceSchema: 2 },
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
      mode: 'paged',
      product: metadata.product,
      editorial: metadata.editorial,
      elaboration: metadata.elaboration,
    },
  };
}

function preparePages(html) {
  const pages = extractPageSections(html).map((page) => rewriteAssetPaths(renamePageClass(page)));
  if (pages.length !== 23) throw new Error(`A edição 008 deve conter 23 páginas; encontradas: ${pages.length}.`);
  pages[0] = canonicalizeBrandCredits(pages[0]);
  pages[pages.length - 1] = appendDownloadAction(
    canonicalizeBrandCredits(pages[pages.length - 1]),
  );
  return pages;
}

export function buildEditionContent({ html }) {
  return `<template>\n${preparePages(html).join('\n\n')}\n</template>\n`;
}

export function buildEditionMarkdown({ metadata = buildEdition008Metadata() } = {}) {
  const frontmatter = stringifyYaml(buildFrontmatter(metadata)).trimEnd();
  return `---\n${frontmatter}\n---\n\n<script setup>\nimport Compass008Content from './Compass008Content.vue'\n</script>\n\n<!-- Fonte: pacote Compass 008 recebido em 31/08/2026. Conteúdo preservado integralmente; HTML reparado e adaptado ao motor Compass™ v2. -->\n\n<CompassEdition>\n  <Compass008Content />\n</CompassEdition>\n\n<style src="./edition.css"></style>\n`;
}

export function buildEditionCss(sourceCss) {
  let css = String(sourceCss)
    .replace(/:root\s*\{/g, '.compass-v2--paged {')
    .replace(/html,body\s*\{[^}]*\}/g, '')
    .replace(/body\s*\{[^}]*\}/g, '')
    .replace(/\.page\b/g, '.compass-page')
    .replace(/\.cover\b/g, '.compass-page--cover')
    .replace(/\.back\b/g, '.compass-page--back')
    .replace(/url\(["']?assets\/([^"')]+)["']?\)/g, `url("${ROUTE_ROOT}/assets/$1")`);

  css += `

/* Adaptação responsiva Compass™ v2; as regras A4 originais permanecem canônicas para impressão. */
.compass-v2--paged .compass-v2__content {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}
.compass-brand-credits {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.8rem;
  color: rgba(255,255,255,.78);
  font-family: var(--f-txt);
  font-size: 0.68rem;
  line-height: 1.35;
}
/* O documento editorial é sempre papel claro; o tema do Hub não recolore seu conteúdo. */
.dark .compass-v2.compass-v2--paged {
  --compass-paper: #ffffff;
  --compass-cream: #ffffff;
  --compass-ink: #1b1e24;
  --compass-muted: #4a5260;
  --compass-line: rgba(27,30,36,.14);
  --cinza-3: #5f6670;
}
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) p,
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) li,
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) td {
  color: var(--cinza);
}
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) h2,
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) h3,
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) h4,
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) strong,
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) b {
  color: var(--tinta);
}
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) .cap-open,
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) .cap-open .t {
  color: #ffffff !important;
}
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) .cap-open .k { color: rgba(255,255,255,.72) !important; }
.dark .compass-v2--paged .compass-page:not(.compass-page--cover):not(.compass-page--back) .cap-open .d { color: #d0d5dc !important; }
.compass-v2--paged .compass-page--cover [style*="rgba(255,255,255,.42)"],
.compass-v2--paged .compass-page--cover .base .l1,
.compass-v2--paged .compass-page--back [style*="rgba(255,255,255,.42)"],
.compass-v2--paged .compass-page--back .base .l1 {
  color: rgba(255,255,255,.68) !important;
}
.compass-v2--paged .compass-page--back .cop,
.compass-v2--paged .compass-page--back .mi p {
  color: rgba(255,255,255,.72) !important;
}
.compass-v2--paged .compass-v2__content table {
  display: table;
  overflow: visible;
  border: 0;
  border-collapse: collapse;
  border-radius: 0;
  background: transparent;
  font-size: 8.3pt;
}
.compass-v2--paged .compass-v2__content table th {
  padding: 1.8mm 2.2mm 1.8mm 0;
  color: var(--tinta);
  background: transparent;
}
.compass-v2--paged .compass-v2__content table td {
  padding: 1.9mm 2.2mm 1.9mm 0;
  color: var(--cinza);
  background: transparent;
}
.compass-v2--paged .compass-v2__content table,
.compass-v2--paged .compass-v2__content table thead,
.compass-v2--paged .compass-v2__content table tbody,
.compass-v2--paged .compass-v2__content table tr,
.compass-v2--paged .compass-v2__content table th,
.compass-v2--paged .compass-v2__content table td {
  background: #ffffff !important;
}
.compass-v2--paged .compass-v2__content table tbody tr:nth-child(even) { background: #ffffff !important; }
.compass-v2--paged .compass-v2__content table .mono { color: var(--azul) !important; }
@media screen {
  .compass-v2--paged .compass-page {
    width: 100%;
    height: auto;
    min-height: 0;
    margin: 0 0 1.5rem;
    overflow: visible;
    border: 1px solid rgba(27,30,36,.12);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 18px 54px rgba(13,38,76,.12);
  }
  .compass-v2--paged .pad,
  .compass-v2--paged .pad--cap {
    position: relative;
    inset: auto;
    padding: clamp(1.5rem, 5vw, 4rem);
  }
  .compass-v2--paged .rh,
  .compass-v2--paged .ft {
    position: relative;
    inset: auto;
    margin: 0 clamp(1.5rem, 5vw, 4rem);
    padding: 1.1rem 0 0.75rem;
  }
  .compass-v2--paged .ft { padding: 0.75rem 0 1.1rem; }
  .compass-v2--paged .compass-page--cover,
  .compass-v2--paged .compass-page--back {
    display: grid;
    align-content: center;
    min-height: min(820px, calc(100vh - 7rem));
    padding: clamp(2rem, 6vw, 5rem);
    color: #fff;
    background: var(--dark);
  }
  .compass-v2--paged .compass-page--cover .logo {
    position: absolute;
    top: clamp(1.5rem, 4vw, 3rem);
    left: clamp(1.5rem, 5vw, 4rem);
    height: clamp(34px, 6vw, 52px);
  }
  .compass-v2--paged .compass-page--cover > div[style*="position:absolute"] {
    top: clamp(1.5rem, 4vw, 3rem) !important;
    right: clamp(1.5rem, 5vw, 4rem) !important;
  }
  .compass-v2--paged .compass-page--cover > svg {
    position: relative !important;
    inset: auto !important;
    width: 100% !important;
    margin: 5rem 0 2rem;
  }
  .compass-v2--paged .compass-page--cover .bloco,
  .compass-v2--paged .compass-page--cover .base,
  .compass-v2--paged .compass-page--back .mi,
  .compass-v2--paged .compass-page--back .assin,
  .compass-v2--paged .compass-page--back .base {
    position: relative;
    inset: auto;
  }
  .compass-v2--paged .compass-page--cover .bloco { margin-top: 1rem; }
  .compass-v2--paged .compass-page--cover .base,
  .compass-v2--paged .compass-page--back .base { margin-top: 3rem; }
  .compass-v2--paged .compass-page--back .assin { margin-top: 3rem; }
  .compass-v2--paged .compass-paged-download {
    display: inline-flex;
    justify-self: start;
    margin-top: 1.5rem;
    padding: 0.72rem 1rem;
    border: 1px solid rgba(255,255,255,.34);
    border-radius: 999px;
    color: #ffffff;
    font-weight: 700;
    text-decoration: none;
  }
  .compass-v2--paged .compass-paged-download:hover { background: rgba(255,255,255,.12); }
  .compass-v2--paged .cap-open { margin: 0 0 2rem; padding: clamp(1.5rem, 5vw, 3rem); }
  .compass-v2--paged table { max-width: 100%; }
}
@media screen and (max-width: 768px) {
  .compass-v2--paged .compass-page--cover,
  .compass-v2--paged .compass-page--back { min-height: 620px; padding: 1.35rem; }
  .compass-v2--paged .compass-page--cover > div[style*="position:absolute"] { position: relative !important; inset: auto !important; margin: 4.5rem 0 0; text-align: left !important; }
  .compass-v2--paged .compass-page--cover > svg { margin: 2rem 0 1rem; }
  .compass-v2--paged .compass-page--cover .t { font-size: clamp(2rem, 11vw, 3.1rem); }
  .compass-v2--paged .ld,
  .compass-v2--paged .g2 { grid-template-columns: 1fr; }
  .compass-v2--paged .ld > div + div { border-left: 0; border-top: .3pt solid var(--fio); padding-left: 0; }
  .compass-v2--paged table { display: block; overflow-x: auto; white-space: normal; }
  .compass-v2--paged figure svg { min-width: 620px; }
  .compass-v2--paged figure { max-width: 100%; overflow-x: auto; }
  .compass-v2--paged .assin { align-items: flex-start; flex-direction: column; }
}
@media print {
  @page { size: A4; margin: 0; }
  .compass-v2--paged { width: 210mm; max-width: none; margin: 0; }
  .compass-v2--paged .compass-page { width: 210mm; height: 297mm; margin: 0; overflow: hidden; break-after: page; page-break-after: always; }
  .compass-v2--paged .compass-page:last-child { break-after: auto; page-break-after: auto; }
  .compass-brand-credits { font-size: 6.2pt; }
  .compass-v2--paged .compass-paged-download { display: none !important; }
}
`;
  return css;
}

async function copyAssets(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
    if (entry.isFile()) await copyFile(path.join(sourceDir, entry.name), path.join(targetDir, entry.name));
  }
}

export async function importEdition008({ inputDir, outputDir }) {
  const htmlPath = path.join(inputDir, 'compass-008-2026.html');
  const cssPath = path.join(inputDir, 'compass-008-2026.css');
  const [html, css] = await Promise.all([readFile(htmlPath, 'utf8'), readFile(cssPath, 'utf8')]);
  const metadata = buildEdition008Metadata();
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, 'compass.md'), buildEditionMarkdown({ metadata }), 'utf8'),
    writeFile(path.join(outputDir, 'Compass008Content.vue'), buildEditionContent({ html }), 'utf8'),
    writeFile(path.join(outputDir, 'edition.css'), buildEditionCss(css), 'utf8'),
    writeFile(path.join(outputDir, 'metadata.yml'), stringifyYaml(metadata), 'utf8'),
    copyAssets(path.join(inputDir, 'assets'), path.join(outputDir, 'assets')),
  ]);
  return metadata;
}

async function main() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');
  if (inputIndex === -1 || outputIndex === -1 || !args[inputIndex + 1] || !args[outputIndex + 1]) {
    throw new Error('Uso: node import-008.mjs --input <diretório-fonte> --output <diretório-canônico>');
  }
  const metadata = await importEdition008({
    inputDir: path.resolve(args[inputIndex + 1]),
    outputDir: path.resolve(args[outputIndex + 1]),
  });
  console.log(`Compass™ ${metadata.slug}/${metadata.year} importado em formato v2.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
