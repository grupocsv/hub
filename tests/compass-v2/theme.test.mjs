import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const componentPath = path.join(repoRoot, 'docs/.vitepress/theme/components/CompassEdition.vue');
const cssPath = path.join(repoRoot, 'docs/.vitepress/theme/compass-v2.css');
const themePath = path.join(repoRoot, 'docs/.vitepress/theme/index.ts');

async function readOrNull(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

test('possui um componente global que lê metadados da página e envolve o conteúdo semântico', async () => {
  const component = await readOrNull(componentPath);
  assert.notEqual(component, null, 'CompassEdition.vue ainda não existe');
  assert.match(component, /useData\(\)/);
  assert.match(component, /<slot\s*\/>/);
  assert.match(component, /Compass™ — um produto do Grupo CSV/);
  assert.match(component, /Responsabilidade editorial: MedValor®/);
  assert.match(component, /Elaboração: AxiaCare®/);
});

test('registra o componente e o CSS do Compass™ v2 no tema do Hub', async () => {
  const theme = await readFile(themePath, 'utf8');
  assert.match(theme, /CompassEdition/);
  assert.match(theme, /compass-v2\.css/);
  assert.match(theme, /app\.component\(['"]CompassEdition['"]/);
});

test('separa o comportamento responsivo da paginação A4', async () => {
  const css = await readOrNull(cssPath);
  assert.notEqual(css, null, 'compass-v2.css ainda não existe');
  assert.match(css, /\.compass-v2\s*\{/);
  assert.match(css, /@media\s*\(max-width:\s*768px\)/);
  assert.match(css, /@media\s+print/);
  assert.match(css, /@page\s*\{/);
  assert.match(css, /size:\s*A4/);
  assert.match(css, /break-inside:\s*avoid/);
});

test('não fixa largura A4 no modo de leitura web', async () => {
  const css = await readOrNull(cssPath);
  assert.notEqual(css, null, 'compass-v2.css ainda não existe');
  const beforePrint = css.split(/@media\s+print/)[0];
  assert.doesNotMatch(beforePrint, /width:\s*210mm/);
  assert.doesNotMatch(beforePrint, /min-width:\s*210mm/);
});

test('define tokens editoriais e componentes essenciais do layout 008', async () => {
  const css = await readOrNull(cssPath);
  assert.notEqual(css, null, 'compass-v2.css ainda não existe');
  for (const token of ['--compass-navy', '--compass-cyan', '--compass-cream', '--compass-orange']) {
    assert.ok(css.includes(token), `token ausente: ${token}`);
  }
  for (const className of ['compass-cover', 'compass-key-point', 'compass-timeline', 'compass-data-table', 'compass-callout']) {
    assert.ok(css.includes(`.${className}`), `componente ausente: ${className}`);
  }
});
