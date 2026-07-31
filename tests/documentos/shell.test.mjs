import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TEMPLATE_PATH = join(REPO_ROOT, 'scripts', 'documentos-shell.template.html');
const GENERATED_PATH = join(REPO_ROOT, 'docs', 'public', 'documentos', 'index.html');
const CSS_PATH = join(REPO_ROOT, 'docs', 'public', 'documentos', 'assets', 'documentos.css');
const APP_PATH = join(REPO_ROOT, 'docs', 'public', 'documentos', 'assets', 'app.js');

async function sources() {
  const [template, generated, css, app] = await Promise.all([
    readFile(TEMPLATE_PATH, 'utf8'),
    readFile(GENERATED_PATH, 'utf8'),
    readFile(CSS_PATH, 'utf8'),
    readFile(APP_PATH, 'utf8'),
  ]);
  return { template, generated, css, app };
}

test('expõe landmarks, salto de conteúdo e hierarquia única de título', async () => {
  const { template, generated } = await sources();

  assert.match(template, /<a[^>]+class="skip-link"[^>]+href="#docs-main"/);
  assert.match(template, /<header[^>]+class="docs-topbar"/);
  assert.match(template, /<nav[^>]+aria-label="Navegação de Documentos"/);
  assert.match(template, /<main[^>]+id="docs-main"/);
  assert.match(template, /<footer[^>]+class="docs-footer"/);
  assert.match(template, /<title>Central de Documentos \| Grupo CSV<\/title>/);
  assert.match(template, /class="docs-brand__product">Central de Documentos<\/span>/);
  assert.match(template, /<h1 id="docs-title">Central de Documentos<\/h1>/);
  assert.match(template, /id="docs-tenant-label" hidden/);
  assert.match(generated, /<title>Central de Documentos \| Grupo CSV<\/title>/);
  assert.match(generated, /class="docs-brand__product">Central de Documentos<\/span>/);
  assert.match(generated, /<h1 id="docs-title">Central de Documentos<\/h1>/);
  assert.match(generated, /id="docs-tenant-label" hidden/);
  assert.equal((template.match(/<h1\b/g) || []).length, 1);
  assert.doesNotMatch(template, /<div[^>]+onclick=/i);
});

test('oferece navegação, busca, upload e região de estado com rótulos explícitos', async () => {
  const { template } = await sources();

  for (const label of ['Documentos', 'Coleções', 'Favoritos', 'Recentes']) {
    assert.match(template, new RegExp(`>${label}<`));
  }
  assert.match(template, /<label[^>]+for="docs-search"[^>]*>Buscar Documentos<\/label>/);
  assert.match(template, /<input[^>]+id="docs-search"[^>]+type="search"/);
  assert.match(template, /<button[^>]+id="docs-upload"[^>]*>[^<]*Enviar Documento/);
  assert.match(template, /<button[^>]+id="docs-upload"[^>]+hidden[^>]+disabled|<button[^>]+id="docs-upload"[^>]+disabled[^>]+hidden/);
  assert.match(template, /data-view="favoritos"[^>]+hidden[^>]+disabled|data-view="favoritos"[^>]+disabled[^>]+hidden/);
  assert.match(template, /id="docs-status"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(template, /id="docs-content"/);
});

test('inclui viewer responsivo com região desktop e controles para modal mobile', async () => {
  const { template, css } = await sources();

  assert.match(template, /id="docs-viewer"[^>]+role="region"/);
  assert.doesNotMatch(template, /id="docs-viewer"[^>]+aria-modal="true"/);
  assert.match(template, /aria-labelledby="docs-viewer-title"/);
  assert.match(template, /id="docs-viewer-status"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(template, /id="docs-viewer-canvas"[^>]+aria-label="Página do PDF"/);
  assert.match(template, /data-action="viewer-previous"/);
  assert.match(template, /data-action="viewer-next"/);
  assert.match(template, /data-action="viewer-download"/);
  assert.match(template, /data-action="close-viewer"/);
  assert.match(css, /\.docs-viewer\s*\{/);
  assert.match(css, /\.docs-viewer__panel/);
  assert.match(css, /\.docs-viewer__canvas/);
  assert.match(css, /body\.is-viewer-open\s*\{[^}]*padding-inline-end:\s*var\(--docs-viewer-width\)/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /html\.is-viewer-modal-open[^}]*overflow:\s*hidden/);
  assert.match(css, /@media\s*\(max-width:\s*48rem\)[^]*\.docs-viewer__panel/);
});

test('mantém scripts externos, configuração antes da aplicação e nenhum handler inline', async () => {
  const { template, generated } = await sources();

  const runtimePosition = template.indexOf('assets/runtime-config.js');
  const appPosition = template.indexOf('assets/app.js');
  assert.ok(runtimePosition >= 0);
  assert.ok(appPosition > runtimePosition);
  assert.match(template, /<link[^>]+href="\.\/assets\/documentos\.css"/);
  assert.match(template, /<script[^>]+type="module"[^>]+src="\.\/assets\/app\.js"/);
  assert.doesNotMatch(template, /<script(?:\s[^>]*)?>\s*[^<\s]/i);
  assert.doesNotMatch(template, /\son(?:click|change|submit|load|error)=/i);
  assert.doesNotMatch(generated, /__DOCUMENTOS_(?:CSP|RUNTIME_INTEGRITY)__/);
});

test('aplica os tokens institucionais e requisitos mínimos de interação', async () => {
  const { css } = await sources();

  assert.match(css, /--csv-blue:\s*#196396/i);
  assert.match(css, /--csv-green:\s*#2dbf7f/i);
  assert.match(css, /--csv-dark:\s*#1b1e24/i);
  assert.match(css, /--font-body:[^;]*Inter/i);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-(?:block-size|height):\s*44px/);
  assert.match(css, /@media\s*\(max-width:\s*48rem\)/);
  assert.match(css, /@media\s*\(max-width:\s*22rem\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /overflow-x:\s*(?:clip|hidden)/);
  assert.match(css, /min-width:\s*0/);
});

test('inclui estados visuais de carregamento, indisponibilidade, vazio e erro', async () => {
  const { template, css, app } = await sources();

  assert.match(template, /data-state="unavailable"/);
  for (const state of ['loading', 'unavailable', 'empty', 'error']) {
    assert.match(css, new RegExp(`\\.is-${state}\\b`));
    assert.match(app, new RegExp(`['\"]${state}['\"]`));
  }
  assert.match(css, /\.skeleton/);
  assert.match(css, /\.docs-filters__form/);
  assert.match(css, /\.docs-card-grid/);
  assert.match(css, /\.docs-dialog\s*\{/);
  assert.match(css, /\.docs-dialog__panel/);
  assert.match(app, /querySelectorAll\(selector\)/);
  assert.match(app, /['"]\[data-view\]['"]/);
  assert.match(app, /if\s*\(button\.disabled\)\s*return/);
  assert.match(app, /normalized\s*===\s*['"]loading['"][^]*status\.hidden\s*=\s*false/);
});

test('falha fechado sem configuração válida e não inicia rede quando desabilitado', async () => {
  const moduleUrl = `${pathToFileURL(APP_PATH).href}?test=${Date.now()}`;
  const { deriveStartupState, shouldStartNetwork } = await import(moduleUrl);

  assert.equal(deriveStartupState(undefined), 'unavailable');
  assert.equal(deriveStartupState({ schemaVersion: 1, enabled: false }), 'unavailable');
  assert.equal(deriveStartupState({ schemaVersion: 1, enabled: true, apiBaseUrl: null }), 'unavailable');
  assert.equal(
    deriveStartupState({
      schemaVersion: 1,
      enabled: true,
      apiBaseUrl: 'https://documentos-api.grupocsv.com',
      enabledPortals: [],
      features: {},
    }),
    'unavailable',
  );
  assert.equal(
    deriveStartupState({
      schemaVersion: 1,
      enabled: true,
      apiBaseUrl: 'https://documentos-api.grupocsv.com',
      enabledPortals: ['unimed'],
      features: {},
    }),
    'loading',
  );
  assert.equal(shouldStartNetwork({ schemaVersion: 1, enabled: false }), false);
  assert.equal(shouldStartNetwork(undefined), false);
});
