import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));

test('expõe comandos oficiais do Compass™ v2', () => {
  assert.match(packageJson.scripts['compass:catalog'] ?? '', /scripts\/compass-v2\/catalog\.mjs/);
  assert.match(packageJson.scripts['compass:test'] ?? '', /tests\/compass-v2/);
  assert.match(packageJson.scripts['compass:build'] ?? '', /compass:catalog/);
  assert.match(packageJson.scripts['compass:build'] ?? '', /docs:build/);
  assert.match(packageJson.scripts['compass:pdf'] ?? '', /render-pdf\.mjs/);
  assert.match(packageJson.scripts['compass:quality'] ?? '', /quality-gates\.mjs/);
  assert.match(packageJson.scripts['compass:test:pdf'] ?? '', /compass:pdf:runtime/);
  assert.match(packageJson.scripts['compass:verify'] ?? '', /compass:test:pdf/);
});

test('o build geral atualiza o catálogo antes do VitePress', () => {
  assert.match(packageJson.scripts['docs:build'] ?? '', /compass:catalog/);
  assert.match(packageJson.scripts['docs:build'] ?? '', /vitepress build docs/);
});
