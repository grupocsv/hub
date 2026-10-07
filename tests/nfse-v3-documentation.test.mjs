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

const OUTDATED_STATE = [
  'Homologação segura',
  'homologação segura',
  'Mutações fiscais desabilitadas',
  'mutações fiscais desabilitadas',
  'emissor local bloqueado',
  'blocked_accounting',
  'emissão e cancelamento desabilitados',
  'emissão bloqueada na homologação',
];

function assertCurrentState(label, content, allowed = []) {
  for (const marker of OUTDATED_STATE.filter((item) => !allowed.includes(item))) {
    assert.ok(!content.includes(marker), `${label} ainda descreve o estado anterior: ${marker}`);
  }
}

test('NFS-e v3.2: a aba Manual da ferramenta descreve a emissão controlada vigente', () => {
  assert.match(page, /data-tab-target="manual"[^>]*>Manual<\/button>/);
  assert.match(page, /id="tab-manual"/);
  assert.match(page, /Emissão controlada em produção/);
  assert.match(page, /sessão individual/i);
  assert.match(page, /IRRF 1,50%/);
  assert.match(page, /contribuições sociais 4,65%/);
  assert.match(page, /total 6,15%/);
  assert.match(page, /Ordem de Compra obrigatória/);
  assert.match(page, /NT 008\/2026/);
  assert.match(page, /Cancelamento e substituição não são feitos pela ferramenta/);
  assert.match(page, /\/_infra\/manuais\/nfse-axiacare/);
  // O rótulo `blocked_accounting` permanece apenas no mapa de situações de perfil, suportado pelo schema.
  assertCurrentState('A página da ferramenta', page, ['blocked_accounting']);
  assert.doesNotMatch(page, /Bloqueado: validação contábil<\/(?:p|span|strong|td)>/);
});

test('NFS-e v3.2: o índice de infraestrutura registra todos os componentes fiscais ativos', () => {
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
    'emissão controlada em produção',
    'emissor privado na VPS-CSV',
    'cancelamento desabilitado',
  ]) {
    assert.ok(infraIndex.includes(marker), `Marcador ausente no índice de infraestrutura: ${marker}`);
  }
  assertCurrentState('O índice de infraestrutura', infraIndex);
});

test('NFS-e v3.2: a arquitetura técnica documenta API, armazenamento, emissor privado e conector', () => {
  for (const marker of [
    'NFS-e AxiaCare',
    'nfse-api',
    'nfse-pdfs',
    'nfse-emitter.service',
    '127.0.0.1:8789',
    'Cloudflare Tunnel',
    'Cloudflare Access',
    'HMAC-SHA256',
    'Emissão controlada',
    'cancelamento permanece desabilitado',
  ]) {
    assert.ok(architecture.includes(marker), `Marcador ausente na arquitetura técnica: ${marker}`);
  }
  assertCurrentState('A arquitetura técnica', architecture);
});

test('NFS-e v3.2: o manual técnico-operacional documenta fluxo, regras, integração e controles', () => {
  assert.equal(existsSync(manualPath), true, 'Manual técnico-operacional ausente em `_infra`.');
  const manual = readFileSync(manualPath, 'utf8');
  for (const marker of [
    'Manual da NFS-e AxiaCare',
    'Versão operacional:** 3.2.0',
    'Emissão controlada em produção',
    'Sistema Nacional NFS-e',
    'Sessão individual',
    'Chaves de Agentes',
    'Idempotency-Key',
    'pending_confirmation',
    'expected_net_amount_cents',
    'NT 008/2026',
    'Bucket privado',
    'HTTP 423',
    'Ordem de Compra',
    'IRRF',
    '| R$ 10.000,00 | R$ 150,00 | R$ 65,00 | R$ 300,00 | R$ 100,00 | R$ 615,00 | R$ 500,00 | R$ 9.385,00 |',
    '| R$ 8.055,00 | R$ 120,83 | R$ 52,36 | R$ 241,65 | R$ 80,55 | R$ 495,39 | R$ 402,75 | R$ 7.559,61 |',
  ]) {
    assert.ok(manual.includes(marker), `Marcador ausente no manual: ${marker}`);
  }
  for (const route of [
    'GET` | `/v1/meta',
    'POST` | `/v1/requests`',
    'POST` | `/v1/requests/{id}/approve',
    'POST` | `/v1/operations/{id}/emit',
    'POST` | `/v1/requests/{id}/danfse',
    'POST` | `/v1/documents/{id}/cancel',
    'POST` | `/v1/agent-keys/{id}/revoke',
  ]) {
    assert.ok(manual.includes(route), `Rota ausente no manual: ${route}`);
  }
  assertCurrentState('O manual técnico-operacional', manual);
  assert.doesNotMatch(manual, /nfse-emitter\.(?!service\b)[a-z0-9-]+\.[a-z]{2,}/, 'O hostname privado do emissor não deve ser publicado.');
  assert.doesNotMatch(manual, /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/, 'CNPJ de tomador não deve constar no manual público.');
  assert.doesNotMatch(manual, /nfse_ak_[A-Za-z0-9_-]{43}/, 'Chave real de agente não deve constar no manual.');
  assert.doesNotMatch(manual, /(senha|segredo HMAC|chave privada)\s*[:=]\s*\S+/i);
  assert.doesNotMatch(manual, /\b(?:sk|ghp|pat|eyJ)[A-Za-z0-9._-]{20,}/);
});

test('NFS-e v3.2: catálogo, portal e taxonomia refletem a emissão controlada', () => {
  for (const portal of [portalStatic, portalVitePress]) {
    assert.match(portal, /NFS-e AxiaCare/);
    assert.match(portal, /Emissão controlada de NFS-e com prévia oficial, confirmação do valor líquido e DANFSe; cancelamento fora da ferramenta\./);
    assert.doesNotMatch(portal, /Solicitação de Emissão de NF/);
    assertCurrentState('O portal AxiaCare', portal);
  }

  assert.match(readme, /\| NFS-e AxiaCare \| `axia\/nota-fiscal\.html` \| \*\*WebApp\*\* \| AxiaCare \| Ativo \|/);
  assert.match(taxonomy, /`axia\/nota-fiscal\.html` \| \*\*WebApp\*\* \|[^\n]*emissão controlada de NFS-e/);
  assert.doesNotMatch(taxonomy, /gerar NF/);
  assertCurrentState('A taxonomia', taxonomy);

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const product = manifest.productAssets.find((item) => item.path === '/axia/nota-fiscal.html');
  assert.ok(product, 'A NFS-e AxiaCare deve constar no manifesto.');
  assert.equal(product.category, 'webapp');
  assert.equal(product.title, 'NFS-e AxiaCare');
});

test('NFS-e v3.2: o manual fiscal está acessível nas configurações de navegação de `_infra`', () => {
  const mainNavigation = readFileSync(mainNavigationPath, 'utf8');
  const infraNavigation = readFileSync(infraNavigationPath, 'utf8');
  assert.match(mainNavigation, /NFS-e AxiaCare[^\n]+\/_infra\/manuais\/nfse-axiacare/);
  assert.match(infraNavigation, /NFS-e AxiaCare[^\n]+\/manuais\/nfse-axiacare/);
});
