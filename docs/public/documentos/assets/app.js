import { createDocumentApiClient } from './api-client.js';
import { createSessionCoordinator, resolvePortalContext } from './session.js';
import { createDocumentosView } from './view.js';
import { createDocumentosWorkspace } from './workspace.js';

const ALLOWED_API_ORIGINS = new Set(['https://hub.grupocsv.com']);
const VALID_STATES = new Set(['loading', 'unavailable', 'empty', 'error']);

const STATE_COPY = Object.freeze({
  loading: Object.freeze({
    title: 'Carregando Documentos',
    detail: 'Aguarde enquanto preparamos o catálogo autorizado.',
  }),
  unavailable: Object.freeze({
    title: 'Catálogo Indisponível',
    detail: 'A configuração segura desta aplicação ainda não foi habilitada.',
  }),
  empty: Object.freeze({
    title: 'Nenhum Documento Encontrado',
    detail: 'Não há documentos disponíveis para os critérios informados.',
  }),
  error: Object.freeze({
    title: 'Não Foi Possível Carregar',
    detail: 'Tente novamente. Se o problema persistir, retorne ao Hub.',
  }),
});

function hasValidApiBaseUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return false;

  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_API_ORIGINS.has(parsed.origin) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      (parsed.pathname === '/' || parsed.pathname === '')
    );
  } catch {
    return false;
  }
}

function isReadyConfig(config) {
  return Boolean(
    config &&
      typeof config === 'object' &&
      config.schemaVersion === 1 &&
      config.enabled === true &&
      hasValidApiBaseUrl(config.apiBaseUrl) &&
      Array.isArray(config.enabledPortals) &&
      config.enabledPortals.length > 0 &&
      config.features &&
      typeof config.features === 'object',
  );
}

export function isTopLevelContext(windowRef = globalThis.window) {
  if (!windowRef || !('top' in windowRef) || !('self' in windowRef)) return true;
  try {
    return windowRef.top === windowRef.self;
  } catch {
    return false;
  }
}

export function deriveStartupState(config) {
  return isReadyConfig(config) ? 'loading' : 'unavailable';
}

export function shouldStartNetwork(config) {
  return deriveStartupState(config) === 'loading';
}

function setControlsEnabled(enabled) {
  for (const selector of [
    '#docs-search',
    '.docs-search__submit',
    '.docs-filters__form select',
    '.docs-filters__form button',
    '[data-view]',
  ]) {
    for (const control of document.querySelectorAll(selector)) {
      const featureDisabled = Boolean(
        control.closest?.('[data-feature-disabled="true"]'),
      );
      control.disabled = !enabled || featureDisabled;
    }
  }
}

function syncStaticFeatureControls(features = {}) {
  const searchForm = document.querySelector('.docs-search');
  if (!searchForm) return;
  const enabled = features?.search === true;
  searchForm.hidden = !enabled;
  searchForm.dataset.featureDisabled = String(!enabled);
  for (const control of searchForm.querySelectorAll('input, button')) {
    control.disabled = !enabled;
  }
}

function renderSkeletons(container) {
  container.replaceChildren();
  const grid = document.createElement('div');
  grid.className = 'docs-skeleton-grid';
  grid.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < 3; index += 1) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';
    grid.append(skeleton);
  }

  container.append(grid);
}

export function renderShellState(state, detail, options = {}) {
  if (typeof document === 'undefined') return;

  const normalized = VALID_STATES.has(state) ? state : 'error';
  const copy = STATE_COPY[normalized];
  const body = document.body;
  const status = document.querySelector('#docs-status');
  const content = document.querySelector('#docs-content');
  const controlsEnabled = options.controlsEnabled ?? normalized !== 'unavailable';

  body.dataset.state = normalized;
  setControlsEnabled(controlsEnabled);

  if (!status || !content) return;
  status.className = `docs-state is-${normalized}`;
  status.dataset.state = normalized;
  const title = status.querySelector('strong');
  const paragraph = status.querySelector('p');
  if (title) title.textContent = copy.title;
  if (paragraph) paragraph.textContent = detail || copy.detail;

  if (normalized === 'loading') {
    status.hidden = false;
    content.hidden = false;
    renderSkeletons(content);
    return;
  }

  status.hidden = false;
  content.hidden = true;
  content.replaceChildren();
}

function bindNavigation() {
  const buttons = [...document.querySelectorAll('[data-view]')];
  for (const button of buttons) {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      for (const candidate of buttons) candidate.removeAttribute('aria-current');
      button.setAttribute('aria-current', 'page');
    });
  }
}

function bindStaticForms() {
  const search = document.querySelector('.docs-search');
  search?.addEventListener('submit', (event) => {
    event.preventDefault();
  });
}

function prepareDocumentosShell(features = {}) {
  bindNavigation();
  bindStaticForms();
  syncStaticFeatureControls(features);
}

function inertApplication(status, portal = null) {
  return Object.freeze({
    status,
    portal,
    getClient: () => null,
    getWorkspace: () => null,
    destroy() {},
  });
}

export function bootDocumentosShell(config = globalThis.HUB_DOCUMENTOS_CONFIG) {
  if (typeof document === 'undefined') return 'unavailable';

  prepareDocumentosShell(config?.features);
  const startupState = deriveStartupState(config);
  renderShellState(startupState, undefined, {
    controlsEnabled: false,
  });
  return startupState;
}

export async function bootstrapDocumentosApp(
  config = globalThis.HUB_DOCUMENTOS_CONFIG,
  dependencies = {},
) {
  const prepareShell = dependencies.prepareShell ?? prepareDocumentosShell;
  const renderState = dependencies.renderState ?? renderShellState;
  const createCoordinator = dependencies.createCoordinator ?? createSessionCoordinator;
  const createClient = dependencies.createClient ?? createDocumentApiClient;
  const createView =
    dependencies.createView ?? (typeof document !== 'undefined' ? createDocumentosView : null);
  const createWorkspace =
    dependencies.createWorkspace ??
    (typeof document !== 'undefined' ? createDocumentosWorkspace : null);
  const lifecycleTarget = dependencies.lifecycleTarget ?? globalThis.window;
  const windowRef = dependencies.windowRef ?? globalThis.window;
  const locationSearch = dependencies.locationSearch ?? globalThis.location?.search ?? '';
  const onReady = dependencies.onReady ?? (() => {});

  prepareShell(config?.features);
  if (!isTopLevelContext(windowRef)) {
    renderState('unavailable', 'A aplicação não pode ser aberta dentro de outra página.', {
      controlsEnabled: false,
    });
    return inertApplication('framed_context_blocked');
  }
  if (!shouldStartNetwork(config)) {
    renderState('unavailable', undefined, { controlsEnabled: false });
    return inertApplication('unavailable');
  }

  const portal = resolvePortalContext(locationSearch, config.enabledPortals);
  if (!portal) {
    renderState('unavailable', 'O acesso deve ser iniciado por um portal habilitado.', {
      controlsEnabled: false,
    });
    return inertApplication('invalid_portal');
  }

  let activeSession = null;
  let client = null;
  let workspace = null;
  let destroyed = false;
  let suspended = false;
  let coordinator;

  function destroyWorkspace(reason) {
    workspace?.destroy(reason);
    workspace = null;
  }

  function waitingForSession(reason = null) {
    if (reason) destroyWorkspace(reason);
    activeSession = null;
    client = null;
    renderState('loading', 'Aguardando a autenticação do Hub.', { controlsEnabled: false });
  }

  function handleSessionReady(session) {
    if (destroyed) return;
    destroyWorkspace('session_replaced');
    activeSession = session;
    client = createClient({
      baseUrl: config.apiBaseUrl,
      getSession: () => activeSession,
      onUnauthorized: () => {
        waitingForSession('unauthorized');
        coordinator.invalidate();
      },
    });
    renderState('loading', undefined, { controlsEnabled: false });

    if (typeof createView === 'function' && typeof createWorkspace === 'function') {
      const view = createView({ renderState, features: config.features });
      workspace = createWorkspace({
        client,
        portal,
        view,
        lifecycleTarget,
        features: config.features,
      });
      const currentWorkspace = workspace;
      const workspaceStart = currentWorkspace.start();
      renderState('loading', undefined, { controlsEnabled: false });
      Promise.resolve(workspaceStart)
        .catch(() => {
          if (workspace !== currentWorkspace || destroyed) return;
          destroyWorkspace('startup_failed');
          renderState('error', undefined, { controlsEnabled: false });
        });
    } else {
      renderState('loading', undefined, { controlsEnabled: true });
    }

    onReady({ portal, session, client, workspace, features: config.features });
  }

  function handleSessionLost() {
    waitingForSession('session_lost');
  }

  const handlePageHide = () => {
    if (destroyed) return;
    suspended = true;
    destroyWorkspace('pagehide');
    activeSession = null;
    client = null;
    renderState('loading', 'A sessão será revalidada ao retornar.', {
      controlsEnabled: false,
    });
    coordinator.stop();
  };

  let startResult;
  const handlePageShow = async (event) => {
    if (destroyed || suspended !== true || event?.persisted !== true) return;
    suspended = false;
    renderState('loading', 'Revalidando a autenticação do Hub.', {
      controlsEnabled: false,
    });
    try {
      startResult = await coordinator.start();
    } catch {
      waitingForSession('authentication_unavailable');
      renderState('error', 'Não foi possível revalidar a autenticação.', {
        controlsEnabled: false,
      });
    }
  };

  coordinator = createCoordinator({
    search: locationSearch,
    enabledPortals: config.enabledPortals,
    onSessionReady: handleSessionReady,
    onSessionRequired: waitingForSession,
    onSessionLost: handleSessionLost,
  });

  lifecycleTarget?.addEventListener?.('pagehide', handlePageHide);
  lifecycleTarget?.addEventListener?.('pageshow', handlePageShow);
  waitingForSession();
  try {
    startResult = await coordinator.start();
  } catch {
    lifecycleTarget?.removeEventListener?.('pagehide', handlePageHide);
    lifecycleTarget?.removeEventListener?.('pageshow', handlePageShow);
    coordinator.stop();
    renderState('error', 'Não foi possível iniciar a autenticação.', { controlsEnabled: false });
    return inertApplication('authentication_unavailable', portal);
  }

  return Object.freeze({
    status: startResult.status,
    portal,
    getClient: () => client,
    getWorkspace: () => workspace,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      destroyWorkspace('destroyed');
      activeSession = null;
      client = null;
      lifecycleTarget?.removeEventListener?.('pagehide', handlePageHide);
      lifecycleTarget?.removeEventListener?.('pageshow', handlePageShow);
      coordinator.stop();
    },
  });
}

async function autoBootstrap() {
  try {
    await bootstrapDocumentosApp();
  } catch {
    renderShellState('error', undefined, { controlsEnabled: false });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBootstrap, { once: true });
  } else {
    autoBootstrap();
  }
}
