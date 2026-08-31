import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { renderPdf } from '../../scripts/compass-v2/render-pdf.mjs';
import { auditEdition } from '../../scripts/compass-v2/quality-gates.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address()));
  });
}

function close(server) {
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

test('renderiza um PDF A4 real e produz manifesto verificável', { timeout: 60_000 }, async () => {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 14mm; }
    body { margin: 0; font-family: Arial, sans-serif; }
    .compass-v2 { color: #14213d; }
    .page { min-height: 240mm; break-after: page; }
  </style></head><body><main class="compass-v2"><section class="page"><h1>Compass™</h1><p>Grupo CSV</p></section><section><h2>Conteúdo</h2><p>MedValor® · AxiaCare®</p></section></main></body></html>`;
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(html);
  });
  const address = await listen(server);
  const directory = await mkdtemp(path.join(os.tmpdir(), 'compass-v2-render-'));
  const output = path.join(directory, 'compass_008_2026.pdf');
  const manifestOutput = path.join(directory, 'release.json');
  const sourceFile = path.join(directory, 'source.md');
  await writeFile(sourceFile, '# Compass™\n', 'utf8');
  const edition = JSON.parse(await readFile(path.join(here, 'fixtures/native-008.json'), 'utf8'));

  try {
    const manifest = await renderPdf({
      url: `http://127.0.0.1:${address.port}/compass/`,
      output,
      edition,
      sourceFile,
      manifestOutput,
    });
    const bytes = await readFile(output);
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');
    assert.ok(bytes.length > 5_000);
    assert.equal(manifest.pdf.bytes, bytes.length);
    assert.match(manifest.pdf.sha256, /^[a-f0-9]{64}$/);
    const storedManifest = JSON.parse(await readFile(manifestOutput, 'utf8'));
    assert.deepEqual(storedManifest, manifest);

    const document = await getDocument({ data: new Uint8Array(bytes) }).promise;
    assert.equal(document.numPages, 2);

    const qualityDir = path.join(directory, 'quality');
    const report = await auditEdition({
      url: `http://127.0.0.1:${address.port}/compass/`,
      pdfPath: output,
      outputDir: qualityDir,
      requiredTexts: ['Compass™', 'Grupo CSV', 'MedValor®', 'AxiaCare®'],
    });
    assert.equal(report.ok, true);
    assert.equal(report.parity.ok, true);
    assert.equal(report.pdf.ok, true);
    assert.equal(report.accessibility.blocking, 0);
    await access(path.join(qualityDir, 'desktop.png'));
    await access(path.join(qualityDir, 'mobile.png'));
    await access(path.join(qualityDir, 'quality-report.json'));
  } finally {
    await close(server);
  }
});
