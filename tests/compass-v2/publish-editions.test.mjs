import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const publisherPath = path.join(repoRoot, 'scripts/compass-v2/publish-editions.mjs');

async function loadPublisher() {
  try {
    return await import(pathToFileURL(publisherPath).href);
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

test('publica uma edição v2 completa a partir da árvore canônica', async () => {
  const publisher = await loadPublisher();
  assert.notEqual(publisher, null, 'publish-editions.mjs ainda não existe');
  const root = await mkdtemp(path.join(os.tmpdir(), 'compass-publish-'));
  const source = path.join(root, 'source');
  const output = path.join(root, 'output');
  const edition = path.join(source, '008');
  await mkdir(path.join(edition, 'assets'), { recursive: true });
  await writeFile(path.join(edition, 'metadata.yml'), 'schemaVersion: 2\nid: 008-2026\nnumber: 8\nyear: 2026\nslug: "008"\nengine:\n  name: compass-v2\n', 'utf8');
  await writeFile(path.join(edition, 'compass.md'), '# Compass 008\n', 'utf8');
  await writeFile(path.join(edition, 'edition.css'), '.edition{}\n', 'utf8');
  await writeFile(path.join(edition, 'Compass008Content.vue'), '<template><section /></template>\n', 'utf8');
  await writeFile(path.join(edition, 'assets', 'logo.svg'), '<svg/>\n', 'utf8');

  const result = await publisher.publishEditions({ sourceRoot: source, outputRoot: output });
  assert.equal(result.published, 1);
  assert.equal(await readFile(path.join(output, '008', 'compass.md'), 'utf8'), '# Compass 008\n');
  assert.equal(await readFile(path.join(output, '008', 'assets', 'logo.svg'), 'utf8'), '<svg/>\n');
  assert.match(await readFile(path.join(output, '008', 'Compass008Content.vue'), 'utf8'), /<section/);
  const marker = JSON.parse(await readFile(path.join(output, '008', '.compass-source.json'), 'utf8'));
  assert.equal(marker.id, '008-2026');
  assert.match(marker.sourceHash, /^[a-f0-9]{64}$/);
});

test('ignora fontes legadas ainda não migradas ao v2', async () => {
  const publisher = await loadPublisher();
  assert.notEqual(publisher, null, 'publish-editions.mjs ainda não existe');
  const root = await mkdtemp(path.join(os.tmpdir(), 'compass-publish-legacy-'));
  const source = path.join(root, 'source');
  const output = path.join(root, 'output');
  const edition = path.join(source, '007');
  await mkdir(edition, { recursive: true });
  await writeFile(path.join(edition, 'metadata.yml'), 'edition: 007/2026\ntitle: Legado\n', 'utf8');
  const result = await publisher.publishEditions({ sourceRoot: source, outputRoot: output });
  assert.deepEqual(result, { published: 0, skipped: ['007'] });
});

test('o build do Hub executa a publicação canônica antes do catálogo e do VitePress', async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.match(packageJson.scripts['compass:publish'] ?? '', /publish-editions\.mjs/);
  assert.match(packageJson.scripts['docs:build'] ?? '', /compass:publish.*compass:catalog.*vitepress build docs/);
});
