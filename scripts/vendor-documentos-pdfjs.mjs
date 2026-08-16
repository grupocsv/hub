import { createHash, randomUUID } from 'node:crypto';
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PDFJS_VERSION = '6.2.108';
const FILES = Object.freeze([
  'LICENSE',
  'build/pdf.min.mjs',
  'build/pdf.worker.min.mjs',
]);
const DIRECTORIES = Object.freeze([
  'cmaps',
  'iccs',
  'standard_fonts',
  'wasm',
]);

function fail(message) {
  throw new Error(message);
}

function rootFromArgs(argv) {
  if (argv.length === 0) return process.cwd();
  if (argv.length === 2 && argv[0] === '--root' && argv[1]) {
    return resolve(argv[1]);
  }
  fail('Uso: node scripts/vendor-documentos-pdfjs.mjs [--root <diretório>].');
}

function assertWithin(parent, child, description) {
  const normalizedParent = resolve(parent);
  const normalizedChild = resolve(child);
  const childRelative = relative(normalizedParent, normalizedChild);
  if (
    childRelative === '' ||
    childRelative === '..' ||
    childRelative.startsWith(`..${sep}`) ||
    resolve(normalizedParent, childRelative) !== normalizedChild
  ) {
    fail(`${description} fora do diretório permitido.`);
  }
}

async function readJson(path, description) {
  let source;
  try {
    source = await readFile(path, 'utf8');
  } catch {
    fail(`${description} ausente.`);
  }
  try {
    return JSON.parse(source);
  } catch {
    fail(`${description} inválido.`);
  }
}

async function assertReadable(path, description) {
  try {
    await access(path, fsConstants.R_OK);
  } catch {
    fail(`${description} ausente: ${path}.`);
  }
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) paths.push(...await listFiles(root, absolute));
    else if (entry.isFile()) paths.push(relative(root, absolute).split(sep).join('/'));
    else fail(`Entrada não regular no vendor PDF.js: ${absolute}.`);
  }
  return paths.sort((left, right) => left.localeCompare(right, 'en'));
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function buildManifest(stage) {
  const files = await listFiles(stage);
  const entries = [];
  for (const path of files) {
    entries.push(Object.freeze({
      path,
      sha256: await sha256(join(stage, ...path.split('/'))),
    }));
  }
  return Object.freeze({
    schemaVersion: 1,
    package: 'pdfjs-dist',
    version: PDFJS_VERSION,
    files: entries,
  });
}

async function validatePackage(root, source) {
  const [packageJson, packageLock] = await Promise.all([
    readJson(join(source, 'package.json'), 'Pacote pdfjs-dist'),
    readJson(join(root, 'package-lock.json'), 'Lockfile do Hub'),
  ]);
  const locked = packageLock?.packages?.['node_modules/pdfjs-dist'];
  if (
    packageJson.name !== 'pdfjs-dist' ||
    packageJson.version !== PDFJS_VERSION ||
    packageJson.license !== 'Apache-2.0' ||
    locked?.version !== PDFJS_VERSION ||
    typeof locked?.integrity !== 'string' ||
    packageLock?.packages?.['']?.devDependencies?.['pdfjs-dist'] !== PDFJS_VERSION
  ) {
    fail('Versão, licença ou lockfile do PDF.js divergem do contrato fixado.');
  }
}

async function copyDistribution(source, stage) {
  for (const sourcePath of FILES) {
    const from = join(source, ...sourcePath.split('/'));
    const to = join(stage, ...sourcePath.split('/'));
    await assertReadable(from, `Artefato PDF.js ${sourcePath}`);
    await mkdir(dirname(to), { recursive: true });
    await cp(from, to, { force: true });
  }
  for (const sourcePath of DIRECTORIES) {
    const from = join(source, sourcePath);
    const to = join(stage, sourcePath);
    await assertReadable(from, `Diretório PDF.js ${sourcePath}`);
    await cp(from, to, { recursive: true, force: true });
  }
}

async function promote(stage, target, parent) {
  const backup = join(parent, `.pdfjs-backup-${randomUUID()}`);
  assertWithin(parent, target, 'Destino do vendor PDF.js');
  assertWithin(parent, backup, 'Backup do vendor PDF.js');
  let hadPrevious = false;
  try {
    await access(target, fsConstants.F_OK);
    hadPrevious = true;
  } catch {
    hadPrevious = false;
  }

  if (hadPrevious) await rename(target, backup);
  try {
    await rename(stage, target);
  } catch (error) {
    if (hadPrevious) await rename(backup, target);
    throw error;
  }
  if (hadPrevious) await rm(backup, { recursive: true, force: true });
}

export async function vendorDocumentosPdfJs(root) {
  const source = join(root, 'node_modules', 'pdfjs-dist');
  const parent = join(root, 'docs', 'public', 'documentos', 'vendor');
  const target = join(parent, 'pdfjs');
  await validatePackage(root, source);
  await mkdir(parent, { recursive: true });
  const stage = await mkdtemp(join(parent, '.pdfjs-stage-'));
  assertWithin(parent, stage, 'Staging do vendor PDF.js');

  try {
    await copyDistribution(source, stage);
    const manifest = await buildManifest(stage);
    await writeFile(
      join(stage, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
    await promote(stage, target, parent);
    return Object.freeze({ target, files: manifest.files.length + 1 });
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
}

const executedDirectly =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executedDirectly) {
  vendorDocumentosPdfJs(rootFromArgs(process.argv.slice(2)))
    .then(({ files }) => {
      process.stdout.write(`Hub Documentos: PDF.js ${PDFJS_VERSION} validado (${files} arquivos).\n`);
    })
    .catch((error) => {
      process.stderr.write(`Erro ao preparar PDF.js: ${error.message}\n`);
      process.exitCode = 1;
    });
}
