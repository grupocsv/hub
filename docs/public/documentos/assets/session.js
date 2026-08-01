const PORTAL_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/u;
const PORTAL_ALIASES = Object.freeze({ axia: 'axiacare' });
const STORAGE_PREFIX = 'hub_auth_';
const DEFAULT_POLL_INTERVAL_MS = 250;
const HUB_AUTH_STATUSES = new Set([
  'valid',
  'required',
  'invalid',
  'unavailable',
  'set_password',
]);

function normalizePortal(value) {
  if (typeof value !== 'string' || !PORTAL_PATTERN.test(value)) return null;
  return PORTAL_ALIASES[value] || value;
}

function storageKeys(portal) {
  return Object.freeze({
    token: `${STORAGE_PREFIX}${portal}_token`,
    email: `${STORAGE_PREFIX}${portal}_email`,
    expires: `${STORAGE_PREFIX}${portal}_expires`,
  });
}

function safeStorage(operation, fallback = null) {
  try {
    return operation();
  } catch {
    return fallback;
  }
}

function storageCandidates(options) {
  return [
    { name: 'local', storage: options.localStorage },
    { name: 'session', storage: options.sessionStorage },
  ].filter((candidate) => candidate.storage && typeof candidate.storage.getItem === 'function');
}

function removeSessionFromStorage(storage, keys) {
  if (!storage || typeof storage.removeItem !== 'function') return;
  safeStorage(() => {
    storage.removeItem(keys.token);
    storage.removeItem(keys.email);
    storage.removeItem(keys.expires);
  });
}

function readStorageSession(candidate, portal, now) {
  const keys = storageKeys(portal);
  const values = safeStorage(() => ({
    token: candidate.storage.getItem(keys.token),
    email: candidate.storage.getItem(keys.email),
    expires: candidate.storage.getItem(keys.expires),
  }));

  if (!values || !values.token || !values.expires) return null;

  const expiresAt = Date.parse(values.expires);
  if (!Number.isFinite(expiresAt) || expiresAt <= now()) {
    removeSessionFromStorage(candidate.storage, keys);
    return null;
  }

  return Object.freeze({
    portal,
    token: values.token,
    email: values.email,
    expires: values.expires,
    storage: candidate.name,
  });
}

export function resolvePortalContext(search, enabledPortals) {
  if (!Array.isArray(enabledPortals) || enabledPortals.length === 0) return null;

  const enabled = new Set(enabledPortals.map(normalizePortal).filter(Boolean));
  let parameters;
  try {
    parameters = new URLSearchParams(typeof search === 'string' ? search : '');
  } catch {
    return null;
  }

  const candidates = parameters.getAll('portal');
  if (candidates.length !== 1) return null;
  const portal = normalizePortal(candidates[0]);
  return portal && enabled.has(portal) ? portal : null;
}

export function readCanonicalSession(portal, options = {}) {
  const normalizedPortal = normalizePortal(portal);
  if (!normalizedPortal) return null;

  const now = typeof options.now === 'function' ? options.now : Date.now;
  const candidates = storageCandidates({
    localStorage: options.localStorage ?? globalThis.localStorage,
    sessionStorage: options.sessionStorage ?? globalThis.sessionStorage,
  });

  for (const candidate of candidates) {
    const session = readStorageSession(candidate, normalizedPortal, now);
    if (session) return session;
  }
  return null;
}

export function clearCanonicalSession(portal, options = {}) {
  const normalizedPortal = normalizePortal(portal);
  if (!normalizedPortal) return;

  const keys = storageKeys(normalizedPortal);
  for (const candidate of storageCandidates({
    localStorage: options.localStorage ?? globalThis.localStorage,
    sessionStorage: options.sessionStorage ?? globalThis.sessionStorage,
  })) {
    removeSessionFromStorage(candidate.storage, keys);
  }
}

export function createHubAuthDescriptor(portal) {
  const normalizedPortal = normalizePortal(portal);
  if (!normalizedPortal) throw new TypeError('Portal inválido para o Hub Auth.');

  return Object.freeze({
    id: 'documentos-hub-auth',
    src: '/scripts/hub-auth.js',
    portal: normalizedPortal,
  });
}

async function waitForHubAuthReadiness(descriptor, documentRef, script) {
  // Em pageshow, permite que o listener do Hub Auth substitua a Promise antiga
  // antes de lermos o readiness corrente do script já existente.
  await Promise.resolve();
  const windowRef = documentRef.defaultView ?? globalThis.window;
  const readinessPromise = windowRef?.HUB_AUTH_READY;
  if (!readinessPromise || typeof readinessPromise.then !== 'function') {
    throw new Error('O Hub Auth não publicou o estado de autenticação.');
  }
  const readiness = await readinessPromise;
  if (
    !readiness ||
    readiness.portal !== descriptor.portal ||
    !HUB_AUTH_STATUSES.has(readiness.status)
  ) {
    throw new Error('O Hub Auth publicou um estado de autenticação inválido.');
  }
  return Object.freeze({
    script,
    readiness: Object.freeze({
      status: readiness.status,
      portal: readiness.portal,
    }),
  });
}

export function loadHubAuthScript(descriptor, documentRef = globalThis.document) {
  if (!documentRef?.createElement || !documentRef?.head) {
    return Promise.reject(new Error('Documento indisponível para carregar o Hub Auth.'));
  }

  const existing = documentRef.getElementById?.(descriptor.id);
  if (existing) {
    if (existing.dataset?.portal !== descriptor.portal) {
      return Promise.reject(new Error('O Hub Auth já foi carregado para outro portal.'));
    }
    if (existing.dataset?.hubAuthLoad === 'loading') {
      return new Promise((resolve, reject) => {
        existing.addEventListener(
          'load',
          () => resolve(waitForHubAuthReadiness(descriptor, documentRef, existing)),
          { once: true },
        );
        existing.addEventListener(
          'error',
          () => reject(new Error('Não foi possível carregar a autenticação.')),
          { once: true },
        );
      });
    }
    if (existing.dataset?.hubAuthLoad === 'failed') {
      return Promise.reject(new Error('Não foi possível carregar a autenticação.'));
    }
    return waitForHubAuthReadiness(descriptor, documentRef, existing);
  }

  return new Promise((resolve, reject) => {
    const script = documentRef.createElement('script');
    script.id = descriptor.id;
    script.src = descriptor.src;
    script.dataset.portal = descriptor.portal;
    script.dataset.hubAuthLoad = 'loading';
    script.async = true;
    script.addEventListener(
      'load',
      () => {
        script.dataset.hubAuthLoad = 'loaded';
        resolve(waitForHubAuthReadiness(descriptor, documentRef, script));
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        script.dataset.hubAuthLoad = 'failed';
        reject(new Error('Não foi possível carregar a autenticação.'));
      },
      { once: true },
    );
    documentRef.head.append(script);
  });
}

export function createSessionCoordinator(options = {}) {
  const enabledPortals = options.enabledPortals;
  const search = options.search ?? globalThis.location?.search ?? '';
  const localStorage = options.localStorage ?? globalThis.localStorage;
  const sessionStorage = options.sessionStorage ?? globalThis.sessionStorage;
  const now = typeof options.now === 'function' ? options.now : Date.now;
  const loadAuth = options.loadAuth ?? ((descriptor) => loadHubAuthScript(descriptor));
  const schedule = options.schedule ?? ((callback) => globalThis.setInterval(callback, DEFAULT_POLL_INTERVAL_MS));
  const cancel = options.cancel ?? ((handle) => globalThis.clearInterval(handle));
  const reload = options.reload ?? (() => globalThis.location?.reload());
  const onSessionReady = options.onSessionReady ?? (() => {});
  const onSessionRequired = options.onSessionRequired ?? (() => {});
  const onSessionLost = options.onSessionLost ?? (() => {});

  let portal = null;
  let timer = null;
  let activeToken = null;
  let stopped = false;
  let generation = 0;

  function currentSession() {
    if (!portal) return null;
    return readCanonicalSession(portal, { localStorage, sessionStorage, now });
  }

  function checkNow() {
    if (stopped || !portal) return null;
    const session = currentSession();

    if (session && session.token !== activeToken) {
      if (activeToken) onSessionLost();
      activeToken = session.token;
      onSessionReady(session);
      return session;
    }

    if (!session && activeToken) {
      activeToken = null;
      onSessionLost();
      onSessionRequired();
      return null;
    }

    return session;
  }

  async function start() {
    portal = resolvePortalContext(search, enabledPortals);
    if (!portal) return Object.freeze({ status: 'invalid_portal', portal: null });

    generation += 1;
    const startGeneration = generation;
    stopped = false;
    if (timer !== null) cancel(timer);
    timer = null;
    activeToken = null;

    let auth;
    try {
      auth = await loadAuth(createHubAuthDescriptor(portal));
    } catch (error) {
      if (stopped || startGeneration !== generation) {
        return Object.freeze({ status: 'stopped', portal });
      }
      throw error;
    }
    if (stopped || startGeneration !== generation) {
      return Object.freeze({ status: 'stopped', portal });
    }
    const readiness = auth?.readiness;
    if (
      !readiness ||
      readiness.portal !== portal ||
      !HUB_AUTH_STATUSES.has(readiness.status)
    ) {
      throw new Error('Estado de autenticação inválido.');
    }
    if (readiness.status !== 'valid') {
      clearCanonicalSession(portal, { localStorage, sessionStorage });
    }
    const session = readiness.status === 'valid' ? currentSession() : null;
    if (session) {
      activeToken = session.token;
      onSessionReady(session);
    } else {
      onSessionRequired();
    }
    timer = schedule(() => {
      if (!stopped && startGeneration === generation) checkNow();
    });

    return Object.freeze({
      status: session ? 'authenticated' : 'waiting_for_session',
      portal,
    });
  }

  function stop() {
    generation += 1;
    stopped = true;
    if (timer !== null) cancel(timer);
    timer = null;
    activeToken = null;
  }

  function invalidate() {
    if (!portal) return;
    clearCanonicalSession(portal, { localStorage, sessionStorage });
    stop();
    reload();
  }

  return Object.freeze({ start, stop, checkNow, invalidate });
}
