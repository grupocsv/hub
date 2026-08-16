import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HUB_ROOT = path.resolve(HERE, '../..');
const VENDOR_ROOT = path.join(
  HUB_ROOT,
  'docs',
  'public',
  'documentos',
  'vendor',
  'pdfjs',
);

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, absolute));
    else if (entry.isFile()) {
      files.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
  return files.sort((left, right) => left.localeCompare(right, 'en'));
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

test('vendor PDF.js corresponde integralmente ao pacote fixado e ao manifesto', async () => {
  const [packageJson, packageLock, manifest] = await Promise.all([
    readFile(path.join(HUB_ROOT, 'node_modules/pdfjs-dist/package.json'), 'utf8').then(JSON.parse),
    readFile(path.join(HUB_ROOT, 'package-lock.json'), 'utf8').then(JSON.parse),
    readFile(path.join(VENDOR_ROOT, 'manifest.json'), 'utf8').then(JSON.parse),
  ]);

  assert.equal(packageJson.version, '6.2.108');
  assert.equal(packageJson.license, 'Apache-2.0');
  assert.equal(
    packageLock.packages['node_modules/pdfjs-dist'].version,
    '6.2.108',
  );
  assert.deepEqual(
    {
      schemaVersion: manifest.schemaVersion,
      package: manifest.package,
      version: manifest.version,
    },
    {
      schemaVersion: 1,
      package: 'pdfjs-dist',
      version: '6.2.108',
    },
  );

  const actualFiles = (await listFiles(VENDOR_ROOT)).filter(
    (filePath) => filePath !== 'manifest.json',
  );
  assert.deepEqual(
    actualFiles,
    manifest.files.map(({ path: filePath }) => filePath),
  );
  for (const entry of manifest.files) {
    assert.match(entry.sha256, /^[a-f0-9]{64}$/u);
    assert.equal(
      await sha256(path.join(VENDOR_ROOT, ...entry.path.split('/'))),
      entry.sha256,
      entry.path,
    );
  }
});

test('módulo PDF.js local declara o transporte e o carregador esperados', async () => {
  const source = await readFile(
    path.join(VENDOR_ROOT, 'build', 'pdf.min.mjs'),
    'utf8',
  );

  assert.match(source, /PDFDataRangeTransport/);
  assert.match(source, /GlobalWorkerOptions/);
  assert.match(source, /getDocument/);
  assert.match(source, /export\{/);
});

test('viewer aponta somente para recursos PDF.js locais versionados', async () => {
  const source = await readFile(
    path.join(HUB_ROOT, 'docs/public/documentos/assets/viewer.js'),
    'utf8',
  );

  assert.match(source, /vendor\/pdfjs\/build\/pdf\.min\.mjs/);
  assert.match(source, /vendor\/pdfjs\/build\/pdf\.worker\.min\.mjs/);
  assert.match(source, /cMapUrl:\s*new URL\(['"]cmaps\/['"]/);
  assert.match(source, /iccUrl:\s*new URL\(['"]iccs\/['"]/);
  assert.match(source, /standardFontDataUrl:\s*new URL\(['"]standard_fonts\/['"]/);
  assert.match(source, /wasmUrl:\s*new URL\(['"]wasm\/['"]/);
  assert.match(source, /isEvalSupported:\s*false/);
  assert.doesNotMatch(source, /https?:\/\/[^'"]*pdf/);
});

test('verificador de publicação confere integralmente o manifesto PDF.js', () => {
  const result = spawnSync(
    process.execPath,
    [
      path.join(HUB_ROOT, 'scripts', 'verify-documentos-pdfjs-manifest.mjs'),
      path.join(HUB_ROOT, 'docs', 'public'),
    ],
    {
      cwd: HUB_ROOT,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /203 arquivos, versão 6\.2\.108/u);
});
