import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PORTALS = ['unimed', 'unihealth', 'icds'];

async function source(relativePath) {
  return readFile(path.join(ROOT, relativePath), 'utf8');
}

function partnerSection(home, portal, nextPortal) {
  const start = home.indexOf(`id="partner-${portal}"`);
  const end = nextPortal
    ? home.indexOf(`id="partner-${nextPortal}"`, start)
    : home.indexOf('<!-- ═══ GOVERNANÇA ═══ -->', start);
  assert.notEqual(start, -1, `seção do parceiro ${portal} deve existir`);
  assert.notEqual(end, -1, `fim da seção do parceiro ${portal} deve existir`);
  return home.slice(start, end);
}

test('homepage oferece gateway próprio e CTAs de documentos antes dos toggles', async () => {
  const home = await source('docs/index.md');

  assert.match(
    home,
    /<section class="documents-gateway" aria-labelledby="documents-gateway-title">/,
  );
  assert.match(
    home,
    /href="\/documentos\/\?portal=grupo-csv" class="documents-gateway__link documents-gateway__link--primary"/,
  );
  for (const portal of PORTALS) {
    assert.match(
      home,
      new RegExp(
        `href="/documentos/\\?portal=${portal}" class="documents-gateway__link"`,
      ),
    );
  }

  PORTALS.forEach((portal, index) => {
    const section = partnerSection(home, portal, PORTALS[index + 1]);
    const documents = section.indexOf(
      `href="/documentos/?portal=${portal}" class="p-documents-btn"`,
    );
    const toggle = section.indexOf('class="p-toggle"');
    assert.ok(documents >= 0, `CTA documental ausente em ${portal}`);
    assert.ok(
      documents < toggle,
      `CTA documental deve ficar imediatamente antes do toggle em ${portal}`,
    );
    assert.match(section, />Central de Documentos<\/a>/);
    assert.match(
      section,
      new RegExp(
        `<button type="button" class="p-toggle" aria-expanded="false" aria-controls="partner-tools-${portal}">`,
      ),
    );
    assert.match(
      section,
      new RegExp(
        `<div class="partner-tools-wrapper" id="partner-tools-${portal}" aria-hidden="true" inert>`,
      ),
    );
  });

  assert.match(home, /tool\.managedBy !== 'hub-documentos'/);
  assert.match(home, /tool\.file\.startsWith\('\/documentos\/'\)/);
  assert.match(home, /toggle\.setAttribute\('aria-expanded', String\(expanded\)\)/);
  assert.match(home, /wrapper\.setAttribute\('aria-hidden', String\(!expanded\)\)/);
});

test('portais VitePress destacam a Central e excluem o item gerenciado da grade', async () => {
  for (const portal of PORTALS) {
    const page = await source(`docs/${portal}/index.md`);
    assert.match(
      page,
      new RegExp(
        `href="/documentos/\\?portal=${portal}" class="documents-entry"`,
      ),
    );
    assert.match(page, /<strong class="documents-entry__title">Central de Documentos<\/strong>/);
    assert.match(page, /tool\.managedBy !== 'hub-documentos'/);
    assert.match(page, /tool\.file\.startsWith\('\/documentos\/'\)/);
    if (portal === 'unimed') {
      assert.match(page, /tool\.featured === true/);
      assert.doesNotMatch(page, /i === 0 \? ' featured'/);
    }
  }
});

test('fallbacks estáticos preservam noindex e o mesmo acesso documental', async () => {
  for (const portal of PORTALS) {
    const page = await source(`${portal}/index.html`);
    assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
    assert.match(
      page,
      new RegExp(
        `href="/documentos/\\?portal=${portal}" class="documents-entry"`,
      ),
    );
    assert.match(page, /<strong class="documents-entry__title">Central de Documentos<\/strong>/);
    assert.match(
      page,
      new RegExp(
        `<script src="/scripts/hub-auth\\.js" data-portal="${portal}"></script>`,
      ),
    );
  }
});
