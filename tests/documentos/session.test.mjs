import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearCanonicalSession,
  createHubAuthDescriptor,
  createSessionCoordinator,
  loadHubAuthScript,
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

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test('aceita somente um portal habilitado e normaliza o alias canônico', () => {
  const enabledPortals = ['unimed', 'axiacare', '2im'];

  assert.equal(resolvePortalContext('?portal=unimed', enabledPortals), 'unimed');
  assert.equal(resolvePortalContext('?portal=axia', enabledPortals), 'axiacare');
  assert.equal(resolvePortalContext('?portal=2im', enabledPortals), '2im');
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
    loadAuth: async (descriptor) => {
      loaded.push(descriptor);
      return { readiness: { status: 'required', portal: descriptor.portal } };
    },
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
    loadAuth: async (descriptor) => ({
      readiness: { status: 'valid', portal: descriptor.portal },
    }),
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

test('stop durante o carregamento do Hub Auth impede sessão e observador tardios', async () => {
  const authLoad = deferred();
  let ready = 0;
  let required = 0;
  let scheduled = 0;
  const coordinator = createSessionCoordinator({
    search: '?portal=unimed',
    enabledPortals: ['unimed'],
    localStorage: createStorage(
      storedSession('unimed', { expires: '2026-07-24T13:00:00.000Z' }),
    ),
    sessionStorage: createStorage(),
    now: () => Date.parse('2026-07-24T12:00:00.000Z'),
    loadAuth: () => authLoad.promise,
    schedule: () => {
      scheduled += 1;
      return scheduled;
    },
    cancel() {},
    onSessionReady: () => {
      ready += 1;
    },
    onSessionRequired: () => {
      required += 1;
    },
  });

  const starting = coordinator.start();
  coordinator.stop();
  authLoad.resolve();

  assert.deepEqual(await starting, { status: 'stopped', portal: 'unimed' });
  assert.equal(ready, 0);
  assert.equal(required, 0);
  assert.equal(scheduled, 0);
});

test('carregador aguarda o readiness público antes de liberar o coordenador', async () => {
  const readiness = deferred();
  const listeners = new Map();
  const script = {
    dataset: {},
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
  };
  const windowRef = { HUB_AUTH_READY: readiness.promise };
  const documentRef = {
    defaultView: windowRef,
    head: {
      append() {
        listeners.get('load')?.();
      },
    },
    createElement() {
      return script;
    },
    getElementById() {
      return null;
    },
  };

  let settled = false;
  const loading = loadHubAuthScript(createHubAuthDescriptor('unimed'), documentRef)
    .then((result) => {
      settled = true;
      return result;
    });
  await Promise.resolve();
  assert.equal(settled, false);

  readiness.resolve({ status: 'valid', portal: 'unimed' });
  const result = await loading;
  assert.equal(result.script, script);
  assert.deepEqual(result.readiness, { status: 'valid', portal: 'unimed' });
});

test('script existente consulta o readiness corrente após a rodada de pageshow', async () => {
  const currentReadiness = deferred();
  const script = { dataset: { portal: 'unimed' } };
  const windowRef = {
    HUB_AUTH_READY: Promise.resolve({ status: 'valid', portal: 'unimed' }),
  };
  const documentRef = {
    defaultView: windowRef,
    head: {},
    createElement() {
      throw new Error('não deve criar outro script');
    },
    getElementById() {
      return script;
    },
  };

  let settled = false;
  const loading = loadHubAuthScript(createHubAuthDescriptor('unimed'), documentRef)
    .then((result) => {
      settled = true;
      return result;
    });
  windowRef.HUB_AUTH_READY = currentReadiness.promise;
  await Promise.resolve();
  assert.equal(settled, false);

  currentReadiness.resolve({ status: 'required', portal: 'unimed' });
  const result = await loading;
  assert.equal(result.readiness.status, 'required');
});

test('readiness indisponível ignora sessão antiga, mas observa um novo login verificado', async () => {
  let ready = 0;
  let required = 0;
  let scheduledCallback;
  const localStorage = createStorage(
    storedSession('unimed', { expires: '2026-07-24T13:00:00.000Z' }),
  );
  const sessionStorage = createStorage();
  const coordinator = createSessionCoordinator({
    search: '?portal=unimed',
    enabledPortals: ['unimed'],
    localStorage,
    sessionStorage,
    now: () => Date.parse('2026-07-24T12:00:00.000Z'),
    loadAuth: async () => ({
      readiness: { status: 'unavailable', portal: 'unimed' },
    }),
    schedule: (callback) => {
      scheduledCallback = callback;
      return 1;
    },
    onSessionReady: () => {
      ready += 1;
    },
    onSessionRequired: () => {
      required += 1;
    },
  });

  assert.deepEqual(await coordinator.start(), {
    status: 'waiting_for_session',
    portal: 'unimed',
  });
  assert.equal(ready, 0);
  assert.equal(required, 1);
  assert.equal(typeof scheduledCallback, 'function');
  assert.deepEqual(localStorage.snapshot(), {});

  const keys = sessionKeys('unimed');
  localStorage.setItem(keys.token, 'token-verificado-no-retry');
  localStorage.setItem(keys.email, 'pessoa@exemplo.com');
  localStorage.setItem(keys.expires, '2026-07-24T13:00:00.000Z');
  scheduledCallback();

  assert.equal(ready, 1);
});

test('start antigo não revive sessão nem timer após stop seguido de novo start', async () => {
  const firstAuth = deferred();
  const secondAuth = deferred();
  const authLoads = [firstAuth, secondAuth];
  const ready = [];
  const scheduled = [];
  const cancelled = [];
  const coordinator = createSessionCoordinator({
    search: '?portal=unimed',
    enabledPortals: ['unimed'],
    localStorage: createStorage(
      storedSession('unimed', { expires: '2026-07-24T13:00:00.000Z' }),
    ),
    sessionStorage: createStorage(),
    now: () => Date.parse('2026-07-24T12:00:00.000Z'),
    loadAuth: () => authLoads.shift().promise,
    schedule: (callback) => {
      scheduled.push(callback);
      return scheduled.length;
    },
    cancel: (handle) => cancelled.push(handle),
    onSessionReady: (session) => ready.push(session.token),
  });

  const firstStart = coordinator.start();
  coordinator.stop();
  const secondStart = coordinator.start();
  secondAuth.resolve({ readiness: { status: 'valid', portal: 'unimed' } });
  assert.equal((await secondStart).status, 'authenticated');
  firstAuth.resolve({ readiness: { status: 'valid', portal: 'unimed' } });
  assert.equal((await firstStart).status, 'stopped');

  assert.deepEqual(ready, ['token-secreto']);
  assert.equal(scheduled.length, 1);
  coordinator.stop();
  assert.deepEqual(cancelled, [1]);
});

test('script existente ainda em carga aguarda load e readiness em vez de falhar cedo', async () => {
  const readiness = deferred();
  const listeners = new Map();
  const script = {
    dataset: { portal: 'unimed', hubAuthLoad: 'loading' },
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
  };
  const windowRef = {};
  const documentRef = {
    defaultView: windowRef,
    head: {},
    createElement() {
      throw new Error('não deve criar outro script');
    },
    getElementById() {
      return script;
    },
  };

  let settled = false;
  const loading = loadHubAuthScript(createHubAuthDescriptor('unimed'), documentRef)
    .then((result) => {
      settled = true;
      return result;
    });
  await Promise.resolve();
  assert.equal(settled, false);

  windowRef.HUB_AUTH_READY = readiness.promise;
  listeners.get('load')();
  readiness.resolve({ status: 'required', portal: 'unimed' });
  const result = await loading;
  assert.equal(result.readiness.status, 'required');
});
