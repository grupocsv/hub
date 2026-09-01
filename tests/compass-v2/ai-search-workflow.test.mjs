import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const workflowPath = path.join(repoRoot, '.github/workflows/sync-r2-ai-search.yml');

test('dispara um job real de sincronização no endpoint atual do AI Search', async () => {
  const source = await readFile(workflowPath, 'utf8').catch(() => '');
  assert.match(source, /--request POST/);
  assert.match(source, /ai-search\/instances\/hub-csv/);
  assert.match(source, /\$\{BASE_URL\}\/jobs/);
  assert.doesNotMatch(source, /-X PUT[\s\S]*\/ai-search\/instances\/hub-csv["\\]/);
  assert.doesNotMatch(source, /\/autorag\/hub-csv\/reindex/);
});

test('acompanha o job até ended_at e falha diante de end_reason', async () => {
  const source = await readFile(workflowPath, 'utf8').catch(() => '');
  assert.match(source, /\$\{BASE_URL\}\/jobs\/\$\{JOB_ID\}/);
  assert.match(source, /ended_at/);
  assert.match(source, /end_reason/);
  assert.match(source, /exit 1/);
});

test('aguarda a estabilização assíncrona das estatísticas após o job', async () => {
  const source = await readFile(workflowPath, 'utf8').catch(() => '');
  assert.match(source, /for STATS_ATTEMPT in \$\(seq 1 90\)/);
  assert.match(source, /STATS_READY=true/);
  assert.match(source, /Timeout ao aguardar a estabilização das estatísticas do AI Search/);
});

test('usa segredo dedicado e nunca imprime a resposta autenticada completa', async () => {
  const source = await readFile(workflowPath, 'utf8').catch(() => '');
  assert.match(source, /secrets\.CF_AI_SEARCH_TOKEN/);
  assert.doesNotMatch(source, /echo\s+["']?\$\{?RESPONSE/);
  assert.doesNotMatch(source, /set\s+-x/);
});
