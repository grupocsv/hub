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
  const favoritesEnabled = options.features?.favorites === true;

  if (!client || typeof client.request !== 'function' || typeof portal !== 'string') {
    throw new TypeError('Dependências obrigatórias do workspace estão ausentes.');
  }
  for (const method of [
    'bind',
    'setMetadata',
    'setFilters',
    'renderCatalog',
    'renderDetail',
    'renderVersions',
    'renderVersionsError',
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
  let activeDocumentId = null;
  let selectionGeneration = 0;
  let silentDetailGeneration = null;
  const catalogSnapshots = new Map();
  const recent = recentFactory({ portal });

  function rememberSnapshot(item) {
    if (typeof item?.documentId !== 'string') return;
    const previous = catalogSnapshots.get(item.documentId);
    const previousTime = Date.parse(previous?.updatedAt);
    const incomingTime = Date.parse(item.updatedAt);
    if (
      previous &&
      Number.isFinite(previousTime) &&
      Number.isFinite(incomingTime) &&
      incomingTime < previousTime
    ) {
      return;
    }
    const snapshot = { ...previous, ...item };
    if (typeof item.favorite !== 'boolean') {
      snapshot.favorite =
        typeof previous?.favorite === 'boolean' ? previous.favorite : null;
    }
    catalogSnapshots.set(item.documentId, Object.freeze(snapshot));
  }

  const catalog = catalogFactory({
    client,
    onState(state) {
      if (destroyed) return;
      for (const item of state.items ?? []) {
        if (item?.source !== 'search') rememberSnapshot(item);
      }
      view.renderCatalog(state);
    },
  });

  const detail = detailFactory({
    client,
    onState(state) {
      if (destroyed) return;
      if (silentDetailGeneration !== selectionGeneration) {
        view.renderDetail(state);
      }
      const item = state.detail?.document;
      if (typeof item?.documentId === 'string') {
        rememberSnapshot({ ...item, favorite: state.favorite });
      }
    },
  });

  function cancelEffects() {
    catalog.cancelActive();
    detail.cancel();
  }

  function clearSensitiveState(reason) {
    selectionGeneration += 1;
    silentDetailGeneration = null;
    activeDocumentId = null;
    recent.clear();
    catalogSnapshots.clear();
    view.clearSensitiveState(reason);
  }

  async function loadInitialState() {
    const loadedMetadata = await catalog.loadMetadata();
    if (destroyed || !loadedMetadata) return null;
    metadata = loadedMetadata;
    view.setMetadata(metadata);
    activeView = 'documentos';
    activeFilters = Object.freeze({});
    return catalog.loadList({});
  }

  const lifecycle = lifecycleFactory({
    target: lifecycleTarget,
    cancelActive: cancelEffects,
    clearSensitiveState,
  });

  async function refreshCatalog() {
    if (destroyed) return null;
    if (activeView === 'favoritos') return catalog.loadList({ favorite: true });
    if (activeView === 'documentos') return catalog.loadList(activeFilters);
    return null;
  }

  function recentItems() {
    return Object.freeze(
      recent
        .list()
        .map((documentId) => catalogSnapshots.get(documentId))
        .filter(Boolean),
    );
  }

  async function navigate(target) {
    if (destroyed) return null;
    if (target === 'documentos') {
      activeView = target;
      activeFilters = Object.freeze({});
      view.setFilters(activeFilters);
      return catalog.loadList({});
    }
    if (target === 'favoritos') {
      if (!favoritesEnabled) return null;
      activeView = target;
      activeFilters = Object.freeze({ favorite: true });
      view.setFilters({});
      return catalog.loadList(activeFilters);
    }
    if (target === 'recentes') {
      activeView = target;
      catalog.cancelActive();
      view.setFilters({});
      const items = recentItems();
      view.renderRecent(items);
      return items;
    }
    if (target === 'colecoes') {
      activeView = target;
      catalog.cancelActive();
      view.setFilters({});
      view.renderCollections(metadata.collections);
      return metadata.collections;
    }
    throw new TypeError('Visualização inválida.');
  }

  async function applyFilters(filters) {
    activeView = 'documentos';
    activeFilters = Object.freeze({ ...filters });
    view.setFilters(activeFilters);
    return catalog.loadList(activeFilters);
  }

  async function openDocument(documentId, openOptions = {}) {
    selectionGeneration += 1;
    const openingGeneration = selectionGeneration;
    silentDetailGeneration = null;
    activeDocumentId = null;
    view.renderVersions([]);
    const loaded = await detail.load(documentId, openOptions);
    if (
      !loaded ||
      destroyed ||
      openingGeneration !== selectionGeneration ||
      loaded.document?.documentId !== documentId
    ) {
      return null;
    }

    activeDocumentId = loaded.document.documentId;
    recent.record(activeDocumentId, loaded.document.updatedAt);
    try {
      const versions = await detail.loadVersions();
      if (
        Array.isArray(versions) &&
        !destroyed &&
        openingGeneration === selectionGeneration &&
        activeDocumentId === loaded.document.documentId
      ) {
        view.renderVersions(versions);
      }
    } catch {
      if (
        !destroyed &&
        openingGeneration === selectionGeneration &&
        activeDocumentId === loaded.document.documentId
      ) {
        view.renderVersionsError();
      }
    }
    return loaded;
  }

  function closeDocument() {
    selectionGeneration += 1;
    silentDetailGeneration = null;
    activeDocumentId = null;
    detail.cancel();
    view.renderVersions([]);
  }

  function recordConfirmedMutation(result, documentId) {
    const document = result?.document;
    if (
      !document ||
      document.documentId !== documentId ||
      typeof document.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(document.updatedAt))
    ) {
      return;
    }
    rememberSnapshot(document);
    try {
      recent.record(documentId, document.updatedAt);
    } catch {
      return;
    }
  }

  async function mutate(operation, expectedDocumentId = activeDocumentId, options = {}) {
    if (
      destroyed ||
      !activeDocumentId ||
      (expectedDocumentId && expectedDocumentId !== activeDocumentId)
    ) {
      return null;
    }
    const mutationGeneration = selectionGeneration;
    const mutationDocumentId = activeDocumentId;
    const result = await operation();
    if (
      result === null ||
      destroyed ||
      mutationGeneration !== selectionGeneration ||
      mutationDocumentId !== activeDocumentId
    ) {
      return null;
    }
    options.updateSnapshot?.(result, mutationDocumentId);
    recordConfirmedMutation(result, mutationDocumentId);
    if (options.refreshDocument === true) {
      try {
        const refreshed = await detail.refresh();
        if (
          refreshed &&
          !destroyed &&
          mutationGeneration === selectionGeneration &&
          mutationDocumentId === activeDocumentId
        ) {
          recordConfirmedMutation(refreshed, mutationDocumentId);
        }
      } catch {
        // A mutação foi confirmada; Recentes preserva a última ordem conhecida.
      }
      if (
        destroyed ||
        mutationGeneration !== selectionGeneration ||
        mutationDocumentId !== activeDocumentId
      ) {
        return null;
      }
    }
    if (options.refreshVersions === true) {
      try {
        const versions = await detail.loadVersions();
        if (
          Array.isArray(versions) &&
          !destroyed &&
          mutationGeneration === selectionGeneration &&
          mutationDocumentId === activeDocumentId
        ) {
          view.renderVersions(versions);
        }
      } catch {
        if (
          !destroyed &&
          mutationGeneration === selectionGeneration &&
          mutationDocumentId === activeDocumentId
        ) {
          view.renderVersionsError();
        }
      }
    }
    if (activeView === 'recentes') {
      view.renderRecent(recentItems());
    }
    try {
      await refreshCatalog();
    } catch {
      // A mutação já foi confirmada; o controlador do catálogo representa a falha de atualização.
    }
    return result;
  }

  async function toggleCardFavorite(value, documentId, openOptions = {}) {
    if (destroyed || !favoritesEnabled || typeof documentId !== 'string') return null;
    selectionGeneration += 1;
    const toggleGeneration = selectionGeneration;
    silentDetailGeneration = toggleGeneration;
    activeDocumentId = null;

    try {
      const loaded = await detail.load(documentId, openOptions);
      if (
        !loaded ||
        destroyed ||
        toggleGeneration !== selectionGeneration ||
        loaded.document?.documentId !== documentId
      ) {
        return null;
      }
      activeDocumentId = documentId;
      return await mutate(() => detail.setFavorite(value), documentId, {
        updateSnapshot(result, mutationDocumentId) {
          if (typeof result === 'boolean') {
            rememberSnapshot({ documentId: mutationDocumentId, favorite: result });
          }
        },
      });
    } finally {
      if (toggleGeneration === selectionGeneration) {
        activeDocumentId = null;
        silentDetailGeneration = null;
        detail.cancel();
      }
    }
  }

  const handlers = Object.freeze({
    navigate,
    search(query) {
      activeView = 'busca';
      view.setFilters({});
      return catalog.search(query);
    },
    applyFilters,
    loadNext: () =>
      ['documentos', 'favoritos', 'busca'].includes(activeView)
        ? catalog.loadNext()
        : null,
    openDocument,
    toggleCardFavorite,
    closeDocument,
    updateMetadata: (patch, documentId) =>
      mutate(() => detail.updateMetadata(patch), documentId),
    setFavorite: (value, documentId) =>
      favoritesEnabled
        ? mutate(() => detail.setFavorite(value), documentId, {
          updateSnapshot(result, mutationDocumentId) {
            if (typeof result === 'boolean') {
              rememberSnapshot({ documentId: mutationDocumentId, favorite: result });
            }
          },
        })
        : null,
    archive: (documentId) => mutate(() => detail.archive(), documentId),
    restore: (documentId) => mutate(() => detail.restore(), documentId),
    requestDeletion: (reason, documentId) =>
      mutate(() => detail.requestDeletion(reason), documentId, {
        refreshDocument: true,
      }),
    promoteVersion: (versionId, documentId) =>
      mutate(() => detail.promoteVersion(versionId), documentId, {
        refreshDocument: true,
        refreshVersions: true,
      }),
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
