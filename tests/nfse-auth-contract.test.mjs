import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('CSP da NFS-e permite a origem real do login e da verificação do Hub', () => {
  const html = readFileSync(new URL('../docs/public/grupo-csv/nfse/index.html', import.meta.url), 'utf8');
  const auth = readFileSync(new URL('../docs/public/scripts/hub-auth.js', import.meta.url), 'utf8');
  const authApi = auth.match(/\bvar\s+AUTH_API\s*=\s*(['"])(.*?)\1/);
  assert.ok(authApi, 'A origem de autenticação deve ser obtida do script utilizado pela página.');
  const origin = new URL(authApi[2]).origin;
  const meta = html.match(/<meta\b[^>]*http-equiv=['"]Content-Security-Policy['"][^>]*>/i);
  assert.ok(meta, 'A página fiscal deve declarar sua política CSP.');
  const policy = meta[0].match(/\bcontent=(['"])(.*?)\1/i);
  assert.ok(policy);
  const directives = new Map(policy[2].split(';').map(value => {
    const [name, ...sources] = value.trim().split(/\s+/);
    return [name, sources];
  }));
  const connectSources = directives.get('connect-src') ?? directives.get('default-src') ?? [];
  assert.ok(connectSources.includes(origin), `connect-src deve permitir explicitamente ${origin}, usado por /login e /verify.`);
});
