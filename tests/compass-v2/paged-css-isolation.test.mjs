import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import postcss from 'postcss';

// Edições paginadas e a forma exigida para o seletor dono da declaração `page:`.
// A 008 (primeira edição paginada) usa o escopo global do motor; a 009 em diante usa escopo próprio da edição.
const PAGED_EDITIONS = [
  { slug: '008', pageOwners: [':where(.compass-v2--paged) .compass-page'] },
  { slug: '009', pageOwners: [':where(.compass-v2--paged) .compass-ed-009 .compass-page'] },
];

async function stylesheet(slug) {
  const editionCss = new URL(`../../compass/edicoes/2026/${slug}/edition.css`, import.meta.url);
  return postcss.parse(await readFile(editionCss, 'utf8'));
}

for (const { slug, pageOwners } of PAGED_EDITIONS) {
  test(`CSS da edição paginada ${slug} não estiliza elementos e classes fora do documento`, async () => {
    const sheet = await stylesheet(slug);
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

  test(`escopo editorial da edição ${slug} preserva a especificidade de elementos e classes e a tipografia A4`, async () => {
    const sheet = await stylesheet(slug);
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

  test(`paginação A4 sem margens aplica-se somente à edição ${slug}`, async () => {
    const sheet = await stylesheet(slug);
    const pages = [];
    sheet.walkAtRules('page', (rule) => pages.push(rule));
    assert.ok(pages.length > 0);
    for (const rule of pages) {
      assert.equal(rule.params, `compass-edition-${slug}`);
      const declarations = Object.fromEntries(rule.nodes.map(({ prop, value }) => [prop, value]));
      assert.equal(declarations.size, 'A4');
      assert.equal(declarations.margin, '0');
    }
    const owners = [];
    sheet.walkDecls('page', (declaration) => {
      assert.equal(declaration.value, `compass-edition-${slug}`);
      owners.push(declaration.parent.selector);
    });
    assert.deepEqual(owners, pageOwners);
  });
}

test('edições paginadas a partir da 009 isolam seu CSS por escopo próprio de edição', async () => {
  const sheet = await stylesheet('009');
  const unscoped = [];
  sheet.walkRules((rule) => {
    for (const selector of rule.selectors) {
      if (selector.startsWith(':where(')) continue; // contrato de tipografia do motor, especificidade zero
      if (selector === '.compass-v2--paged') continue; // tokens da edição
      if (/^\.compass-v2--paged\s+\.compass-v2__content(?:\s*>\s*:first-child)?$/u.test(selector)) continue; // reset do contêiner do motor
      if (!/^(?:\.dark\s+)?\.compass-v2--paged\s+\.compass-v2__content\s+\.compass-ed-009(?:\s|$)/u.test(selector)) {
        unscoped.push(selector);
      }
    }
  });
  assert.deepEqual(unscoped, [], 'Toda regra da 009 deve passar pelo invólucro .compass-ed-009 para não alcançar outras edições paginadas.');
});
