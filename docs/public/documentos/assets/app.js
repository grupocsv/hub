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
      config.features &&
      typeof config.features === 'object',
  );
}

export function deriveStartupState(config) {
  return isReadyConfig(config) ? 'loading' : 'unavailable';
}

export function shouldStartNetwork(config) {
  return deriveStartupState(config) === 'loading';
}

function setControlsEnabled(enabled) {
  for (const selector of ['#docs-search', '.docs-search__submit', '#docs-upload']) {
    const control = document.querySelector(selector);
    if (control) control.disabled = !enabled;
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

export function renderShellState(state, detail) {
  if (typeof document === 'undefined') return;

  const normalized = VALID_STATES.has(state) ? state : 'error';
  const copy = STATE_COPY[normalized];
  const body = document.body;
  const status = document.querySelector('#docs-status');
  const content = document.querySelector('#docs-content');

  body.dataset.state = normalized;
  setControlsEnabled(normalized !== 'unavailable');

  if (!status || !content) return;
  status.className = `docs-state is-${normalized}`;
  status.dataset.state = normalized;
  const title = status.querySelector('strong');
  const paragraph = status.querySelector('p');
  if (title) title.textContent = copy.title;
  if (paragraph) paragraph.textContent = detail || copy.detail;

  if (normalized === 'loading') {
    status.hidden = true;
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

export function bootDocumentosShell(config = globalThis.HUB_DOCUMENTOS_CONFIG) {
  if (typeof document === 'undefined') return 'unavailable';

  bindNavigation();
  bindStaticForms();
  const startupState = deriveStartupState(config);
  renderShellState(startupState);
  return startupState;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootDocumentosShell(), { once: true });
  } else {
    bootDocumentosShell();
  }
}
