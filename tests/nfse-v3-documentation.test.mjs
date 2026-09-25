import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const pagePath = new URL('axia/nota-fiscal.html', root);
const infraIndexPath = new URL('docs/_infra/index.md', root);
const architecturePath = new URL('docs/_infra/technical-architecture.md', root);
const manualPath = new URL('docs/_infra/manuais/nfse-axiacare.md', root);
const portalStaticPath = new URL('axia/index.html', root);
const portalVitePressPath = new URL('docs/axia/index.md', root);
const readmePath = new URL('README.md', root);
const taxonomyPath = new URL('_infra/csv-core/taxonomia-produtos.md', root);
const manifestPath = new URL('manifest.json', root);
const mainNavigationPath = new URL('docs/.vitepress/config.mts', root);
const infraNavigationPath = new URL('docs/_infra/.vitepress/config.mts', root);

const page = readFileSync(pagePath, 'utf8');
const infraIndex = readFileSync(infraIndexPath, 'utf8');
const architecture = readFileSync(architecturePath, 'utf8');
const portalStatic = readFileSync(portalStaticPath, 'utf8');
const portalVitePress = readFileSync(portalVitePressPath, 'utf8');
const readme = readFileSync(readmePath, 'utf8');
const taxonomy = readFileSync(taxonomyPath, 'utf8');

test('NFS-e v3: a ferramenta oferece uma aba Manual atualizada', () => {
  assert.match(page, /data-tab-target="manual"[^>]*>Manual<\/button>/);
  assert.match(page, /id="tab-manual"/);
  assert.match(page, /Ambiente de homologação/);
  assert.match(page, /sessão individual/i);
  assert.match(page, /IRRF de 1,5%/);
  assert.match(page, /contribuições sociais de 4,65%/);
  assert.match(page, /retenções federais totais de 6,15%/);
  assert.match(page, /Ordem de Compra é obrigatória para o perfil AbbVie/);
  assert.match(page, /não emite, não cancela e não altera NFS-e/);
});

test('NFS-e v3: o índice de infraestrutura registra todos os componentes fiscais ativos', () => {
  for (const marker of [
    'NFS-e AxiaCare',
    '/_infra/manuais/nfse-axiacare',
    'api.grupocsv.com/nfse/*',
    'nfse-api',
    'R2: nfse-pdfs',
    'nfse_profiles',
    'nfse_documents',
    'nfse_audit',
    'Sessão individual obrigatória',
  ]) {
    assert.ok(infraIndex.includes(marker), `Marcador ausente no índice de infraestrutura: ${marker}`);
  }
});

test('NFS-e v3: a arquitetura técnica documenta o control plane, o armazenamento e o emissor privado', () => {
  for (const marker of [
    'NFS-e AxiaCare',
    'nfse-api',
    'nfse-pdfs',
    'nfse-emitter.service',
    '127.0.0.1:8789',
    'Mutações fiscais desabilitadas',
  ]) {
    assert.ok(architecture.includes(marker), `Marcador ausente na arquitetura técnica: ${marker}`);
  }
});

test('NFS-e v3: o manual técnico-operacional existe e preserva os gates vigentes', () => {
  assert.equal(existsSync(manualPath), true, 'Manual técnico-operacional ausente em `_infra`.');
  const manual = readFileSync(manualPath, 'utf8');
  for (const marker of [
    'Manual da NFS-e AxiaCare',
    'Homologação segura',
    'IRRF',
    'Ordem de Compra',
    'Sessão individual',
    'Mutações desabilitadas',
    'Bucket privado',
    'Sistema Nacional NFS-e',
  ]) {
    assert.match(manual, new RegExp(marker, 'i'));
  }
  assert.doesNotMatch(manual, /(senha|segredo HMAC|chave privada)\s*[:=]\s*\S+/i);
  assert.doesNotMatch(manual, /\b(?:sk|ghp|pat|eyJ)[A-Za-z0-9._-]{20,}/);
});

test('NFS-e v3: catálogo, portal e taxonomia não prometem emissão indisponível', () => {
  for (const portal of [portalStatic, portalVitePress]) {
    assert.match(portal, /NFS-e AxiaCare/);
    assert.match(portal, /Homologação/);
    assert.match(portal, /emissão e cancelamento desabilitados/);
    assert.doesNotMatch(portal, /Solicitação de Emissão de NF/);
  }

  assert.match(readme, /\| NFS-e AxiaCare \| `axia\/nota-fiscal\.html` \| \*\*WebApp\*\* \| AxiaCare \| Homologação \|/);
  assert.match(taxonomy, /`axia\/nota-fiscal\.html` \| \*\*WebApp\*\*/);
  assert.doesNotMatch(taxonomy, /gerar NF/);

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const product = manifest.productAssets.find((item) => item.path === '/axia/nota-fiscal.html');
  assert.ok(product, 'A NFS-e AxiaCare deve constar no manifesto.');
  assert.equal(product.category, 'webapp');
  assert.equal(product.title, 'NFS-e AxiaCare');
});

test('NFS-e v3: o manual fiscal está acessível nas configurações de navegação de `_infra`', () => {
  const mainNavigation = readFileSync(mainNavigationPath, 'utf8');
  const infraNavigation = readFileSync(infraNavigationPath, 'utf8');
  assert.match(mainNavigation, /NFS-e AxiaCare[^\n]+\/_infra\/manuais\/nfse-axiacare/);
  assert.match(infraNavigation, /NFS-e AxiaCare[^\n]+\/manuais\/nfse-axiacare/);
});
