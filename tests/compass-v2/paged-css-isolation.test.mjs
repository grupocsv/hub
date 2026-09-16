import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import postcss from 'postcss';

const editionCss = new URL('../../compass/edicoes/2026/008/edition.css', import.meta.url);

async function stylesheet() {
  return postcss.parse(await readFile(editionCss, 'utf8'));
}

test('CSS da edição paginada não estiliza elementos e classes fora do documento', async () => {
  const sheet = await stylesheet();
  const leakedSelectors = [];
  sheet.walkRules((rule) => {
    for (const selector of rule.selectors) {
      if (!/^(?:\.dark\s+)?(?:\.compass-v2--paged|\.compass-v2\.compass-v2--paged|:where\(\.compass-v2--paged\))(?:\s|$)/u.test(selector)) {
        leakedSelectors.push(selector);
      }
    }
  });
  assert.deepEqual(leakedSelectors, [], 'Regras editoriais não podem vazar para navbar, portais ou outras edições.');
});

test('escopo editorial preserva a especificidade de elementos e classes e a tipografia A4', async () => {
  const sheet = await stylesheet();
  const selectors = new Set();
  let paragraph;
  sheet.walkRules((rule) => {
    for (const selector of rule.selectors) selectors.add(selector);
    if (rule.selector === ':where(.compass-v2--paged) p') paragraph = rule;
  });
  for (const selector of ['p', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'table', 'thead th', 'tbody td', 'figure', 'figcaption', '.pad', '.toc', '.ld', '.assin']) {
    assert.ok(selectors.has(`:where(.compass-v2--paged) ${selector}`), `Escopo de especificidade zero ausente: ${selector}`);
  }
  assert.ok(paragraph);
  const declarations = Object.fromEntries(paragraph.nodes.map(({ prop, value }) => [prop, value]));
  assert.equal(declarations['text-indent'], '4.5mm');
  assert.equal(declarations['text-align'], 'justify');
  assert.equal(declarations.hyphens, 'auto');
});

test('paginação A4 sem margens aplica-se somente à edição 008', async () => {
  const sheet = await stylesheet();
  const pages = [];
  sheet.walkAtRules('page', (rule) => pages.push(rule));
  assert.ok(pages.length > 0);
  for (const rule of pages) {
    assert.equal(rule.params, 'compass-edition-008');
    const declarations = Object.fromEntries(rule.nodes.map(({ prop, value }) => [prop, value]));
    assert.equal(declarations.size, 'A4');
    assert.equal(declarations.margin, '0');
  }
  const owners = [];
  sheet.walkDecls('page', (declaration) => {
    assert.equal(declaration.value, 'compass-edition-008');
    owners.push(declaration.parent.selector);
  });
  assert.deepEqual(owners, [':where(.compass-v2--paged) .compass-page']);
});
