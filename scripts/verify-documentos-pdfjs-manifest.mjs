import { createHash } from 'node:crypto';
import {
  lstat,
  readFile,
  readdir,
  realpath,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function fail(message) {
  throw new Error(message);
}

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    const metadata = await lstat(absolute);
    if (metadata.isSymbolicLink()) {
      fail(`Link simbólico não permitido no vendor PDF.js: ${absolute}`);
    }
    if (metadata.isDirectory()) {
      files.push(...await listFiles(root, absolute));
    } else if (metadata.isFile()) {
      files.push(path.relative(root, absolute).split(path.sep).join('/'));
    } else {
      fail(`Entrada não regular no vendor PDF.js: ${absolute}`);
    }
  }
  return files.sort((left, right) => left.localeCompare(right, 'en'));
}

function validateEntry(entry, seen) {
  if (
    !plainObject(entry) ||
    Object.keys(entry).sort().join(',') !== 'path,sha256' ||
    typeof entry.path !== 'string' ||
    entry.path.length === 0 ||
    entry.path.includes('\\') ||
    entry.path.startsWith('/') ||
    entry.path.split('/').some((segment) => segment === '' || segment === '.' || segment === '..') ||
    typeof entry.sha256 !== 'string' ||
    !/^[a-f0-9]{64}$/u.test(entry.sha256) ||
    seen.has(entry.path)
  ) {
    fail('Entrada inválida ou duplicada no manifesto PDF.js.');
  }
  seen.add(entry.path);
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function main() {
  if (process.argv.length !== 3) {
    fail('Uso: node scripts/verify-documentos-pdfjs-manifest.mjs <raiz-publicada>');
  }
  const publicRoot = path.resolve(process.argv[2]);
  const vendorRoot = path.join(publicRoot, 'documentos', 'vendor', 'pdfjs');
  const [publicRootReal, vendorRootReal] = await Promise.all([
    realpath(publicRoot),
    realpath(vendorRoot),
  ]);
  const relativeVendor = path.relative(publicRootReal, vendorRootReal);
  if (
    relativeVendor.startsWith('..') ||
    path.isAbsolute(relativeVendor)
  ) {
    fail('Vendor PDF.js está fora da raiz publicada.');
  }

  const manifestPath = path.join(vendorRootReal, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (
    !plainObject(manifest) ||
    manifest.schemaVersion !== 1 ||
    manifest.package !== 'pdfjs-dist' ||
    manifest.version !== '6.2.108' ||
    !Array.isArray(manifest.files)
  ) {
    fail('Manifesto PDF.js publicado é inválido.');
  }

  const seen = new Set();
  for (const entry of manifest.files) validateEntry(entry, seen);
  const actualFiles = (await listFiles(vendorRootReal)).filter(
    (filePath) => filePath !== 'manifest.json',
  );
  const expectedFiles = manifest.files.map((entry) => entry.path);
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    fail('Conjunto publicado do PDF.js diverge do manifesto.');
  }

  for (const entry of manifest.files) {
    const candidate = path.resolve(vendorRootReal, ...entry.path.split('/'));
    const relative = path.relative(vendorRootReal, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      fail(`Caminho fora do vendor PDF.js: ${entry.path}`);
    }
    if ((await sha256(candidate)) !== entry.sha256) {
      fail(`SHA-256 divergente no vendor PDF.js: ${entry.path}`);
    }
  }

  process.stdout.write(
    `Vendor PDF.js publicado validado: ${manifest.files.length} arquivos, versão ${manifest.version}.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
