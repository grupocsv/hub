const CATALOG_INPUT_KEYS = new Set([
  'collectionId',
  'classification',
  'lifecycleStatus',
  'tagId',
  'favorite',
  'cursor',
]);
const CLASSIFICATIONS = new Set(['public', 'internal', 'confidential', 'restricted']);
const LIFECYCLE_STATUSES = new Set([
  'draft',
  'active',
  'archived',
  'deletion_requested',
  'deleting',
  'deleted',
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{0,127})$/;
const CATALOG_PAGE_SIZE = 20;
const SEARCH_MAX_LENGTH = 500;
const DEFAULT_RECENT_LIMIT = 50;

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function identifier(value, name) {
  if (typeof value !== 'string' || !IDENTIFIER_PATTERN.test(value)) {
    throw new TypeError(`${name} inválido.`);
  }
  return value;
}

function optionalEnum(value, values, name) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !values.has(value)) {
    throw new TypeError(`${name} inválido.`);
  }
  return value;
}

export function buildCatalogTarget(input = {}) {
  if (!plainObject(input)) throw new TypeError('Filtros de catálogo inválidos.');
  for (const key of Object.keys(input)) {
    if (!CATALOG_INPUT_KEYS.has(key)) {
      throw new TypeError(`Parâmetro de catálogo não permitido: ${key}.`);
    }
  }

  const parameters = new URLSearchParams();
  if (input.collectionId !== undefined) {
    parameters.set('collection_id', identifier(input.collectionId, 'Coleção'));
  }
  const lifecycleStatus = optionalEnum(
    input.lifecycleStatus,
    LIFECYCLE_STATUSES,
    'Estado documental',
  );
  if (lifecycleStatus) parameters.set('lifecycle_status', lifecycleStatus);
  const classification = optionalEnum(
    input.classification,
    CLASSIFICATIONS,
    'Classificação',
  );
  if (classification) parameters.set('classification', classification);
  if (input.tagId !== undefined) {
    parameters.set('tag_id', identifier(input.tagId, 'Tag'));
  }
  if (input.favorite !== undefined) {
    if (input.favorite !== true) throw new TypeError('Favorito inválido.');
    parameters.set('favorite', 'true');
  }
  parameters.set('limit', String(CATALOG_PAGE_SIZE));
  if (input.cursor !== undefined) {
    if (
      typeof input.cursor !== 'string' ||
      input.cursor.length === 0 ||
      input.cursor.length > 4096
    ) {
      throw new TypeError('Cursor inválido.');
    }
    parameters.set('cursor', input.cursor);
  }
  return `/v1/documents?${parameters.toString()}`;
}

export function buildSearchRequest(value) {
  const query = typeof value === 'string' ? value.trim() : '';
  if (query.length === 0 || query.length > SEARCH_MAX_LENGTH) {
    throw new TypeError('Busca inválida.');
  }
  return Object.freeze({
    target: '/v1/search',
    options: Object.freeze({
      method: 'POST',
      body: Object.freeze({ query, limit: CATALOG_PAGE_SIZE }),
    }),
  });
}

function normalizeCatalogItem(item) {
  if (
    !plainObject(item) ||
    typeof item.documentId !== 'string' ||
    typeof item.title !== 'string' ||
    typeof item.description !== 'string' ||
    typeof item.classification !== 'string' ||
    typeof item.lifecycleStatus !== 'string' ||
    typeof item.updatedAt !== 'string' ||
    typeof item.favorite !== 'boolean'
  ) {
    throw new TypeError('Resposta de catálogo inválida.');
  }
  return Object.freeze({ ...item });
}

export function normalizeCatalogPayload(payload) {
  if (
    !plainObject(payload) ||
    !Array.isArray(payload.items) ||
    !(
      payload.next_cursor === null ||
      (typeof payload.next_cursor === 'string' && payload.next_cursor.length > 0)
    )
  ) {
    throw new TypeError('Resposta de catálogo inválida.');
  }
  return Object.freeze({
    items: Object.freeze(payload.items.map(normalizeCatalogItem)),
    nextCursor: payload.next_cursor,
  });
}

function normalizeSearchPayload(payload) {
  if (!plainObject(payload) || !Array.isArray(payload.results)) {
    throw new TypeError('Resposta de busca inválida.');
  }
  const items = payload.results.map((item) => {
    if (
      !plainObject(item) ||
      typeof item.document_id !== 'string' ||
      typeof item.version_id !== 'string' ||
      typeof item.title !== 'string' ||
      typeof item.excerpt !== 'string' ||
      typeof item.score !== 'number'
    ) {
      throw new TypeError('Resposta de busca inválida.');
    }
    return Object.freeze({
      documentId: item.document_id,
      versionId: item.version_id,
      title: item.title,
      excerpt: item.excerpt,
      score: item.score,
      source: 'search',
      favorite: null,
    });
  });
  return Object.freeze({ items: Object.freeze(items), nextCursor: null });
}

function normalizeCollection(item) {
  if (
    !plainObject(item) ||
    typeof item.collectionId !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.slug !== 'string'
  ) {
    throw new TypeError('Resposta de coleções inválida.');
  }
  return Object.freeze({ ...item });
}

function normalizeTag(item) {
  if (
    !plainObject(item) ||
    typeof item.tagId !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.slug !== 'string'
  ) {
    throw new TypeError('Resposta de tags inválida.');
  }
  return Object.freeze({ ...item });
}

function normalizeMetadataPayload(collectionsPayload, tagsPayload) {
  if (!Array.isArray(collectionsPayload?.items) || !Array.isArray(tagsPayload?.items)) {
    throw new TypeError('Metadados do catálogo inválidos.');
  }
  return Object.freeze({
    collections: Object.freeze(collectionsPayload.items.map(normalizeCollection)),
    tags: Object.freeze(tagsPayload.items.map(normalizeTag)),
  });
}

function stateFor(mode, normalized, extra = {}) {
  return Object.freeze({
    status: normalized.items.length === 0 ? 'empty' : 'ready',
    mode,
    items: normalized.items,
    nextCursor: normalized.nextCursor,
    ...extra,
  });
}

export function createCatalogController(options = {}) {
  const client = options.client;
  const onState = options.onState ?? (() => {});
  if (!client || typeof client.request !== 'function' || typeof onState !== 'function') {
    throw new TypeError('Dependências obrigatórias do catálogo estão ausentes.');
  }

  let activeRequest = null;
  let requestVersion = 0;
  let destroyed = false;
  let currentState = Object.freeze({
    status: 'idle',
    mode: 'catalog',
    items: Object.freeze([]),
    nextCursor: null,
    filters: Object.freeze({}),
  });

  function cancelActive() {
    requestVersion += 1;
    activeRequest?.abort();
    activeRequest = null;
  }

  function begin(mode) {
    cancelActive();
    const version = requestVersion;
    const controller = new AbortController();
    activeRequest = controller;
    onState(
      Object.freeze({
        status: 'loading',
        mode,
        items: currentState.items,
        nextCursor: currentState.nextCursor,
      }),
    );
    return { controller, version };
  }

  function isStale(request) {
    return destroyed || request.version !== requestVersion || request.controller.signal.aborted;
  }

  async function loadList(filters = {}, options = {}) {
    const append = options.append === true;
    const request = begin('catalog');
    try {
      const response = await client.request(buildCatalogTarget(filters), {
        signal: request.controller.signal,
      });
      if (isStale(request)) return null;
      const normalized = normalizeCatalogPayload(response.data);
      const merged = append
        ? Object.freeze([...currentState.items, ...normalized.items])
        : normalized.items;
      currentState = stateFor(
        'catalog',
        { items: merged, nextCursor: normalized.nextCursor },
        { filters: Object.freeze({ ...filters, cursor: undefined }) },
      );
      onState(currentState);
      return currentState;
    } catch (error) {
      if (isStale(request) || error?.code === 'request_aborted') return null;
      currentState = Object.freeze({
        status: 'error',
        mode: 'catalog',
        items: Object.freeze([]),
        nextCursor: null,
        error,
        filters: Object.freeze({ ...filters, cursor: undefined }),
      });
      onState(currentState);
      return currentState;
    } finally {
      if (!isStale(request)) activeRequest = null;
    }
  }

  async function search(value) {
    const requestDefinition = buildSearchRequest(value);
    const request = begin('search');
    try {
      const response = await client.request(requestDefinition.target, {
        ...requestDefinition.options,
        signal: request.controller.signal,
      });
      if (isStale(request)) return null;
      const normalized = normalizeSearchPayload(response.data);
      currentState = stateFor('search', normalized, {
        query: requestDefinition.options.body.query,
      });
      onState(currentState);
      return currentState;
    } catch (error) {
      if (isStale(request) || error?.code === 'request_aborted') return null;
      currentState = Object.freeze({
        status: 'error',
        mode: 'search',
        items: Object.freeze([]),
        nextCursor: null,
        error,
        query: requestDefinition.options.body.query,
      });
      onState(currentState);
      return currentState;
    } finally {
      if (!isStale(request)) activeRequest = null;
    }
  }

  async function loadNext() {
    if (currentState.mode !== 'catalog' || !currentState.nextCursor) return currentState;
    return loadList(
      { ...currentState.filters, cursor: currentState.nextCursor },
      { append: true },
    );
  }

  async function loadMetadata() {
    const [collections, tags] = await Promise.all([
      client.request('/v1/collections'),
      client.request('/v1/tags'),
    ]);
    return normalizeMetadataPayload(collections.data, tags.data);
  }

  return Object.freeze({
    loadList,
    loadNext,
    search,
    loadMetadata,
    cancelActive,
    getState: () => currentState,
    destroy() {
      destroyed = true;
      cancelActive();
      currentState = Object.freeze({
        status: 'destroyed',
        mode: 'catalog',
        items: Object.freeze([]),
        nextCursor: null,
      });
    },
  });
}

export function createRecentStore(options = {}) {
  let portal = identifier(options.portal, 'Portal');
  const now = options.now ?? Date.now;
  const limit = options.limit ?? DEFAULT_RECENT_LIMIT;
  if (typeof now !== 'function' || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new TypeError('Configuração de recentes inválida.');
  }

  const entries = new Map();

  function trim() {
    const ordered = [...entries.entries()].sort((left, right) => right[1] - left[1]);
    entries.clear();
    for (const [documentId, timestamp] of ordered.slice(0, limit)) {
      entries.set(documentId, timestamp);
    }
  }

  return Object.freeze({
    record(documentId) {
      const normalized = identifier(documentId, 'Documento');
      entries.delete(normalized);
      entries.set(normalized, Number(now()));
      trim();
    },
    list() {
      return Object.freeze(
        [...entries.entries()]
          .sort((left, right) => right[1] - left[1])
          .map(([documentId]) => documentId),
      );
    },
    setPortal(nextPortal) {
      const normalized = identifier(nextPortal, 'Portal');
      if (normalized === portal) return;
      entries.clear();
      portal = normalized;
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    },
  });
}

export function bindCatalogLifecycle(options = {}) {
  const target = options.target;
  const cancelActive = options.cancelActive ?? (() => {});
  const clearSensitiveState = options.clearSensitiveState ?? (() => {});
  const onRestored = options.onRestored ?? (() => {});
  if (!target?.addEventListener || !target?.removeEventListener) {
    throw new TypeError('Alvo de ciclo de vida inválido.');
  }

  const onPageShow = (event) => {
    if (event?.persisted !== true) return;
    cancelActive();
    clearSensitiveState('bfcache');
    onRestored();
  };
  target.addEventListener('pageshow', onPageShow);

  return Object.freeze({
    destroy() {
      target.removeEventListener('pageshow', onPageShow);
    },
  });
}
