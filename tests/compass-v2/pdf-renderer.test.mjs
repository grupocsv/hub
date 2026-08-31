import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const rendererPath = path.join(repoRoot, 'scripts/compass-v2/render-pdf.mjs');
const moduleUrl = pathToFileURL(rendererPath).href;

async function loadRenderer() {
  try {
    return await import(moduleUrl);
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

test('expõe funções puras do renderizador PDF', async () => {
  const renderer = await loadRenderer();
  assert.notEqual(renderer, null, 'render-pdf.mjs ainda não existe');
  assert.equal(typeof renderer.buildPdfOptions, 'function');
  assert.equal(typeof renderer.assertLocalRenderUrl, 'function');
  assert.equal(typeof renderer.sha256File, 'function');
  assert.equal(typeof renderer.createReleaseManifest, 'function');
});

test('fixa as opções editoriais A4 e preserva fundos', async () => {
  const renderer = await loadRenderer();
  assert.notEqual(renderer, null, 'renderizador ausente');
  assert.deepEqual(renderer.buildPdfOptions('/tmp/compass.pdf'), {
    path: '/tmp/compass.pdf',
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    tagged: true,
    outline: true,
  });
});

test('aceita somente localhost como origem padrão de renderização', async () => {
  const renderer = await loadRenderer();
  assert.notEqual(renderer, null, 'renderizador ausente');
  assert.equal(renderer.assertLocalRenderUrl('http://127.0.0.1:4173/compass/'), true);
  assert.equal(renderer.assertLocalRenderUrl('http://localhost:4173/compass/'), true);
  assert.throws(() => renderer.assertLocalRenderUrl('https://hub.grupocsv.com/compass/'), /local/i);
  assert.throws(() => renderer.assertLocalRenderUrl('https://example.com/'), /local/i);
});

test('calcula checksum SHA-256 real do artefato', async () => {
  const renderer = await loadRenderer();
  assert.notEqual(renderer, null, 'renderizador ausente');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'compass-v2-pdf-'));
  const file = path.join(directory, 'artifact.txt');
  await writeFile(file, 'Compass™\n', 'utf8');
  assert.equal(await renderer.sha256File(file), '2416fec304f292c7c7d068882d2aca69e8449d1060477de9fe3e7172b2efeeb8');
});

test('cria manifesto de release sem caminhos absolutos', async () => {
  const renderer = await loadRenderer();
  assert.notEqual(renderer, null, 'renderizador ausente');
  const manifest = renderer.createReleaseManifest({
    edition: { id: '008-2026', slug: '008', year: 2026 },
    sourceHash: 'a'.repeat(64),
    pdfHash: 'b'.repeat(64),
    pdfBytes: 12345,
    generatedAt: '2026-08-31T18:00:00.000Z',
  });
  assert.deepEqual(manifest, {
    schemaVersion: 1,
    editionId: '008-2026',
    editionSlug: '008',
    year: 2026,
    generatedAt: '2026-08-31T18:00:00.000Z',
    engine: { name: 'compass-v2', renderer: 'playwright-chromium' },
    sourceHash: 'a'.repeat(64),
    pdf: { filename: 'compass_008_2026.pdf', sha256: 'b'.repeat(64), bytes: 12345 },
  });
  assert.ok(!JSON.stringify(manifest).includes('/tmp/'));
});

test('o código aguarda o componente Compass™ e não contém bypass remoto de autenticação', async () => {
  const source = await readFile(rendererPath, 'utf8').catch(() => '');
  assert.match(source, /waitForSelector\(['"]\.compass-v2['"]/);
  assert.match(source, /assertLocalRenderUrl/);
  assert.doesNotMatch(source, /allowRemote|--allow-remote/i);
});
