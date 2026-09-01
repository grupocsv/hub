import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export function buildPdfOptions(output) {
  return {
    path: output,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    tagged: true,
    outline: true,
  };
}

export function assertLocalRenderUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('A renderização PDF aceita somente uma origem local do build validado.');
  }
  return true;
}

export async function sha256File(file) {
  const content = await readFile(file);
  return createHash('sha256').update(content).digest('hex');
}

export async function cleanupPdfDocument(document) {
  if (typeof document.cleanup === 'function') {
    await document.cleanup();
    return;
  }
  if (typeof document.destroy === 'function') await document.destroy();
}

export function createReleaseManifest({ edition, sourceHash, pdfHash, pdfBytes, pdfPages, generatedAt }) {
  if (!Number.isSafeInteger(pdfPages) || pdfPages <= 0) {
    throw new TypeError('Contagem de páginas do PDF inválida.');
  }
  return {
    schemaVersion: 1,
    editionId: edition.id,
    editionSlug: edition.slug,
    year: edition.year,
    generatedAt,
    engine: { name: 'compass-v2', renderer: 'playwright-chromium' },
    sourceHash,
    pdf: {
      filename: `compass_${edition.slug}_${edition.year}.pdf`,
      sha256: pdfHash,
      bytes: pdfBytes,
      pages: pdfPages,
    },
  };
}

export async function renderPdf({ url, output, edition, sourceFile, manifestOutput }) {
  assertLocalRenderUrl(url);
  await mkdir(path.dirname(output), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(url, { waitUntil: 'networkidle' });

    // O bypass existe somente no render local já restringido por assertLocalRenderUrl.
    // Nenhuma regra de autenticação publicada é alterada.
    await page.evaluate(() => {
      document.querySelector('#hub-auth-overlay')?.remove();
      document.body.classList.remove('ha-scroll-locked');
      for (const element of document.querySelectorAll('.VPContent, .VPDoc, main')) {
        if (element instanceof HTMLElement) {
          element.hidden = false;
          element.style.removeProperty('display');
          element.style.removeProperty('visibility');
        }
      }
    });

    await page.waitForSelector('.compass-v2', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    await page.pdf(buildPdfOptions(output));
  } finally {
    await browser.close();
  }

  const generatedAt = new Date().toISOString();
  const pdfHash = await sha256File(output);
  const pdfBytes = (await stat(output)).size;
  const pdfDocument = await getDocument({ data: new Uint8Array(await readFile(output)) }).promise;
  const pdfPages = pdfDocument.numPages;
  await cleanupPdfDocument(pdfDocument);
  const sourceHash = sourceFile ? await sha256File(sourceFile) : createHash('sha256').update(url).digest('hex');
  const manifest = createReleaseManifest({ edition, sourceHash, pdfHash, pdfBytes, pdfPages, generatedAt });

  if (manifestOutput) {
    await mkdir(path.dirname(manifestOutput), { recursive: true });
    await writeFile(manifestOutput, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }
  return manifest;
}

function parseArgs(argv) {
  const get = (name) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : null;
  };
  const values = {
    url: get('--url'),
    output: get('--output'),
    editionFile: get('--edition-file'),
    sourceFile: get('--source-file'),
    manifestOutput: get('--manifest'),
  };
  if (!values.url || !values.output || !values.editionFile) {
    throw new Error('Uso: node render-pdf.mjs --url <localhost> --output <pdf> --edition-file <json> [--source-file <arquivo>] [--manifest <json>]');
  }
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const edition = JSON.parse(await readFile(path.resolve(args.editionFile), 'utf8'));
  const manifest = await renderPdf({
    url: args.url,
    output: path.resolve(args.output),
    edition,
    sourceFile: args.sourceFile ? path.resolve(args.sourceFile) : null,
    manifestOutput: args.manifestOutput ? path.resolve(args.manifestOutput) : null,
  });
  console.log(`${manifest.pdf.filename}: ${manifest.pdf.sha256}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
