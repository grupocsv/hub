import assert from 'node:assert/strict';
import test from 'node:test';

import { bootstrapDocumentosApp } from '../../docs/public/documentos/assets/app.js';

const READY_CONFIG = Object.freeze({
  schemaVersion: 1,
  enabled: true,
  apiBaseUrl: 'https://hub.grupocsv.com',
  enabledPortals: ['unimed'],
  features: { favorites: true, upload: false, viewer: false, offline: false },
});

const SESSION = Object.freeze({
  portal: 'unimed',
  token: 'token-da-sessao',
  expires: '2026-07-24T13:00:00.000Z',
});

function createLifecycleTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    removeEventListener(type, callback) {
      if (listeners.get(type) === callback) listeners.delete(type);
    },
    dispatch(type, event = {}) {
      return listeners.get(type)?.(event);
    },
    count() {
      return listeners.size;
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test('configuração desabilitada falha fechado sem criar sessão ou cliente', async () => {
  let coordinators = 0;
  let clients = 0;
  const states = [];

  const result = await bootstrapDocumentosApp(
    { ...READY_CONFIG, enabled: false, apiBaseUrl: null, enabledPortals: [] },
    {
      locationSearch: '?portal=unimed',
      prepareShell() {},
      renderState: (...args) => states.push(args),
      createCoordinator() {
        coordinators += 1;
      },
      createClient() {
        clients += 1;
      },
    },
  );

  assert.equal(result.status, 'unavailable');
  assert.equal(coordinators, 0);
  assert.equal(clients, 0);
  assert.equal(states.at(-1)[0], 'unavailable');
});

test('contexto enquadrado falha fechado antes de autenticação ou rede', async () => {
  let coordinators = 0;
  let clients = 0;
  const states = [];
  const result = await bootstrapDocumentosApp(READY_CONFIG, {
    locationSearch: '?portal=unimed',
    windowRef: { top: {}, self: {} },
    prepareShell() {},
    renderState: (...args) => states.push(args),
    createCoordinator() {
      coordinators += 1;
    },
    createClient() {
      clients += 1;
    },
  });

  assert.equal(result.status, 'framed_context_blocked');
  assert.equal(coordinators, 0);
  assert.equal(clients, 0);
  assert.match(states.at(-1)[1], /outra página/i);
  assert.deepEqual(states.at(-1)[2], { controlsEnabled: false });
});

test('portal ausente, duplicado ou desabilitado falha fechado antes do Hub Auth', async () => {
  for (const locationSearch of ['', '?portal=unimed&portal=icds', '?portal=icds']) {
    let coordinators = 0;
    const result = await bootstrapDocumentosApp(READY_CONFIG, {
      locationSearch,
      prepareShell() {},
      renderState() {},
      createCoordinator() {
        coordinators += 1;
      },
    });

    assert.equal(result.status, 'invalid_portal');
    assert.equal(coordinators, 0);
  }
});

test('não cria cliente nem inicia operação documental antes da sessão', async () => {
  let coordinatorOptions;
  let clientOptions;
  let readyPayload;
  let documentRequests = 0;
  const states = [];
  const lifecycleTarget = createLifecycleTarget();
  const coordinator = {
    async start() {
      return { status: 'waiting_for_session', portal: 'unimed' };
    },
    stop() {},
    invalidate() {},
  };

  const app = await bootstrapDocumentosApp(READY_CONFIG, {
    locationSearch: '?portal=unimed',
    prepareShell() {},
    renderState: (...args) => states.push(args),
    lifecycleTarget,
    createCoordinator(options) {
      coordinatorOptions = options;
      return coordinator;
    },
    createClient(options) {
      clientOptions = options;
      return {
        async request() {
          documentRequests += 1;
        },
      };
    },
    onReady(payload) {
      readyPayload = payload;
    },
  });

  assert.equal(app.status, 'waiting_for_session');
  assert.equal(clientOptions, undefined);
  assert.equal(readyPayload, undefined);
  assert.equal(documentRequests, 0);
  assert.equal(states.at(-1)[0], 'loading');
  assert.deepEqual(states.at(-1)[2], { controlsEnabled: false });

  coordinatorOptions.onSessionReady(SESSION);

  assert.equal(clientOptions.baseUrl, READY_CONFIG.apiBaseUrl);
  assert.equal(clientOptions.getSession(), SESSION);
  assert.equal(documentRequests, 0);
  assert.equal(readyPayload.portal, 'unimed');
  assert.equal(readyPayload.session, SESSION);
  assert.equal(readyPayload.client, app.getClient());
  assert.deepEqual(states.at(-1)[2], { controlsEnabled: true });
});

test('sessão válida inicia um workspace isolado e perda de contexto o destrói', async () => {
  let coordinatorOptions;
  let starts = 0;
  const destroyed = [];
  const created = [];
  const createdViews = [];
  let readyPayload;
  const coordinator = {
    async start() {
      return { status: 'waiting_for_session', portal: 'unimed' };
    },
    stop() {},
    invalidate() {},
  };

  const app = await bootstrapDocumentosApp(READY_CONFIG, {
    locationSearch: '?portal=unimed',
    prepareShell() {},
    renderState() {},
    createCoordinator(options) {
      coordinatorOptions = options;
      return coordinator;
    },
    createClient() {
      return { request() {} };
    },
    createView(options) {
      createdViews.push(options);
      return { id: `view-${created.length + 1}` };
    },
    createWorkspace(options) {
      created.push(options);
      return {
        start() {
          starts += 1;
        },
        destroy(reason) {
          destroyed.push(reason);
        },
      };
    },
    onReady(payload) {
      readyPayload = payload;
    },
  });

  coordinatorOptions.onSessionReady(SESSION);
  assert.equal(starts, 1);
  assert.equal(created.length, 1);
  assert.equal(created[0].client, app.getClient());
  assert.equal(created[0].portal, 'unimed');
  assert.deepEqual(createdViews[0].features, READY_CONFIG.features);
  assert.equal(readyPayload.workspace, app.getWorkspace());

  coordinatorOptions.onSessionLost();
  assert.deepEqual(destroyed, ['session_lost']);
  assert.equal(app.getWorkspace(), null);

  coordinatorOptions.onSessionReady(SESSION);
  assert.equal(starts, 2);
  app.destroy();
  assert.deepEqual(destroyed, ['session_lost', 'destroyed']);
});

test('mantém controles bloqueados enquanto o workspace ainda carrega metadados', async () => {
  let coordinatorOptions;
  const workspaceStart = deferred();
  const states = [];
  const app = await bootstrapDocumentosApp(READY_CONFIG, {
    locationSearch: '?portal=unimed',
    prepareShell() {},
    renderState: (...args) => states.push(args),
    createCoordinator(options) {
      coordinatorOptions = options;
      return {
        async start() {
          return { status: 'waiting_for_session', portal: 'unimed' };
        },
        stop() {},
        invalidate() {},
      };
    },
    createClient() {
      return { request() {} };
    },
    createView() {
      return {};
    },
    createWorkspace() {
      return {
        start() {
          return workspaceStart.promise;
        },
        destroy() {},
      };
    },
  });

  coordinatorOptions.onSessionReady(SESSION);
  assert.equal(states.at(-1)[0], 'loading');
  assert.deepEqual(states.at(-1)[2], { controlsEnabled: false });

  workspaceStart.resolve();
  await Promise.resolve();
  app.destroy();
});

test('401 invalida imediatamente sessão, client e workspace antes do reload', async () => {
  let coordinatorOptions;
  let clientOptions;
  let invalidations = 0;
  const states = [];
  const destroyed = [];
  const coordinator = {
    async start() {
      return { status: 'authenticated', portal: 'unimed' };
    },
    stop() {},
    invalidate() {
      invalidations += 1;
    },
  };

  const app = await bootstrapDocumentosApp(READY_CONFIG, {
    locationSearch: '?portal=unimed',
    prepareShell() {},
    renderState: (...args) => states.push(args),
    createCoordinator(options) {
      coordinatorOptions = options;
      return coordinator;
    },
    createClient(options) {
      clientOptions = options;
      return {};
    },
    createView() {
      return {};
    },
    createWorkspace() {
      return {
        start() {},
        destroy(reason) {
          destroyed.push(reason);
        },
      };
    },
  });

  coordinatorOptions.onSessionReady(SESSION);
  assert.equal(clientOptions.getSession(), SESSION);
  assert.notEqual(app.getWorkspace(), null);
  clientOptions.onUnauthorized();
  assert.equal(invalidations, 1);
  assert.equal(clientOptions.getSession(), null);
  assert.equal(app.getClient(), null);
  assert.equal(app.getWorkspace(), null);
  assert.deepEqual(destroyed, ['unauthorized']);
  assert.equal(states.at(-1)[0], 'loading');
  assert.deepEqual(states.at(-1)[2], { controlsEnabled: false });

  app.destroy();
});

test('pagehide destrói sessão em memória e pageshow revalida antes de recriar o workspace', async () => {
  const lifecycleTarget = createLifecycleTarget();
  let stops = 0;
  let starts = 0;
  let coordinatorOptions;
  const destroyed = [];
  const states = [];
  const coordinator = {
    async start() {
      starts += 1;
      return { status: 'waiting_for_session', portal: 'unimed' };
    },
    stop() {
      stops += 1;
    },
    invalidate() {},
  };

  const app = await bootstrapDocumentosApp(READY_CONFIG, {
    locationSearch: '?portal=unimed',
    prepareShell() {},
    renderState: (...args) => states.push(args),
    lifecycleTarget,
    createCoordinator(options) {
      coordinatorOptions = options;
      return coordinator;
    },
    createClient() {
      return { request() {} };
    },
    createView() {
      return {};
    },
    createWorkspace() {
      return {
        start() {},
        destroy(reason) {
          destroyed.push(reason);
        },
      };
    },
  });

  coordinatorOptions.onSessionReady(SESSION);
  assert.notEqual(app.getWorkspace(), null);
  assert.equal(lifecycleTarget.count(), 2);
  lifecycleTarget.dispatch('pagehide', { persisted: true });
  assert.equal(stops, 1);
  assert.deepEqual(destroyed, ['pagehide']);
  assert.equal(app.getWorkspace(), null);
  assert.equal(app.getClient(), null);
  assert.equal(states.at(-1)[2].controlsEnabled, false);

  await lifecycleTarget.dispatch('pageshow', { persisted: true });
  assert.equal(starts, 2);
  assert.equal(app.getWorkspace(), null);
  coordinatorOptions.onSessionReady(SESSION);
  assert.notEqual(app.getWorkspace(), null);

  app.destroy();
  assert.equal(stops, 2);
  assert.equal(lifecycleTarget.count(), 0);
});

test('registra a fronteira BFCache antes de aguardar o carregamento do Hub Auth', async () => {
  const lifecycleTarget = createLifecycleTarget();
  const startup = deferred();
  let stops = 0;
  const coordinator = {
    start() {
      return startup.promise;
    },
    stop() {
      stops += 1;
    },
    invalidate() {},
  };

  const booting = bootstrapDocumentosApp(READY_CONFIG, {
    locationSearch: '?portal=unimed',
    prepareShell() {},
    renderState() {},
    lifecycleTarget,
    createCoordinator() {
      return coordinator;
    },
  });

  await Promise.resolve();
  assert.equal(lifecycleTarget.count(), 2);
  lifecycleTarget.dispatch('pagehide', { persisted: true });
  assert.equal(stops, 1);

  startup.resolve({ status: 'stopped', portal: 'unimed' });
  const app = await booting;
  assert.equal(app.status, 'stopped');
  app.destroy();
  assert.equal(lifecycleTarget.count(), 0);
});
