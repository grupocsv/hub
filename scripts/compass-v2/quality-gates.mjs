import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { assertLocalRenderUrl } from './render-pdf.mjs';

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[—–-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

export function evaluateParity({ webText, pdfText, requiredTexts }) {
  const normalizedWeb = normalizeText(webText);
  const normalizedPdf = normalizeText(pdfText);
  const missingInWeb = requiredTexts.filter((text) => !normalizedWeb.includes(normalizeText(text)));
  const missingInPdf = requiredTexts.filter((text) => !normalizedPdf.includes(normalizeText(text)));
  return {
    ok: missingInWeb.length === 0 && missingInPdf.length === 0,
    missingInWeb,
    missingInPdf,
  };
}

export function evaluatePdfConstraints({ bytes, pages }) {
  const maxBytes = 4_000_000;
  const violations = [];
  if (!Number.isInteger(pages) || pages < 1) violations.push('O PDF deve conter ao menos uma página.');
  if (bytes > maxBytes) violations.push('O PDF excede o limite operacional de 4.000.000 bytes.');
  return { ok: violations.length === 0, maxBytes, bytes, pages, violations };
}

function parseRgb(value) {
  const match = String(value ?? '').match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
  return match ? match.slice(1, 4).map(Number) : null;
}

function relativeLuminance(rgb) {
  const channels = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(foreground, background) {
  const title = parseRgb(foreground);
  const surface = parseRgb(background);
  if (!title || !surface) return null;
  const titleLuminance = relativeLuminance(title);
  const surfaceLuminance = relativeLuminance(surface);
  return Number(((Math.max(titleLuminance, surfaceLuminance) + 0.05)
    / (Math.min(titleLuminance, surfaceLuminance) + 0.05)).toFixed(2));
}

export function evaluateVisualTokens({
  backTitleColor,
  backBackgroundColor,
  printBackTitleColor,
  printBackBackgroundColor,
}) {
  const backTitleContrast = contrastRatio(backTitleColor, backBackgroundColor);
  const printBackTitleContrast = contrastRatio(printBackTitleColor, printBackBackgroundColor);
  const violations = [];
  if (backTitleContrast !== null && backTitleContrast < 4.5) {
    violations.push('O título da contracapa na tela não atende ao contraste mínimo de 4,5:1.');
  }
  if (printBackTitleContrast !== null && printBackTitleContrast < 4.5) {
    violations.push('O título da contracapa no PDF não atende ao contraste mínimo de 4,5:1.');
  }
  return {
    ok: violations.length === 0,
    backTitleContrast,
    printBackTitleContrast,
    violations,
  };
}

async function extractPdfText(pdfPath) {
  const bytes = await readFile(pdfPath);
  const document = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const pages = [];
  for (let index = 1; index <= document.numPages; index += 1) {
    const page = await document.getPage(index);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return { bytes, pages: document.numPages, text: pages.join('\n') };
}

async function revealLocalContent(page) {
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
}

export async function auditEdition({ url, pdfPath, outputDir, requiredTexts }) {
  assertLocalRenderUrl(url);
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let webText = '';
  let accessibility = { violations: [], passes: 0 };
  let visualTokens = {
    backTitleColor: null,
    backBackgroundColor: null,
    printBackTitleColor: null,
    printBackBackgroundColor: null,
  };
  const desktopScreenshot = path.join(outputDir, 'desktop.png');
  const mobileScreenshot = path.join(outputDir, 'mobile.png');

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await revealLocalContent(page);
    await page.waitForSelector('.compass-v2', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    webText = await page.locator('.compass-v2').innerText();
    visualTokens = await page.evaluate(() => {
      const title = document.querySelector('.compass-page--back .mi .t');
      const back = document.querySelector('.compass-page--back');
      return {
        backTitleColor: title ? getComputedStyle(title).color : null,
        backBackgroundColor: back ? getComputedStyle(back).backgroundColor : null,
      };
    });
    const axeResults = await new AxeBuilder({ page }).include('.compass-v2').analyze();
    await page.emulateMedia({ media: 'print' });
    const printVisualTokens = await page.evaluate(() => {
      const title = document.querySelector('.compass-page--back .mi .t');
      const back = document.querySelector('.compass-page--back');
      return {
        printBackTitleColor: title ? getComputedStyle(title).color : null,
        printBackBackgroundColor: back ? getComputedStyle(back).backgroundColor : null,
      };
    });
    visualTokens = { ...visualTokens, ...printVisualTokens };
    await page.emulateMedia({ media: 'screen' });
    accessibility = {
      violations: axeResults.violations.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        nodes: nodes.length,
        samples: nodes.slice(0, 24).map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
      passes: axeResults.passes.length,
    };
    await page.screenshot({ path: desktopScreenshot, fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: mobileScreenshot, fullPage: true });
  } finally {
    await browser.close();
  }

  const pdf = await extractPdfText(pdfPath);
  const parity = evaluateParity({ webText, pdfText: pdf.text, requiredTexts });
  const pdfConstraints = evaluatePdfConstraints({ bytes: pdf.bytes.length, pages: pdf.pages });
  const blockingAccessibility = accessibility.violations.filter((item) => ['critical', 'serious'].includes(item.impact));
  const visualValidation = evaluateVisualTokens(visualTokens);
  const report = {
    generatedAt: new Date().toISOString(),
    url,
    parity,
    pdf: pdfConstraints,
    accessibility: { ...accessibility, blocking: blockingAccessibility.length },
    visual: {
      desktop: path.basename(desktopScreenshot),
      mobile: path.basename(mobileScreenshot),
      tokens: visualTokens,
      validation: visualValidation,
    },
    ok: parity.ok && pdfConstraints.ok && blockingAccessibility.length === 0 && visualValidation.ok,
  };
  await writeFile(path.join(outputDir, 'quality-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

function parseArgs(argv) {
  const get = (name) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : null;
  };
  const values = {
    url: get('--url'),
    pdfPath: get('--pdf'),
    outputDir: get('--output-dir'),
    requiredTexts: (get('--required') ?? 'Compass™|Grupo CSV|MedValor®|AxiaCare®').split('|'),
  };
  if (!values.url || !values.pdfPath || !values.outputDir) {
    throw new Error('Uso: node quality-gates.mjs --url <localhost> --pdf <arquivo> --output-dir <diretório> [--required <texto|texto>]');
  }
  return values;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const args = parseArgs(process.argv.slice(2));
  auditEdition({
    url: args.url,
    pdfPath: path.resolve(args.pdfPath),
    outputDir: path.resolve(args.outputDir),
    requiredTexts: args.requiredTexts,
  }).then((report) => {
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
