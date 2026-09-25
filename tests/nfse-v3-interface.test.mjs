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

test('NFS-e v3: remove credenciais, comandos e superfícies legadas', () => {
  for (const pattern of prohibitedPatterns) {
    assert.equal(source.includes(pattern), false, `Padrão proibido encontrado: ${pattern}`);
  }

  assert.doesNotMatch(source, /data-tab=["'](?:emitir|cancelar)["']/i);
  assert.doesNotMatch(source, /btn-(?:emitir|cancelar)/i);
  assert.doesNotMatch(source, /\/v1\/(?:emit|issue|cancel)/i);
  assert.doesNotMatch(source, /https?:\/\/[^\s"']+\.pdf(?:[?#][^\s"']*)?/i);
  assert.doesNotMatch(source, /(?:calcular|calcula|cálculo)\s*(?:tribut|retenç)/i);
  assert.doesNotMatch(source, /valor(?:Bruto|Servico|Serviço)?\s*\*\s*(?:0\.|\d)/i);
});

test('NFS-e v3: explicita a homologação e mantém as cinco abas de leitura', () => {
  assert.match(source, /Homologação segura — emissão e cancelamento desabilitados/);
  for (const label of ['Simular', 'Histórico', 'Perfis', 'Adequação', 'Manual']) {
    assert.match(source, new RegExp(`>${label}<`));
  }
});

test('NFS-e v3: usa sessão efêmera do Hub e API autenticada v3', () => {
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
});

test('NFS-e v3: consulta somente os contratos de leitura e prévia', () => {
  for (const endpoint of ['/v1/meta', '/v1/profiles', '/v1/documents', '/v1/simulations']) {
    assert.match(source, new RegExp(endpoint.replaceAll('/', '\\/')));
  }
  assert.match(source, /authFetch\(url,\s*\{[\s\S]*?signal:/);
  assert.match(source, /profile_code:\s*fields\.profile/);
  assert.match(source, /gross_amount_cents:\s*fields\.grossAmountCents/);
  assert.doesNotMatch(source, /gross_amount:\s*fields\.grossAmount/);
  assert.match(source, /block_reasons/);
  assert.match(source, /rate_bps/);
  assert.match(source, /amount_cents/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /URL\.revokeObjectURL/);
});

test('NFS-e v3: preserva a referência visual AbbVie sem envio automático', () => {
  assert.match(source, /8\.055,00/);
  assert.match(source, /4203234719/);
  assert.match(source, /referência já emitida manualmente; não emitir/i);
  assert.match(source, /FEE DR GUILHERME CAMARGO THOME; EVENTO Mini Meeting com Dr Guilherme Thome sobre Cuidado Baseado em Valor: Mais Qualidade, Sustentabilidade e Resultados\. DATA DO EVENTO 24\/09\/26/);
});
