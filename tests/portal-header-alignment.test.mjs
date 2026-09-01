import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const portals = [
  {
    name: 'Unimed GV',
    file: new URL('../docs/unimed/index.md', import.meta.url),
    header: '.page-header',
    logoLink: '.page-header .logo-link',
    logo: '.page-header .logo',
    eyebrow: '.page-header .eyebrow',
    title: '.page-header h1',
    subtitle: '.page-header .subtitle',
  },
  {
    name: 'Unihealth',
    file: new URL('../docs/unihealth/index.md', import.meta.url),
    header: '.uh-header',
    logoLink: '.uh-header .logo-link',
    logo: '.uh-header .logo',
    eyebrow: '.uh-header .eyebrow',
    title: '.uh-header h1',
    subtitle: '.uh-header .subtitle',
  },
  {
    name: '2iM',
    file: new URL('../2im/index.html', import.meta.url),
    header: '.header',
    logoLink: '.logo-link',
    logo: '.logo',
    title: 'h1',
    subtitle: '.subtitle',
  },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cssRule(source, selector) {
  const match = source.match(new RegExp(`${escapeRegex(selector)}\\s*\\{([^}]*)\\}`, 's'));
  assert.ok(match, `Regra CSS ausente: ${selector}`);
  return match[1].replace(/\s+/g, ' ').trim();
}

for (const portal of portals) {
  test(`${portal.name}: cabeçalho é uma pilha flexível centralizada`, () => {
    const source = readFileSync(portal.file, 'utf8');
    const header = cssRule(source, portal.header);
    assert.match(header, /display:\s*flex;/);
    assert.match(header, /flex-direction:\s*column;/);
    assert.match(header, /align-items:\s*center;/);
    assert.match(header, /text-align:\s*center;/);
  });

  test(`${portal.name}: logo e textos têm centralização explícita`, () => {
    const source = readFileSync(portal.file, 'utf8');
    const logoLink = cssRule(source, portal.logoLink);
    const logo = cssRule(source, portal.logo);
    const title = cssRule(source, portal.title);
    const subtitle = cssRule(source, portal.subtitle);

    assert.match(logoLink, /display:\s*block;/);
    assert.match(logoLink, /margin:\s*0 auto 20px;/);
    assert.match(logoLink, /line-height:\s*0;/);
    assert.match(logo, /display:\s*block;/);
    assert.match(logo, /height:\s*auto;/);
    assert.match(logo, /margin:\s*0 auto;/);
    assert.match(title, /text-align:\s*center;/);
    assert.match(subtitle, /text-align:\s*center;/);
    assert.match(subtitle, /margin:\s*0;/);

    if (portal.eyebrow) {
      const eyebrow = cssRule(source, portal.eyebrow);
      assert.match(eyebrow, /display:\s*block;/);
      assert.match(eyebrow, /text-align:\s*center;/);
      assert.match(eyebrow, /margin:\s*0 auto 10px;/);
    }
  });

  test(`${portal.name}: possui ajuste de cabeçalho para telas de até 768 px`, () => {
    const source = readFileSync(portal.file, 'utf8');
    const media = source.match(/@media\s*\(max-width:\s*768px\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(media, 'Breakpoint de 768 px ausente');
    assert.match(media[1], new RegExp(`${escapeRegex(portal.header)}\\s*\\{[^}]*padding:\\s*30px 16px;`, 's'));
  });
}
