import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const runtimePath = path.join(repoRoot, 'scripts/compass-v2/pdf-runtime.sh');

test('usa runtime Playwright isolado e fixado por digest', async () => {
  const source = await readFile(runtimePath, 'utf8').catch(() => '');
  assert.match(source, /mcr\.microsoft\.com\/playwright:v1\.62\.0-noble@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07/);
  assert.match(source, /sudo -n docker run --rm/);
  assert.match(source, /PLAYWRIGHT_BROWSERS_PATH=\/ms-playwright/);
});

test('não instala bibliotecas nem altera o sistema operacional da VPS', async () => {
  const source = await readFile(runtimePath, 'utf8').catch(() => '');
  assert.doesNotMatch(source, /apt-get|install-deps|dnf|yum|usermod|groupadd|chmod[^\n]*docker\.sock/);
  assert.match(source, /sudo -n docker run --rm/);
});

test('expõe o runtime pelo package.json', async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.match(packageJson.scripts['compass:pdf:runtime'] ?? '', /pdf-runtime\.sh/);
});
