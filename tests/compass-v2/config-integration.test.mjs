import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const configPath = path.join(repoRoot, 'docs/.vitepress/config.mts');

test('a sidebar Compass™ deriva suas edições do catálogo gerado', async () => {
  const config = await readFile(configPath, 'utf8');
  assert.match(config, /import\s+compassCatalog\s+from\s+['"]\.\.\/compass\/catalog\.json['"]/);
  assert.match(config, /compassCatalog\.editions\.map/);
  assert.doesNotMatch(config, /\{\s*text:\s*['"]001\s+—\s+Metas ACO/);
});

test('os títulos da sidebar são resumidos por função determinística', async () => {
  const config = await readFile(configPath, 'utf8');
  assert.match(config, /function\s+compassSidebarLabel/);
  assert.match(config, /edition\.slug/);
  assert.match(config, /edition\.title/);
});
