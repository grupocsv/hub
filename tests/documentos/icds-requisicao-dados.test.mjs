import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const URL = 'https://rd-icds.axcare.app/';
const TITLE = 'Requisição de Dados (RD)';

async function read(relativePath) {
  return readFile(join(ROOT, relativePath), 'utf8');
}

test('Requisição de Dados integra o catálogo exibido na landing page e no portal ICDS', async () => {
  const extras = JSON.parse(await read('icds/extras.json'));
  const output = JSON.parse(await read('icds/tools.json'));
  const homepage = await read('docs/index.md');
  const portal = await read('docs/icds/index.md');

  const sourceEntry = extras.find((entry) => entry.href.replace(/\/$/, '') === URL.replace(/\/$/, ''));
  assert.ok(sourceEntry, 'a fonte declarativa deve conter Requisição de Dados');
  assert.equal(sourceEntry.title, TITLE);

  const outputEntry = output.tools.find((entry) => entry.file?.replace(/\/$/, '') === URL.replace(/\/$/, ''));
  assert.ok(outputEntry, 'tools.json deve publicar Requisição de Dados');
  assert.deepEqual(outputEntry, {
    file: 'https://rd-icds.axcare.app',
    title: TITLE,
    created: sourceEntry.created,
    lastModified: sourceEntry.lastModified,
    external: true,
  });
  assert.equal(output.totalTools, 4);

  assert.match(homepage, /fetch\(portal\.basePath \+ 'tools\.json'\)/);
  assert.match(portal, /fetch\('\/icds\/tools\.json'\)/);
  assert.match(portal, /tool\.managedBy !== 'hub-documentos'/);
  assert.match(portal, /tool\.file\.startsWith\('\/documentos\/'\)/);
});
