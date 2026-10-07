import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const page = new URL('../axia/nota-fiscal.html', import.meta.url);
const source = readFileSync(page, 'utf8');
const hubAuthSource = readFileSync(new URL('../scripts/hub-auth.js', import.meta.url), 'utf8');

const prohibitedPatterns = [
  'NF_AUTH_KEY',
  'COMPUTE_TOKEN',
  'COMPUTE_URL',
  'hooks.grupocsv.com/compute',
  'x-nf-auth',
  'command:',
  'emitter.mjs',
  'innerHTML',
  'hub_auth_axiacare_token',
  'localStorage',
  'sessionStorage',
];

test('NFS-e v3.2: não expõe credenciais, comandos, emissor privado nem superfícies legadas', () => {
  for (const pattern of prohibitedPatterns) {
    assert.equal(source.includes(pattern), false, `Padrão proibido encontrado: ${pattern}`);
  }

  assert.doesNotMatch(source, /nfse-emitter\.[a-z0-9-]+\.[a-z]{2,}/i, 'O hostname privado do emissor não deve aparecer na página.');
  assert.doesNotMatch(source, /data-tab(?:-target)?=["']cancelar["']/i);
  assert.doesNotMatch(source, /btn-cancelar/i);
  assert.doesNotMatch(source, /\/v1\/[^\s"'`]*cancel/i);
  assert.doesNotMatch(source, /\/v1\/issue/i);
  assert.doesNotMatch(source, /https?:\/\/[^\s"']+\.pdf(?:[?#][^\s"']*)?/i);
  assert.doesNotMatch(source, /(?:calcular|calcula|cálculo)\s*(?:tribut|retenç)/i);
  assert.doesNotMatch(source, /valor(?:Bruto|Servico|Serviço)?\s*\*\s*(?:0\.|\d)/i);
});

test('NFS-e v3.2: explicita a emissão controlada em produção e as oito abas', () => {
  assert.match(source, /Emissão controlada em produção — cancelamento somente pelo responsável humano/);
  assert.match(source, /class="environment-badge">Produção</);
  for (const label of ['Emitir', 'Solicitações', 'Simular', 'Histórico', 'Perfis', 'Agentes', 'Adequação', 'Manual']) {
    assert.match(source, new RegExp(`>${label}<`), `Aba ausente: ${label}`);
  }
  assert.doesNotMatch(source, /Homologação segura — emissão e cancelamento desabilitados/);
});

test('NFS-e v3.2: usa sessão efêmera do Hub e API autenticada', () => {
  assert.match(source, /\/scripts\/hub-auth\.js/);
  assert.match(source, /data-portal=["']axia["']/);
  assert.match(source, /await\s+window\.HUB_AUTH_READY/);
  assert.match(source, /status\s*===\s*["']valid["']/);
  assert.match(source, /window\.HUB_AUTH_API/);
  assert.match(source, /authFetch\(url/);
  assert.match(hubAuthSource, /window\.HUB_AUTH_API\s*=\s*Object\.freeze/);
  assert.match(hubAuthSource, /headers\.set\(["']X-Auth-Token["'],\s*session\.token\)/);
  assert.match(hubAuthSource, /AUTHORIZED_FETCH_ORIGINS/);
  assert.match(source, /https:\/\/api\.grupocsv\.com\/nfse\/v1\//);
  assert.match(hubAuthSource, /https:\/\/api\.grupocsv\.com/);
  assert.match(source, /new\s+AbortController\(\)/);
  assert.match(source, /setTimeout\(/);
  assert.match(source, /authFetch\(url,\s*\{[\s\S]*?signal:/);
});

test('NFS-e v3.2: consome os contratos de leitura, prévia, solicitação, aprovação, emissão e DANFSe', () => {
  for (const endpoint of [
    '/v1/meta',
    '/v1/profiles',
    '/v1/documents',
    '/v1/simulations',
    '/v1/requests',
    '/v1/agent-keys',
  ]) {
    assert.ok(source.includes(endpoint), `Contrato ausente: ${endpoint}`);
  }
  assert.match(source, /\/v1\/requests\/\$\{encodeURIComponent\(id\)\}\/approve/);
  assert.match(source, /\/v1\/operations\/\$\{encodeURIComponent\(id\)\}\/emit/);
  assert.match(source, /\/v1\/requests\/\$\{encodeURIComponent\(id\)\}\/danfse/);
  assert.match(source, /\/v1\/agent-keys\/\$\{encodeURIComponent\(id\)\}\/revoke/);
  assert.match(source, /profile_code:\s*fields\.profile/);
  assert.match(source, /gross_amount_cents:\s*fields\.grossAmountCents/);
  assert.doesNotMatch(source, /gross_amount:\s*fields\.grossAmount/);
  assert.match(source, /rate_bps/);
  assert.match(source, /amount_cents/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /URL\.revokeObjectURL/);
});

test('NFS-e v3.2: toda mutação fiscal usa Idempotency-Key e confirmação do valor líquido', () => {
  assert.match(source, /'Idempotency-Key':\s*key/);
  assert.match(source, /'Idempotency-Key':\s*state\.emit\.emitKey/);
  assert.match(source, /crypto\.getRandomValues\(bytes\)/);
  assert.match(source, /'Idempotency-Key':\s*`hub-approve-\$\{id\}-\$\{typed\}`/);
  assert.match(source, /expected_net_amount_cents/);
  assert.match(source, /Confirmar e emitir/);
  assert.match(source, /Gerar prévia oficial/);
});

test('NFS-e v3.2: a chave de agente é exibida uma única vez e nunca persistida no navegador', () => {
  assert.match(source, /id="agent-secret"/);
  assert.match(source, /exibida uma única vez/i);
  assert.doesNotMatch(source, /document\.cookie/);
  assert.doesNotMatch(source, /indexedDB/);
});

test('NFS-e v3.2: preserva a referência visual AbbVie sem envio automático', () => {
  assert.match(source, /8\.055,00/);
  assert.match(source, /4203234719/);
  assert.match(source, /referência já emitida manualmente; não emitir/i);
  assert.match(source, /FEE DR GUILHERME CAMARGO THOME; EVENTO Mini Meeting com Dr Guilherme Thome sobre Cuidado Baseado em Valor: Mais Qualidade, Sustentabilidade e Resultados\. DATA DO EVENTO 24\/09\/26/);
});
