import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const moduleUrl = pathToFileURL(path.join(repoRoot, 'scripts/compass-v2/catalog.mjs')).href;

async function loadCatalogModule() {
  try {
    return await import(moduleUrl);
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

async function tempRoot() {
  return mkdtemp(path.join(os.tmpdir(), 'compass-v2-catalog-'));
}

test('expõe o gerador de catálogo do Compass™ v2', async () => {
  const catalog = await loadCatalogModule();
  assert.notEqual(catalog, null, 'scripts/compass-v2/catalog.mjs ainda não existe');
  assert.equal(typeof catalog.parseMetadataText, 'function');
  assert.equal(typeof catalog.buildCatalog, 'function');
  assert.equal(typeof catalog.writeCatalog, 'function');
});

test('interpreta metadados YAML históricos sem alterar acentos ou marcas', async () => {
  const catalog = await loadCatalogModule();
  assert.notEqual(catalog, null, 'gerador ausente');
  const parsed = catalog.parseMetadataText(
    'id: "001/2026"\ntitulo: "Saúde baseada em valor"\nano: 2026\nedicao: 1\ntags:\n  - "VBHC"\n',
    '.yml',
  );
  assert.equal(parsed.titulo, 'Saúde baseada em valor');
  assert.deepEqual(parsed.tags, ['VBHC']);
});

test('varre diretórios, normaliza versões e ordena edições da mais recente para a mais antiga', async () => {
  const catalog = await loadCatalogModule();
  assert.notEqual(catalog, null, 'gerador ausente');
  const root = await tempRoot();
  for (const [slug, fixture] of [['001', 'legacy-001.json'], ['007', 'legacy-007.json'], ['008', 'native-008.json']]) {
    const directory = path.join(root, slug);
    await mkdir(directory, { recursive: true });
    const source = await readFile(path.join(here, 'fixtures', fixture), 'utf8');
    await writeFile(path.join(directory, 'metadata.json'), source);
  }
  const result = await catalog.buildCatalog({ sourceRoot: root });
  assert.deepEqual(result.editions.map((edition) => edition.slug), ['008', '007', '001']);
  assert.match(result.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(result.sourceHash, /^[a-f0-9]{64}$/);
});

test('gera um arquivo JSON estável, com newline final e sem caminhos absolutos', async () => {
  const catalog = await loadCatalogModule();
  assert.notEqual(catalog, null, 'gerador ausente');
  const root = await tempRoot();
  const directory = path.join(root, '008');
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'metadata.json'),
    await readFile(path.join(here, 'fixtures/native-008.json'), 'utf8'),
  );
  const output = path.join(root, 'catalog.json');
  await catalog.writeCatalog({ sourceRoot: root, output });
  const serialized = await readFile(output, 'utf8');
  assert.ok(serialized.endsWith('\n'));
  assert.ok(!serialized.includes(root));
  assert.equal(JSON.parse(serialized).editions[0].slug, '008');
});

test('rejeita duas fontes com o mesmo número e ano', async () => {
  const catalog = await loadCatalogModule();
  assert.notEqual(catalog, null, 'gerador ausente');
  const root = await tempRoot();
  for (const directoryName of ['a', 'b']) {
    const directory = path.join(root, directoryName);
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, 'metadata.json'),
      await readFile(path.join(here, 'fixtures/native-008.json'), 'utf8'),
    );
  }
  await assert.rejects(() => catalog.buildCatalog({ sourceRoot: root }), /duplicad/i);
});

test('preserva o arquivo quando as fontes não mudam', async () => {
  const catalog = await loadCatalogModule();
  assert.notEqual(catalog, null, 'gerador ausente');
  const root = await tempRoot();
  const directory = path.join(root, '008');
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'metadata.json'),
    await readFile(path.join(here, 'fixtures/native-008.json'), 'utf8'),
  );
  const output = path.join(root, 'catalog.json');
  await catalog.writeCatalog({ sourceRoot: root, output });
  const first = await readFile(output, 'utf8');
  await new Promise((resolve) => setTimeout(resolve, 10));
  await catalog.writeCatalog({ sourceRoot: root, output });
  const second = await readFile(output, 'utf8');
  assert.equal(second, first);
});
