import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearCanonicalSession,
  createHubAuthDescriptor,
  createSessionCoordinator,
  readCanonicalSession,
  resolvePortalContext,
} from '../../docs/public/documentos/assets/session.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    snapshot() {
      return Object.fromEntries(values);
    },
  };
}

function sessionKeys(portal) {
  return {
    token: `hub_auth_${portal}_token`,
    email: `hub_auth_${portal}_email`,
    expires: `hub_auth_${portal}_expires`,
  };
}

function storedSession(portal, { token = 'token-secreto', email = 'pessoa@exemplo.com', expires }) {
  const keys = sessionKeys(portal);
  return {
    [keys.token]: token,
    [keys.email]: email,
    [keys.expires]: expires,
  };
}

test('aceita somente um portal habilitado e normaliza o alias canônico', () => {
  const enabledPortals = ['unimed', 'axiacare'];

  assert.equal(resolvePortalContext('?portal=unimed', enabledPortals), 'unimed');
  assert.equal(resolvePortalContext('?portal=axia', enabledPortals), 'axiacare');
  assert.equal(resolvePortalContext('', enabledPortals), null);
  assert.equal(resolvePortalContext('?portal=unimed&portal=axiacare', enabledPortals), null);
  assert.equal(resolvePortalContext('?portal=UNIMED', enabledPortals), null);
  assert.equal(resolvePortalContext('?portal=../unimed', enabledPortals), null);
  assert.equal(resolvePortalContext('?portal=icds', enabledPortals), null);
  assert.equal(resolvePortalContext('?portal=unimed', []), null);
});

test('lê a sessão canônica existente sem copiar o token para outro armazenamento', () => {
  const now = Date.parse('2026-07-24T12:00:00.000Z');
  const localStorage = createStorage(
    storedSession('unimed', { expires: '2026-07-24T13:00:00.000Z' }),
  );
  const sessionStorage = createStorage();

  const session = readCanonicalSession('unimed', {
    localStorage,
    sessionStorage,
    now: () => now,
  });

  assert.deepEqual(session, {
    portal: 'unimed',
    token: 'token-secreto',
    email: 'pessoa@exemplo.com',
    expires: '2026-07-24T13:00:00.000Z',
    storage: 'local',
  });
  assert.deepEqual(sessionStorage.snapshot(), {});
});

test('usa uma sessão completa do sessionStorage sem combinar chaves entre armazenamentos', () => {
  const now = Date.parse('2026-07-24T12:00:00.000Z');
  const keys = sessionKeys('icds');
  const localStorage = createStorage({ [keys.token]: 'token-incompleto' });
  const sessionStorage = createStorage(
    storedSession('icds', {
      token: 'token-da-sessao',
      expires: '2026-07-24T13:00:00.000Z',
    }),
  );

  const session = readCanonicalSession('icds', {
    localStorage,
    sessionStorage,
    now: () => now,
  });

  assert.equal(session.token, 'token-da-sessao');
  assert.equal(session.storage, 'session');
  assert.equal(localStorage.getItem(keys.token), 'token-incompleto');
});

test('sessão expirada é rejeitada e suas chaves canônicas são removidas', () => {
  const localStorage = createStorage(
    storedSession('unimed', { expires: '2026-07-24T11:59:59.000Z' }),
  );
  const sessionStorage = createStorage(
    storedSession('unimed', {
      token: 'token-antigo',
      expires: '2026-07-24T11:00:00.000Z',
    }),
  );

  const session = readCanonicalSession('unimed', {
    localStorage,
    sessionStorage,
    now: () => Date.parse('2026-07-24T12:00:00.000Z'),
  });

  assert.equal(session, null);
  assert.deepEqual(localStorage.snapshot(), {});
  assert.deepEqual(sessionStorage.snapshot(), {});
});

test('descritor do Hub Auth transporta somente o portal validado', () => {
  const descriptor = createHubAuthDescriptor('unimed');

  assert.deepEqual(descriptor, {
    id: 'documentos-hub-auth',
    src: '/scripts/hub-auth.js',
    portal: 'unimed',
  });
  assert.doesNotMatch(JSON.stringify(descriptor), /token|tenant_id|authorization/i);
  assert.throws(() => createHubAuthDescriptor('../unimed'), /portal/i);
});

test('coordenador não inicia trabalho autenticado antes da sessão e detecta login e logout', async () => {
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const loaded = [];
  const ready = [];
  const required = [];
  const lost = [];
  const scheduled = [];

  const coordinator = createSessionCoordinator({
    search: '?portal=unimed',
    enabledPortals: ['unimed'],
    localStorage,
    sessionStorage,
    now: () => Date.parse('2026-07-24T12:00:00.000Z'),
    loadAuth: async (descriptor) => loaded.push(descriptor),
    schedule: (callback) => {
      scheduled.push(callback);
      return scheduled.length;
    },
    cancel: () => {},
    onSessionReady: (session) => ready.push(session),
    onSessionRequired: () => required.push('required'),
    onSessionLost: () => lost.push('lost'),
  });

  const started = await coordinator.start();
  assert.deepEqual(started, { status: 'waiting_for_session', portal: 'unimed' });
  assert.equal(loaded.length, 1);
  assert.equal(ready.length, 0);
  assert.equal(required.length, 1);
  assert.equal(scheduled.length, 1);

  const keys = sessionKeys('unimed');
  localStorage.setItem(keys.token, 'token-depois-do-login');
  localStorage.setItem(keys.email, 'pessoa@exemplo.com');
  localStorage.setItem(keys.expires, '2026-07-24T13:00:00.000Z');
  coordinator.checkNow();

  assert.equal(ready.length, 1);
  assert.equal(ready[0].token, 'token-depois-do-login');
  assert.deepEqual(sessionStorage.snapshot(), {});

  clearCanonicalSession('unimed', { localStorage, sessionStorage });
  coordinator.checkNow();
  assert.equal(lost.length, 1);
  assert.equal(required.length, 2);

  coordinator.stop();
});

test('portal inválido falha fechado sem carregar autenticação nem agendar observação', async () => {
  let loads = 0;
  let schedules = 0;
  const coordinator = createSessionCoordinator({
    search: '?portal=desconhecido',
    enabledPortals: ['unimed'],
    localStorage: createStorage(),
    sessionStorage: createStorage(),
    loadAuth: async () => {
      loads += 1;
    },
    schedule: () => {
      schedules += 1;
      return 1;
    },
    cancel: () => {},
  });

  assert.deepEqual(await coordinator.start(), { status: 'invalid_portal', portal: null });
  assert.equal(loads, 0);
  assert.equal(schedules, 0);
});

test('invalidação por 401 remove somente a sessão do portal ativo e reinicia o fluxo', async () => {
  const localStorage = createStorage({
    ...storedSession('unimed', { expires: '2026-07-24T13:00:00.000Z' }),
    ...storedSession('icds', {
      token: 'token-icds',
      expires: '2026-07-24T13:00:00.000Z',
    }),
  });
  const sessionStorage = createStorage();
  let reloads = 0;

  const coordinator = createSessionCoordinator({
    search: '?portal=unimed',
    enabledPortals: ['unimed'],
    localStorage,
    sessionStorage,
    now: () => Date.parse('2026-07-24T12:00:00.000Z'),
    loadAuth: async () => {},
    schedule: () => 1,
    cancel: () => {},
    reload: () => {
      reloads += 1;
    },
  });

  await coordinator.start();
  coordinator.invalidate();

  const unimedKeys = sessionKeys('unimed');
  const icdsKeys = sessionKeys('icds');
  assert.equal(localStorage.getItem(unimedKeys.token), null);
  assert.equal(localStorage.getItem(icdsKeys.token), 'token-icds');
  assert.equal(reloads, 1);
});
