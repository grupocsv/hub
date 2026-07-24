import assert from 'node:assert/strict';
import test from 'node:test';

import { bootstrapDocumentosApp } from '../../docs/public/documentos/assets/app.js';

const READY_CONFIG = Object.freeze({
  schemaVersion: 1,
  enabled: true,
  apiBaseUrl: 'https://hub.grupocsv.com',
  enabledPortals: ['unimed'],
  features: { favorites: true, upload: true, viewer: true, offline: false },
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
      listeners.get(type)?.(event);
    },
    count() {
      return listeners.size;
    },
  };
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

test('401 coordena limpeza da sessão ativa e sessão perdida desabilita os controles', async () => {
  let coordinatorOptions;
  let clientOptions;
  let invalidations = 0;
  const states = [];
  const coordinator = {
    async start() {
      return { status: 'authenticated', portal: 'unimed' };
    },
    stop() {},
    invalidate() {
      invalidations += 1;
    },
  };

  await bootstrapDocumentosApp(READY_CONFIG, {
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
  });

  coordinatorOptions.onSessionReady(SESSION);
  clientOptions.onUnauthorized();
  assert.equal(invalidations, 1);

  coordinatorOptions.onSessionLost();
  assert.equal(states.at(-1)[0], 'loading');
  assert.deepEqual(states.at(-1)[2], { controlsEnabled: false });
});

test('pagehide e desmontagem param a observação da sessão sem persistir estado', async () => {
  const lifecycleTarget = createLifecycleTarget();
  let stops = 0;
  const coordinator = {
    async start() {
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
    renderState() {},
    lifecycleTarget,
    createCoordinator() {
      return coordinator;
    },
  });

  assert.equal(lifecycleTarget.count(), 1);
  lifecycleTarget.dispatch('pagehide');
  assert.equal(stops, 1);
  app.destroy();
  assert.equal(stops, 2);
  assert.equal(lifecycleTarget.count(), 0);
});
