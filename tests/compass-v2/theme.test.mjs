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
  assert.match(component, /metadata\.value\.mode/);
  assert.match(component, /compass-v2--paged/);
  assert.match(component, /v-if="mode !== 'paged'"/);
});

test('não aplica nome acessível proibido a um contêiner genérico da marca', async () => {
  const component = await readOrNull(componentPath);
  assert.notEqual(component, null, 'CompassEdition.vue ainda não existe');
  assert.doesNotMatch(component, /<div[^>]*class="compass-cover__brand"[^>]*aria-label=/u);
  assert.match(component, /alt="Grupo CSV"/u);
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

test('contém tabelas de edições paginadas na viewport mobile', async () => {
  const css = await readOrNull(cssPath);
  assert.notEqual(css, null, 'compass-v2.css ainda não existe');
  assert.match(css, /@media\s*\(max-width:\s*768px\)[\s\S]*\.compass-v2--paged\s+\.compass-v2__content\s+table\s*\{[^}]*display:\s*block\s*!important[^}]*max-width:\s*100%\s*!important[^}]*overflow-x:\s*auto\s*!important/si);
});

test('mantém títulos longos dentro da capa mobile', async () => {
  const css = await readOrNull(cssPath);
  assert.notEqual(css, null, 'compass-v2.css ainda não existe');
  assert.match(css, /@media\s*\(max-width:\s*768px\)[\s\S]*\.compass-cover\s+h1\s*\{[^}]*max-width:\s*100%[^}]*min-width:\s*0[^}]*overflow-wrap:\s*break-word[^}]*word-break:\s*normal[^}]*hyphens:\s*auto/si);
  assert.doesNotMatch(css, /\.compass-cover\s+h1\s*\{[^}]*overflow-wrap:\s*anywhere/si);
});

test('mantém o crédito principal legível no rodapé do modo escuro', async () => {
  const css = await readOrNull(cssPath);
  assert.notEqual(css, null, 'compass-v2.css ainda não existe');
  assert.match(css, /\.dark\s+\.compass-v2__footer\s+strong\s*\{[^}]*color:\s*#(?:fff|ffffff)/si);
});

test('oculta no PDF flow o rodapé redundante cujos créditos já constam na capa', async () => {
  const css = await readOrNull(cssPath);
  assert.notEqual(css, null, 'compass-v2.css ainda não existe');
  const printCss = css.split(/@media\s+print/)[1] ?? '';
  assert.match(printCss, /\.compass-v2:not\(\.compass-v2--paged\)\s*>\s*\.compass-v2__footer\s*\{[^}]*display:\s*none\s*!important/si);
});

test('preserva títulos claros nas contracapas escuras durante a impressão', async () => {
  const css = await readOrNull(cssPath);
  assert.notEqual(css, null, 'compass-v2.css ainda não existe');
  const printCss = css.split(/@media\s+print/)[1] ?? '';
  assert.match(printCss, /\.compass-v2--paged\s+\.compass-page--back[^}]*h2[^}]*\{[^}]*color:\s*#fff\s*!important/si);
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
