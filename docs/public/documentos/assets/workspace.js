import {
  bindCatalogLifecycle,
  createCatalogController,
  createRecentStore,
} from './catalog.js';
import { createDocumentDetailController } from './detail.js';

function requiredMethod(value, name) {
  if (typeof value?.[name] !== 'function') {
    throw new TypeError(`Dependência do workspace inválida: ${name}.`);
  }
}

export function createDocumentosWorkspace(options = {}) {
  const client = options.client;
  const portal = options.portal;
  const view = options.view;
  const catalogFactory = options.createCatalogController ?? createCatalogController;
  const detailFactory = options.createDetailController ?? createDocumentDetailController;
  const recentFactory = options.createRecentStore ?? createRecentStore;
  const lifecycleFactory = options.bindLifecycle ?? bindCatalogLifecycle;
  const lifecycleTarget = options.lifecycleTarget ?? globalThis.window;

  if (!client || typeof client.request !== 'function' || typeof portal !== 'string') {
    throw new TypeError('Dependências obrigatórias do workspace estão ausentes.');
  }
  for (const method of [
    'bind',
    'setMetadata',
    'renderCatalog',
    'renderDetail',
    'renderVersions',
    'renderRecent',
    'renderCollections',
    'clearSensitiveState',
    'destroy',
  ]) {
    requiredMethod(view, method);
  }

  let destroyed = false;
  let started = false;
  let startPromise = null;
  let unbindView = null;
  let metadata = Object.freeze({ collections: Object.freeze([]), tags: Object.freeze([]) });
  let activeView = 'documentos';
  let activeFilters = Object.freeze({});
  const catalogSnapshots = new Map();
  const recent = recentFactory({ portal });

  const catalog = catalogFactory({
    client,
    onState(state) {
      if (destroyed) return;
      for (const item of state.items ?? []) {
        if (typeof item?.documentId === 'string') {
          catalogSnapshots.set(item.documentId, Object.freeze({ ...item }));
        }
      }
      view.renderCatalog(state);
    },
  });

  const detail = detailFactory({
    client,
    onState(state) {
      if (destroyed) return;
      view.renderDetail(state);
      const item = state.detail?.document;
      if (typeof item?.documentId === 'string') {
        catalogSnapshots.set(item.documentId, Object.freeze({ ...item, favorite: state.favorite }));
      }
    },
  });

  function cancelEffects() {
    catalog.cancelActive();
    detail.cancel();
  }

  function clearSensitiveState(reason) {
    recent.clear();
    catalogSnapshots.clear();
    view.clearSensitiveState(reason);
  }

  async function loadInitialState() {
    metadata = await catalog.loadMetadata();
    if (destroyed) return null;
    view.setMetadata(metadata);
    activeView = 'documentos';
    activeFilters = Object.freeze({});
    return catalog.loadList({});
  }

  const lifecycle = lifecycleFactory({
    target: lifecycleTarget,
    cancelActive: cancelEffects,
    clearSensitiveState,
    onRestored: loadInitialState,
  });

  async function refreshCatalog() {
    if (destroyed) return null;
    if (activeView === 'favoritos') return catalog.loadList({ favorite: true });
    if (activeView === 'documentos') return catalog.loadList(activeFilters);
    return null;
  }

  async function navigate(target) {
    if (destroyed) return null;
    if (target === 'documentos') {
      activeView = target;
      activeFilters = Object.freeze({});
      return catalog.loadList({});
    }
    if (target === 'favoritos') {
      activeView = target;
      activeFilters = Object.freeze({ favorite: true });
      return catalog.loadList(activeFilters);
    }
    if (target === 'recentes') {
      activeView = target;
      const items = recent
        .list()
        .map((documentId) => catalogSnapshots.get(documentId))
        .filter(Boolean);
      view.renderRecent(Object.freeze(items));
      return items;
    }
    if (target === 'colecoes') {
      activeView = target;
      view.renderCollections(metadata.collections);
      return metadata.collections;
    }
    throw new TypeError('Visualização inválida.');
  }

  async function applyFilters(filters) {
    activeView = 'documentos';
    activeFilters = Object.freeze({ ...filters });
    return catalog.loadList(activeFilters);
  }

  async function openDocument(documentId, openOptions = {}) {
    recent.record(documentId);
    const loaded = await detail.load(documentId, openOptions);
    if (!loaded || destroyed) return loaded;
    const versions = await detail.loadVersions();
    if (!destroyed) view.renderVersions(versions);
    return loaded;
  }

  async function mutate(operation) {
    const result = await operation();
    await refreshCatalog();
    return result;
  }

  const handlers = Object.freeze({
    navigate,
    search(query) {
      activeView = 'busca';
      return catalog.search(query);
    },
    applyFilters,
    loadNext: () => catalog.loadNext(),
    openDocument,
    updateMetadata: (patch) => mutate(() => detail.updateMetadata(patch)),
    setFavorite: (value) => mutate(() => detail.setFavorite(value)),
    archive: () => mutate(() => detail.archive()),
    restore: () => mutate(() => detail.restore()),
    requestDeletion: (reason) => mutate(() => detail.requestDeletion(reason)),
    promoteVersion: (versionId) => mutate(() => detail.promoteVersion(versionId)),
  });

  return Object.freeze({
    async start() {
      if (destroyed) throw new TypeError('Workspace encerrado.');
      if (started) return startPromise;
      started = true;
      unbindView = view.bind(handlers);
      startPromise = loadInitialState();
      return startPromise;
    },
    ...handlers,
    destroy(reason = 'destroyed') {
      if (destroyed) return;
      cancelEffects();
      clearSensitiveState(reason);
      destroyed = true;
      lifecycle.destroy();
      catalog.destroy();
      detail.destroy();
      unbindView?.();
      view.destroy();
    },
  });
}
