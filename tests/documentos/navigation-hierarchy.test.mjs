import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PORTALS = ['unimed', 'unihealth', 'icds', '2im'];
const VITEPRESS_PORTALS = ['unimed', 'unihealth', 'icds'];

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

test('homepage oferece acesso exclusivo do Grupo CSV e CTAs de parceiros antes dos toggles', async () => {
  const home = await source('docs/index.md');
  const gatewayStart = home.indexOf(
    '<section class="documents-gateway" aria-labelledby="documents-gateway-title">',
  );
  const gatewayEnd = home.indexOf('</section>', gatewayStart);
  const gateway = home.slice(gatewayStart, gatewayEnd);

  assert.notEqual(gatewayStart, -1, 'gateway documental deve existir');
  assert.notEqual(gatewayEnd, -1, 'gateway documental deve ser fechado');
  assert.match(
    gateway,
    /href="\/documentos\/\?portal=grupo-csv" class="documents-gateway__link documents-gateway__link--primary"/,
  );
  assert.match(gateway, />Acessar Central<\/a>/);
  assert.match(gateway, /Acesse o acervo institucional do Grupo CSV/);
  for (const portal of PORTALS) {
    assert.doesNotMatch(
      gateway,
      new RegExp(
        `href="/documentos/\\?portal=${portal}"`,
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
  for (const portal of VITEPRESS_PORTALS) {
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

test('header e homepage compartilham o catálogo canônico de parceiros ativos', async () => {
  let partnerCatalogSource = '';
  try {
    partnerCatalogSource = await source('docs/.vitepress/data/partner-portals.json');
  } catch {
    assert.fail('catálogo canônico de parceiros ausente');
  }

  const partnerCatalog = JSON.parse(partnerCatalogSource);
  const activePartners = partnerCatalog.partners.filter((partner) => partner.active);
  const activeIds = activePartners.map((partner) => partner.id);
  const config = await source('docs/.vitepress/config.mts');
  const home = await source('docs/index.md');
  const tenantCatalog = JSON.parse(await source('scripts/documentos-tenants.json'));
  const enabledTenantIds = tenantCatalog.tenants
    .filter((tenant) => tenant.enabled && tenant.portal !== 'grupo-csv')
    .map((tenant) => tenant.portal);
  const homePartnerIds = [...home.matchAll(/class="partner-section[^"]*" id="partner-([^"]+)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(activeIds, homePartnerIds, 'homepage deve refletir os parceiros ativos');
  assert.deepEqual(activeIds, enabledTenantIds, 'tenants parceiros habilitados devem permanecer sincronizados');
  assert.ok(activeIds.includes('2im'), '2iM deve constar entre os parceiros ativos');

  assert.match(config, /import partnerPortals from '\.\/data\/partner-portals\.json'/);
  assert.match(config, /const activePartnerNavItems = partnerPortals\.partners/);
  assert.match(config, /items: activePartnerNavItems/);
  assert.match(home, /import partnerPortals from '\.\/\.vitepress\/data\/partner-portals\.json'/);
  assert.match(home, /const portals = partnerPortals\.partners/);

  for (const partner of activePartners) {
    assert.equal(typeof partner.navLabel, 'string');
    assert.equal(typeof partner.link, 'string');
    assert.equal(typeof partner.color, 'string');
    assert.match(home, new RegExp(`id="partner-${partner.id}"`));
    assert.match(home, new RegExp(`href="${partner.link.replaceAll('/', '\\/')}"`));
  }
});
