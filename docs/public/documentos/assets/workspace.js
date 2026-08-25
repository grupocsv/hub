import {
  bindCatalogLifecycle,
  createCatalogController,
  createRecentStore,
} from "./catalog.js";
import { createDocumentDetailController } from "./detail.js";
import {
  createPublicLinksController,
  derivePublicLinkCapabilities,
} from "./public-links.js";
import {
  createDeletionAdminController,
  deriveDeletionAdminCapabilities,
} from "./deletion-admin.js";
import {
  createDocumentViewerController,
  createViewerRouteController,
  selectViewerVersion,
} from "./viewer.js";
import { createDocumentUploadController } from "./upload.js";

function requiredMethod(value, name) {
  if (typeof value?.[name] !== "function") {
    throw new TypeError(`Dependência do workspace inválida: ${name}.`);
  }
}

function plainUploadInput(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function createDocumentosWorkspace(options = {}) {
  const client = options.client;
  const portal = options.portal;
  const view = options.view;
  const catalogFactory =
    options.createCatalogController ?? createCatalogController;
  const detailFactory =
    options.createDetailController ?? createDocumentDetailController;
  const cardDetailFactory =
    options.createCardDetailController ?? detailFactory;
  const recentFactory = options.createRecentStore ?? createRecentStore;
  const lifecycleFactory = options.bindLifecycle ?? bindCatalogLifecycle;
  const lifecycleTarget = options.lifecycleTarget ?? globalThis.window;
  const favoritesEnabled = options.features?.favorites === true;
  const searchEnabled = options.features?.search === true;
  const viewerEnabled = options.features?.viewer === true;
  const uploadEnabled = options.features?.upload === true;
  const viewerFactory =
    options.createViewerController ?? createDocumentViewerController;
  const routeFactory =
    options.createViewerRouteController ?? createViewerRouteController;
  const uploadFactory =
    options.createUploadController ?? createDocumentUploadController;
  const publicLinksFactory =
    options.createPublicLinksController ?? createPublicLinksController;
  const deletionAdminFactory =
    options.createDeletionAdminController ?? createDeletionAdminController;

  if (
    !client ||
    typeof client.request !== "function" ||
    typeof portal !== "string"
  ) {
    throw new TypeError(
      "Dependências obrigatórias do workspace estão ausentes.",
    );
  }
  for (const method of [
    "bind",
    "setMetadata",
    "setFilters",
    "renderCatalog",
    "renderDetail",
    "renderVersions",
    "renderVersionsError",
    "renderPublicLinks",
    "renderPublicLinksAdmin",
    "renderDeletionRequests",
    "renderRecent",
    "renderCollections",
    "clearSensitiveState",
    "destroy",
  ]) {
    requiredMethod(view, method);
  }
  if (viewerEnabled) {
    requiredMethod(view, "renderViewer");
    requiredMethod(view, "renderPdfPage");
  }
  if (uploadEnabled) {
    requiredMethod(view, "renderUpload");
    requiredMethod(view, "openUpload");
    requiredMethod(view, "closeUpload");
  }

  let destroyed = false;
  let callbacksEnabled = true;
  let started = false;
  let startPromise = null;
  let unbindView = null;
  let metadata = Object.freeze({
    collections: Object.freeze([]),
    tags: Object.freeze([]),
    permissions: Object.freeze([]),
  });
  let activeView = "documentos";
  let activeFilters = Object.freeze({});
  let activeDocumentId = null;
  let pendingDetailDocumentId = null;
  let activeDetailControllerGeneration = null;
  let activeDetail = null;
  let activeVersions = Object.freeze([]);
  let activeVersionsRequest = null;
  let versionsLoadGeneration = 0;
  let selectionGeneration = 0;
  let viewerOpeningGeneration = 0;
  let activeViewerDocumentId = null;
  let uploadPresentationActive = false;
  let activePublicLinks = Object.freeze([]);
  let publicLinkCapabilities = Object.freeze({
    read: false,
    create: false,
    update: false,
  });
  let activePublicLinksRequest = null;
  let activePublicLinksMutation = null;
  let tenantPublicLinks = Object.freeze([]);
  let activeTenantPublicLinkFilters = Object.freeze({});
  let tenantPublicLinkCapabilities = Object.freeze({
    read: false,
    create: false,
    update: false,
  });
  let activeTenantPublicLinksRequest = null;
  let activeTenantPublicLinksMutation = null;
  let activeDeletionRequests = Object.freeze([]);
  let deletionAdminCapabilities = Object.freeze({
    read: false,
    review: false,
    cancel: false,
  });
  let activeDeletionRequest = null;
  const catalogSnapshots = new Map();
  const pendingCardFavorites = new Set();
  const activeCardFavoriteControllers = new Map();
  const recent = recentFactory({ portal });

  function acceptsCallbacks() {
    return !destroyed && callbacksEnabled;
  }

  function neutralDetailState(status, documentId, error = null) {
    return Object.freeze({
      status,
      documentId,
      detail: null,
      favorite: null,
      actions: Object.freeze({}),
      ...(error ? { error } : {}),
    });
  }

  function versionsForDocument(items, documentId) {
    if (!Array.isArray(items)) {
      throw new TypeError("Histórico de versões inválido.");
    }
    return Object.freeze(
      items.map((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item) ||
          (Object.hasOwn(item, "documentId") &&
            item.documentId !== documentId)
        ) {
          throw new TypeError("Histórico de versões inválido.");
        }
        return Object.freeze({ ...item, documentId });
      }),
    );
  }

  function rememberSnapshot(item) {
    if (typeof item?.documentId !== "string") return;
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
    if (typeof item.favorite !== "boolean") {
      snapshot.favorite =
        typeof previous?.favorite === "boolean" ? previous.favorite : null;
    }
    catalogSnapshots.set(item.documentId, Object.freeze(snapshot));
  }

  const catalog = catalogFactory({
    client,
    onState(state) {
      if (!acceptsCallbacks()) return;
      for (const item of state.items ?? []) {
        if (item?.source !== "search") rememberSnapshot(item);
      }
      view.renderCatalog(state);
    },
  });

  const detail = detailFactory({
    client,
    onState(state) {
      if (!acceptsCallbacks()) return;
      const item = state.detail?.document;
      const stateDocumentId =
        typeof state.documentId === "string"
          ? state.documentId
          : typeof item?.documentId === "string"
            ? item.documentId
            : null;
      if (
        stateDocumentId === null ||
        (stateDocumentId !== pendingDetailDocumentId &&
          stateDocumentId !== activeDocumentId)
      ) {
        return;
      }
      if (state.status === "loading") {
        activeDetailControllerGeneration = Number.isSafeInteger(
          state.generation,
        )
          ? state.generation
          : null;
      } else if (
        Number.isSafeInteger(state.generation) &&
        Number.isSafeInteger(activeDetailControllerGeneration) &&
        state.generation !== activeDetailControllerGeneration
      ) {
        return;
      }
      view.renderDetail(state);
      if (typeof item?.documentId === "string") {
        if (item.documentId === activeDocumentId || activeDocumentId === null) {
          activeDetail = state.detail;
        }
        rememberSnapshot({ ...item, favorite: state.favorite });
      }
    },
  });
  const publicLinks = publicLinksFactory({ client });
  const deletionAdmin = deletionAdminFactory({ client });

  const viewer = viewerEnabled
    ? viewerFactory({
        client,
        onState: (state) => {
          if (acceptsCallbacks()) view.renderViewer(state);
        },
        renderPdfPage: (value) => view.renderPdfPage(value),
      })
    : null;
  const upload = uploadEnabled
    ? uploadFactory({
        client,
        fullTextIndexingEnabled: searchEnabled,
        onState: (state) => {
          if (acceptsCallbacks() && uploadPresentationActive)
            view.renderUpload(state);
        },
      })
    : null;
  let viewerRoute = null;

  function cancelEffects() {
    callbacksEnabled = false;
    uploadPresentationActive = false;
    catalog.cancelActive();
    detail.cancel();
    activePublicLinksRequest?.controller?.abort();
    activePublicLinksMutation?.abort();
    activeTenantPublicLinksRequest?.abort();
    activeTenantPublicLinksMutation?.abort();
    activeDeletionRequest?.abort();
    activePublicLinksRequest = null;
    activePublicLinksMutation = null;
    activeTenantPublicLinksRequest = null;
    activeTenantPublicLinksMutation = null;
    activeDeletionRequest = null;
    for (const controller of activeCardFavoriteControllers.values()) {
      controller.cancel();
    }
    void viewer?.destroy("cancelled");
    void upload?.cancel();
  }

  function clearSensitiveState(reason) {
    callbacksEnabled = false;
    uploadPresentationActive = false;
    selectionGeneration += 1;
    activeDocumentId = null;
    pendingDetailDocumentId = null;
    activeDetailControllerGeneration = null;
    activeDetail = null;
    activeVersions = Object.freeze([]);
    activeVersionsRequest = null;
    versionsLoadGeneration += 1;
    activePublicLinks = Object.freeze([]);
    publicLinkCapabilities = Object.freeze({
      read: false,
      create: false,
      update: false,
    });
    tenantPublicLinks = Object.freeze([]);
    activeTenantPublicLinkFilters = Object.freeze({});
    tenantPublicLinkCapabilities = Object.freeze({
      read: false,
      create: false,
      update: false,
    });
    activeDeletionRequests = Object.freeze([]);
    deletionAdminCapabilities = Object.freeze({
      read: false,
      review: false,
      cancel: false,
    });
    viewerOpeningGeneration += 1;
    activeViewerDocumentId = null;
    pendingCardFavorites.clear();
    activeCardFavoriteControllers.clear();
    recent.clear();
    catalogSnapshots.clear();
    view.clearSensitiveState(reason);
  }

  async function loadInitialState() {
    const loadedMetadata = await catalog.loadMetadata();
    if (!acceptsCallbacks() || !loadedMetadata) return null;
    metadata = loadedMetadata;
    deletionAdminCapabilities = deriveDeletionAdminCapabilities(
      metadata.permissions,
    );
    tenantPublicLinkCapabilities = derivePublicLinkCapabilities(
      metadata.permissions,
    );
    view.setMetadata(metadata);
    activeView = "documentos";
    activeFilters = Object.freeze({});
    return catalog.loadList({});
  }

  const lifecycle = lifecycleFactory({
    target: lifecycleTarget,
    cancelActive: cancelEffects,
    clearSensitiveState,
  });

  async function refreshCatalog() {
    if (!acceptsCallbacks()) return null;
    if (activeView === "favoritos") return catalog.loadList({ favorite: true });
    if (activeView === "documentos") return catalog.loadList(activeFilters);
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

  async function loadDeletionRequests() {
    if (!acceptsCallbacks() || !deletionAdminCapabilities.read) return null;
    activeDeletionRequest?.abort();
    const controller = new AbortController();
    activeDeletionRequest = controller;
    view.renderDeletionRequests({
      status: "loading",
      items: activeDeletionRequests,
      capabilities: deletionAdminCapabilities,
    });
    try {
      const items = await deletionAdmin.list({ signal: controller.signal });
      if (
        controller.signal.aborted ||
        activeDeletionRequest !== controller ||
        !acceptsCallbacks() ||
        activeView !== "exclusoes"
      ) {
        return null;
      }
      activeDeletionRequests = items;
      view.renderDeletionRequests({
        status: "ready",
        items,
        capabilities: deletionAdminCapabilities,
      });
      return items;
    } catch (error) {
      if (controller.signal.aborted || error?.code === "request_aborted") {
        return null;
      }
      if (acceptsCallbacks() && activeView === "exclusoes") {
        view.renderDeletionRequests({
          status: "error",
          items: activeDeletionRequests,
          capabilities: deletionAdminCapabilities,
          error,
        });
      }
      return null;
    } finally {
      if (activeDeletionRequest === controller) activeDeletionRequest = null;
    }
  }

  async function loadTenantPublicLinks(
    filters = activeTenantPublicLinkFilters,
  ) {
    if (!acceptsCallbacks() || !tenantPublicLinkCapabilities.read) return null;
    activeTenantPublicLinkFilters = Object.freeze({ ...filters });
    activeTenantPublicLinksRequest?.abort();
    const controller = new AbortController();
    activeTenantPublicLinksRequest = controller;
    view.renderPublicLinksAdmin({
      status: "loading",
      items: tenantPublicLinks,
      capabilities: tenantPublicLinkCapabilities,
      filters: activeTenantPublicLinkFilters,
    });
    try {
      const items = await publicLinks.listAll(
        activeTenantPublicLinkFilters,
        { signal: controller.signal },
      );
      if (
        controller.signal.aborted ||
        activeTenantPublicLinksRequest !== controller ||
        !acceptsCallbacks() ||
        activeView !== "links-publicos"
      ) {
        return null;
      }
      tenantPublicLinks = items;
      view.renderPublicLinksAdmin({
        status: "ready",
        items,
        capabilities: tenantPublicLinkCapabilities,
        filters: activeTenantPublicLinkFilters,
      });
      return items;
    } catch (error) {
      if (controller.signal.aborted || error?.code === "request_aborted") {
        return null;
      }
      if (acceptsCallbacks() && activeView === "links-publicos") {
        view.renderPublicLinksAdmin({
          status: "error",
          items: tenantPublicLinks,
          capabilities: tenantPublicLinkCapabilities,
          filters: activeTenantPublicLinkFilters,
          error,
        });
      }
      return null;
    } finally {
      if (activeTenantPublicLinksRequest === controller) {
        activeTenantPublicLinksRequest = null;
      }
    }
  }

  async function navigate(target) {
    if (!acceptsCallbacks()) return null;
    if (target !== "exclusoes") {
      activeDeletionRequest?.abort();
      activeDeletionRequest = null;
    }
    if (target !== "links-publicos") {
      activeTenantPublicLinksRequest?.abort();
      activeTenantPublicLinksMutation?.abort();
      activeTenantPublicLinksRequest = null;
      activeTenantPublicLinksMutation = null;
    }
    if (target === "documentos") {
      activeView = target;
      activeFilters = Object.freeze({});
      view.setFilters(activeFilters);
      return catalog.loadList({});
    }
    if (target === "favoritos") {
      if (!favoritesEnabled) return null;
      activeView = target;
      activeFilters = Object.freeze({ favorite: true });
      view.setFilters({});
      return catalog.loadList(activeFilters);
    }
    if (target === "recentes") {
      activeView = target;
      catalog.cancelActive();
      view.setFilters({});
      const items = recentItems();
      view.renderRecent(items);
      return items;
    }
    if (target === "colecoes") {
      activeView = target;
      catalog.cancelActive();
      view.setFilters({});
      view.renderCollections(metadata.collections);
      return metadata.collections;
    }
    if (target === "exclusoes") {
      if (!deletionAdminCapabilities.read) return null;
      activeView = target;
      catalog.cancelActive();
      view.setFilters({});
      return loadDeletionRequests();
    }
    if (target === "links-publicos") {
      if (!tenantPublicLinkCapabilities.read) return null;
      activeView = target;
      catalog.cancelActive();
      view.setFilters({});
      activeTenantPublicLinkFilters = Object.freeze({});
      return loadTenantPublicLinks(activeTenantPublicLinkFilters);
    }
    throw new TypeError("Visualização inválida.");
  }

  async function applyFilters(filters) {
    if (!acceptsCallbacks()) return null;
    activeView = "documentos";
    activeFilters = Object.freeze({ ...filters });
    view.setFilters(activeFilters);
    return catalog.loadList(activeFilters);
  }

  async function loadPublicLinks(documentId, expectedGeneration) {
    activePublicLinksRequest?.controller?.abort();
    if (!publicLinkCapabilities.read) {
      activePublicLinks = Object.freeze([]);
      view.renderPublicLinks({
        status: "hidden",
        items: [],
        capabilities: publicLinkCapabilities,
      });
      return activePublicLinks;
    }
    const operation = {
      controller: new AbortController(),
      documentId,
      generation: expectedGeneration,
    };
    activePublicLinksRequest = operation;
    view.renderPublicLinks({
      status: "loading",
      items: activePublicLinks,
      capabilities: publicLinkCapabilities,
    });
    try {
      const items = await publicLinks.list(documentId, {
        signal: operation.controller.signal,
      });
      if (
        operation.controller.signal.aborted ||
        activePublicLinksRequest !== operation ||
        !acceptsCallbacks() ||
        selectionGeneration !== expectedGeneration ||
        activeDocumentId !== documentId
      ) {
        return null;
      }
      activePublicLinks = items;
      view.renderPublicLinks({
        status: "ready",
        items,
        capabilities: publicLinkCapabilities,
      });
      return items;
    } catch (error) {
      if (
        operation.controller.signal.aborted ||
        error?.code === "request_aborted"
      ) {
        return null;
      }
      if (
        acceptsCallbacks() &&
        selectionGeneration === expectedGeneration &&
        activeDocumentId === documentId
      ) {
        view.renderPublicLinks({
          status: "error",
          items: activePublicLinks,
          capabilities: publicLinkCapabilities,
          error,
        });
      }
      return null;
    } finally {
      if (activePublicLinksRequest === operation) {
        activePublicLinksRequest = null;
      }
    }
  }

  async function openDocument(documentId, openOptions = {}) {
    if (!acceptsCallbacks()) return null;
    selectionGeneration += 1;
    const openingGeneration = selectionGeneration;
    activeDocumentId = null;
    pendingDetailDocumentId = documentId;
    activeDetailControllerGeneration = null;
    activeDetail = null;
    activeVersions = Object.freeze([]);
    activeVersionsRequest = null;
    activePublicLinksRequest?.controller?.abort();
    activePublicLinksRequest = null;
    activePublicLinksMutation?.abort();
    activePublicLinksMutation = null;
    activePublicLinks = Object.freeze([]);
    publicLinkCapabilities = Object.freeze({
      read: false,
      create: false,
      update: false,
    });
    view.renderDetail(neutralDetailState("loading", documentId));
    view.renderVersions([]);
    let loaded;
    try {
      loaded = await detail.load(documentId, openOptions);
    } catch (error) {
      if (
        acceptsCallbacks() &&
        openingGeneration === selectionGeneration &&
        pendingDetailDocumentId === documentId
      ) {
        view.renderDetail(neutralDetailState("error", documentId, error));
      }
      throw error;
    }
    if (
      !loaded ||
      !acceptsCallbacks() ||
      openingGeneration !== selectionGeneration ||
      loaded.document?.documentId !== documentId
    ) {
      return null;
    }

    activeDocumentId = loaded.document.documentId;
    pendingDetailDocumentId = null;
    activeDetail = loaded;
    const resourcePublicLinkCapabilities = derivePublicLinkCapabilities(
      loaded.permissions,
    );
    const canReadPublicLinks =
      tenantPublicLinkCapabilities.read &&
      resourcePublicLinkCapabilities.read;
    publicLinkCapabilities = Object.freeze({
      read: canReadPublicLinks,
      create:
        canReadPublicLinks &&
        tenantPublicLinkCapabilities.create &&
        resourcePublicLinkCapabilities.create,
      update:
        canReadPublicLinks &&
        tenantPublicLinkCapabilities.update &&
        resourcePublicLinkCapabilities.update,
    });
    recent.record(activeDocumentId, loaded.document.updatedAt);
    const publicLinksPromise = loadPublicLinks(
      activeDocumentId,
      openingGeneration,
    );
    const versionsRequest = Object.freeze({
      documentId: activeDocumentId,
      generation: openingGeneration,
      loadGeneration: ++versionsLoadGeneration,
      promise: Promise.resolve().then(() => detail.loadVersions()),
    });
    activeVersionsRequest = versionsRequest;
    try {
      const loadedVersions = await versionsRequest.promise;
      if (loadedVersions === null) return loaded;
      const versions = versionsForDocument(
        loadedVersions,
        versionsRequest.documentId,
      );
      if (
        acceptsCallbacks() &&
        openingGeneration === selectionGeneration &&
        versionsRequest.loadGeneration === versionsLoadGeneration &&
        activeDocumentId === loaded.document.documentId
      ) {
        activeVersions = versions;
        view.renderVersions(versions);
      }
    } catch {
      if (
        acceptsCallbacks() &&
        openingGeneration === selectionGeneration &&
        versionsRequest.loadGeneration === versionsLoadGeneration &&
        activeDocumentId === loaded.document.documentId
      ) {
        view.renderVersionsError();
      }
    } finally {
      if (activeVersionsRequest === versionsRequest) {
        activeVersionsRequest = null;
      }
    }
    await publicLinksPromise;
    return loaded;
  }

  function closeDocument() {
    if (!acceptsCallbacks()) return;
    selectionGeneration += 1;
    activeDocumentId = null;
    pendingDetailDocumentId = null;
    activeDetailControllerGeneration = null;
    activeDetail = null;
    activeVersions = Object.freeze([]);
    activeVersionsRequest = null;
    activePublicLinksRequest?.controller?.abort();
    activePublicLinksRequest = null;
    activePublicLinksMutation?.abort();
    activePublicLinksMutation = null;
    activePublicLinks = Object.freeze([]);
    publicLinkCapabilities = Object.freeze({
      read: false,
      create: false,
      update: false,
    });
    detail.cancel();
    view.renderVersions([]);
    view.renderPublicLinks({
      status: "hidden",
      items: [],
      capabilities: publicLinkCapabilities,
    });
  }

  function recordConfirmedMutation(result, documentId) {
    const document = result?.document;
    if (
      !document ||
      document.documentId !== documentId ||
      typeof document.updatedAt !== "string" ||
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

  async function mutate(
    operation,
    expectedDocumentId = activeDocumentId,
    options = {},
  ) {
    if (
      !acceptsCallbacks() ||
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
      !acceptsCallbacks() ||
      mutationGeneration !== selectionGeneration ||
      mutationDocumentId !== activeDocumentId
    ) {
      return null;
    }
    const refreshVersionsGeneration =
      options.refreshVersions === true ? ++versionsLoadGeneration : null;
    options.updateSnapshot?.(result, mutationDocumentId);
    recordConfirmedMutation(result, mutationDocumentId);
    if (options.refreshDocument === true) {
      try {
        const refreshed = await detail.refresh();
        if (
          refreshed &&
          acceptsCallbacks() &&
          mutationGeneration === selectionGeneration &&
          mutationDocumentId === activeDocumentId
        ) {
          recordConfirmedMutation(refreshed, mutationDocumentId);
        }
      } catch {
        // A mutação foi confirmada; Recentes preserva a última ordem conhecida.
      }
      if (
        !acceptsCallbacks() ||
        mutationGeneration !== selectionGeneration ||
        mutationDocumentId !== activeDocumentId
      ) {
        return null;
      }
    }
    if (
      options.refreshVersions === true &&
      refreshVersionsGeneration === versionsLoadGeneration
    ) {
      try {
        const loadedVersions = await detail.loadVersions();
        const versions =
          loadedVersions === null
            ? null
            : versionsForDocument(loadedVersions, mutationDocumentId);
        if (
          versions !== null &&
          acceptsCallbacks() &&
          refreshVersionsGeneration === versionsLoadGeneration &&
          mutationGeneration === selectionGeneration &&
          mutationDocumentId === activeDocumentId
        ) {
          activeVersions = versions;
          view.renderVersions(versions);
        }
      } catch {
        if (
          acceptsCallbacks() &&
          refreshVersionsGeneration === versionsLoadGeneration &&
          mutationGeneration === selectionGeneration &&
          mutationDocumentId === activeDocumentId
        ) {
          view.renderVersionsError();
        }
      }
    }
    if (activeView === "recentes") {
      view.renderRecent(recentItems());
    }
    try {
      await refreshCatalog();
    } catch {
      // A mutação já foi confirmada; o controlador do catálogo representa a falha de atualização.
    }
    return result;
  }

  async function mutatePublicLink(operation, requiredCapability, documentId) {
    if (
      !acceptsCallbacks() ||
      !activeDocumentId ||
      documentId !== activeDocumentId ||
      publicLinkCapabilities[requiredCapability] !== true ||
      activePublicLinksMutation
    ) {
      return null;
    }
    const mutationGeneration = selectionGeneration;
    const controller = new AbortController();
    activePublicLinksMutation = controller;
    view.renderPublicLinks({
      status: "saving",
      items: activePublicLinks,
      capabilities: publicLinkCapabilities,
    });
    try {
      const result = await operation(controller.signal);
      if (
        controller.signal.aborted ||
        !acceptsCallbacks() ||
        selectionGeneration !== mutationGeneration ||
        activeDocumentId !== documentId
      ) {
        return null;
      }
      return await loadPublicLinks(documentId, mutationGeneration) ?? result;
    } catch (error) {
      if (controller.signal.aborted || error?.code === "request_aborted") {
        return null;
      }
      if (
        acceptsCallbacks() &&
        selectionGeneration === mutationGeneration &&
        activeDocumentId === documentId
      ) {
        view.renderPublicLinks({
          status: "error",
          items: activePublicLinks,
          capabilities: publicLinkCapabilities,
          error,
        });
      }
      throw error;
    } finally {
      if (activePublicLinksMutation === controller) {
        activePublicLinksMutation = null;
      }
    }
  }

  async function decideDeletionRequest(requestId, action) {
    const allowed =
      action === "cancel"
        ? deletionAdminCapabilities.cancel
        : ["approve", "reject"].includes(action) &&
          deletionAdminCapabilities.review;
    if (
      !acceptsCallbacks() ||
      activeView !== "exclusoes" ||
      !allowed ||
      activeDeletionRequest
    ) {
      return null;
    }
    const controller = new AbortController();
    activeDeletionRequest = controller;
    view.renderDeletionRequests({
      status: "saving",
      items: activeDeletionRequests,
      capabilities: deletionAdminCapabilities,
    });
    try {
      const updated = await deletionAdmin.decide(requestId, action, {
        signal: controller.signal,
      });
      if (
        controller.signal.aborted ||
        activeDeletionRequest !== controller ||
        !acceptsCallbacks() ||
        activeView !== "exclusoes"
      ) {
        return null;
      }
      activeDeletionRequests = Object.freeze(
        activeDeletionRequests.map((item) =>
          item.requestId === updated.requestId ? updated : item,
        ),
      );
      activeDeletionRequest = null;
      return await loadDeletionRequests();
    } catch (error) {
      if (controller.signal.aborted || error?.code === "request_aborted") {
        return null;
      }
      if (acceptsCallbacks() && activeView === "exclusoes") {
        view.renderDeletionRequests({
          status: "error",
          items: activeDeletionRequests,
          capabilities: deletionAdminCapabilities,
          error,
        });
      }
      throw error;
    } finally {
      if (activeDeletionRequest === controller) activeDeletionRequest = null;
    }
  }

  async function updateTenantPublicLink(documentId, linkId, patch) {
    if (
      !acceptsCallbacks() ||
      activeView !== "links-publicos" ||
      !tenantPublicLinkCapabilities.update ||
      activeTenantPublicLinksRequest ||
      activeTenantPublicLinksMutation
    ) {
      return null;
    }
    const controller = new AbortController();
    activeTenantPublicLinksMutation = controller;
    view.renderPublicLinksAdmin({
      status: "saving",
      items: tenantPublicLinks,
      capabilities: tenantPublicLinkCapabilities,
      filters: activeTenantPublicLinkFilters,
    });
    try {
      const updated = await publicLinks.update(
        documentId,
        linkId,
        patch,
        { signal: controller.signal },
      );
      if (
        controller.signal.aborted ||
        activeTenantPublicLinksMutation !== controller ||
        !acceptsCallbacks() ||
        activeView !== "links-publicos"
      ) {
        return null;
      }
      tenantPublicLinks = Object.freeze(
        tenantPublicLinks.map((item) =>
          item.linkId === updated.linkId ? updated : item,
        ),
      );
      activeTenantPublicLinksMutation = null;
      return (await loadTenantPublicLinks()) ?? updated;
    } catch (error) {
      if (controller.signal.aborted || error?.code === "request_aborted") {
        return null;
      }
      if (acceptsCallbacks() && activeView === "links-publicos") {
        view.renderPublicLinksAdmin({
          status: "error",
          items: tenantPublicLinks,
          capabilities: tenantPublicLinkCapabilities,
          filters: activeTenantPublicLinkFilters,
          error,
        });
      }
      throw error;
    } finally {
      if (activeTenantPublicLinksMutation === controller) {
        activeTenantPublicLinksMutation = null;
      }
    }
  }

  async function toggleCardFavorite(value, documentId, openOptions = {}) {
    if (
      !acceptsCallbacks() ||
      !favoritesEnabled ||
      typeof documentId !== "string" ||
      pendingCardFavorites.has(documentId)
    )
      return null;
    pendingCardFavorites.add(documentId);
    let cardDetail = null;

    try {
      cardDetail = cardDetailFactory({
        client,
        onState() {},
      });
      for (const method of ["load", "setFavorite", "cancel", "destroy"]) {
        requiredMethod(cardDetail, method);
      }
      activeCardFavoriteControllers.set(documentId, cardDetail);
      const loaded = await cardDetail.load(documentId, openOptions);
      if (
        !loaded ||
        !acceptsCallbacks() ||
        loaded.document?.documentId !== documentId
      ) {
        return null;
      }
      const result = await cardDetail.setFavorite(value);
      if (typeof result !== "boolean" || !acceptsCallbacks()) return null;
      rememberSnapshot({
        documentId,
        favorite: result,
      });
      if (activeView === "recentes") {
        view.renderRecent(recentItems());
      }
      try {
        await refreshCatalog();
      } catch {
        // A mutação foi confirmada; o catálogo pode ser atualizado depois.
      }
      return result;
    } finally {
      if (activeCardFavoriteControllers.get(documentId) === cardDetail) {
        activeCardFavoriteControllers.delete(documentId);
      }
      cardDetail?.destroy();
      pendingCardFavorites.delete(documentId);
    }
  }

  async function openViewerRoute(route) {
    if (!viewerEnabled || !acceptsCallbacks()) return null;
    const openingGeneration = ++viewerOpeningGeneration;
    if (activeViewerDocumentId && activeViewerDocumentId !== route.documentId) {
      activeViewerDocumentId = null;
      void viewer.close("selection_changed").catch(() => {});
    }
    const isCurrent = () =>
      acceptsCallbacks() && openingGeneration === viewerOpeningGeneration;
    const renderUnavailable = () => {
      if (!isCurrent()) return;
      view.renderViewer({
        status: "error",
        title: "Conteúdo Indisponível",
        detail: "Não foi possível acessar este conteúdo.",
        canRetry: false,
      });
    };

    try {
      let loaded = activeDocumentId === route.documentId ? activeDetail : null;
      if (!loaded) loaded = await openDocument(route.documentId);
      if (
        !loaded ||
        !isCurrent() ||
        activeDocumentId !== route.documentId ||
        !Array.isArray(loaded.permissions) ||
        !loaded.permissions.includes("read")
      ) {
        renderUnavailable();
        return null;
      }

      const pendingVersions = activeVersionsRequest;
      if (
        pendingVersions?.documentId === route.documentId &&
        pendingVersions.generation === selectionGeneration &&
        pendingVersions.loadGeneration === versionsLoadGeneration
      ) {
        try {
          await pendingVersions.promise;
        } catch {
          // O estado neutro abaixo é o único detalhe público da falha.
        }
      }
      if (!isCurrent() || activeDocumentId !== route.documentId) {
        return null;
      }
      const version = selectViewerVersion(loaded.document, activeVersions);
      if (!version) {
        renderUnavailable();
        return null;
      }
      activeViewerDocumentId = route.documentId;
      const result = await viewer.open({
        documentId: route.documentId,
        versionId: version.versionId,
        title: loaded.document.title,
        fileName: version.originalName,
        page: route.page,
      });
      if (!isCurrent()) return null;
      if (result === null && activeViewerDocumentId === route.documentId) {
        activeViewerDocumentId = null;
      }
      return result;
    } catch {
      if (activeViewerDocumentId === route.documentId) {
        activeViewerDocumentId = null;
      }
      renderUnavailable();
      return null;
    }
  }

  async function closeViewerRoute() {
    if (!viewerEnabled || !acceptsCallbacks()) return;
    viewerOpeningGeneration += 1;
    activeViewerDocumentId = null;
    await viewer.close("route_closed");
  }

  function openUpload(documentId = null) {
    if (!uploadEnabled || !acceptsCallbacks()) return null;
    if (documentId === null || documentId === undefined) {
      if (!metadata.permissions?.includes("create")) return null;
      const configuration = Object.freeze({
        mode: "create",
        collections: metadata.collections,
      });
      uploadPresentationActive = true;
      view.openUpload(configuration);
      return configuration;
    }
    if (
      documentId !== activeDocumentId ||
      activeDetail?.document?.documentId !== documentId ||
      !activeDetail.permissions?.includes("create_version")
    ) {
      return null;
    }
    const configuration = Object.freeze({
      mode: "version",
      documentId,
      title: activeDetail.document.title,
    });
    uploadPresentationActive = true;
    view.openUpload(configuration);
    return configuration;
  }

  async function refreshAfterUpload(result) {
    if (result?.status !== "succeeded" || !acceptsCallbacks()) return result;
    const versionsRefresh =
      activeDocumentId &&
      result.documentId === activeDocumentId &&
      acceptsCallbacks()
        ? Object.freeze({
            documentId: activeDocumentId,
            selectionGeneration,
            loadGeneration: ++versionsLoadGeneration,
          })
        : null;
    try {
      await refreshCatalog();
    } catch {
      // O upload foi concluído; a atualização do catálogo pode ser repetida depois.
    }
    if (
      versionsRefresh &&
      result.documentId === activeDocumentId &&
      versionsRefresh.documentId === activeDocumentId &&
      versionsRefresh.selectionGeneration === selectionGeneration &&
      versionsRefresh.loadGeneration === versionsLoadGeneration &&
      acceptsCallbacks()
    ) {
      try {
        const loadedVersions = await detail.loadVersions();
        const versions =
          loadedVersions === null
            ? null
            : versionsForDocument(loadedVersions, versionsRefresh.documentId);
        if (
          versions !== null &&
          result.documentId === activeDocumentId &&
          versionsRefresh.documentId === activeDocumentId &&
          versionsRefresh.selectionGeneration === selectionGeneration &&
          versionsRefresh.loadGeneration === versionsLoadGeneration &&
          acceptsCallbacks()
        ) {
          activeVersions = versions;
          view.renderVersions(versions);
        }
      } catch {
        if (
          acceptsCallbacks() &&
          versionsRefresh.loadGeneration === versionsLoadGeneration &&
          versionsRefresh.selectionGeneration === selectionGeneration &&
          versionsRefresh.documentId === activeDocumentId &&
          result.documentId === activeDocumentId
        ) {
          view.renderVersionsError();
        }
      }
    }
    return result;
  }

  async function startUpload(input) {
    if (!uploadEnabled || !acceptsCallbacks() || !plainUploadInput(input))
      return null;
    const documentId =
      typeof input.documentId === "string" ? input.documentId : null;
    let permissions;
    if (documentId === null) {
      if (!metadata.permissions?.includes("create")) return null;
      permissions = metadata.permissions;
    } else {
      if (
        documentId !== activeDocumentId ||
        activeDetail?.document?.documentId !== documentId ||
        !activeDetail.permissions?.includes("create_version")
      ) {
        return null;
      }
      permissions = activeDetail.permissions;
    }
    uploadPresentationActive = true;
    const requestedIndexingPolicy =
      input.indexingPolicy ?? "metadata_only";
    const safeIndexingPolicy =
      !searchEnabled && requestedIndexingPolicy === "full_text"
        ? "metadata_only"
        : requestedIndexingPolicy;
    const safeInput =
      safeIndexingPolicy === input.indexingPolicy
        ? input
        : { ...input, indexingPolicy: safeIndexingPolicy };
    const result = await upload.start({
      ...safeInput,
      permissions: Object.freeze([...permissions]),
    });
    return refreshAfterUpload(result);
  }

  async function retryUpload() {
    if (!uploadEnabled || !acceptsCallbacks()) return null;
    uploadPresentationActive = true;
    return refreshAfterUpload(await upload.retry());
  }

  function cancelUpload() {
    if (!uploadEnabled || !acceptsCallbacks()) return null;
    uploadPresentationActive = false;
    return upload.cancel();
  }

  if (viewerEnabled) {
    viewerRoute = routeFactory({
      locationRef: options.locationRef,
      historyRef: options.historyRef,
      eventTarget: options.routeEventTarget ?? lifecycleTarget,
      onOpen: openViewerRoute,
      onClose: closeViewerRoute,
    });
  }

  const handlers = Object.freeze({
    navigate,
    search(query) {
      if (!searchEnabled || !acceptsCallbacks()) return null;
      activeView = "busca";
      view.setFilters({});
      return catalog.search(query);
    },
    applyFilters,
    applyPublicLinkFilters(filters) {
      if (
        !acceptsCallbacks() ||
        activeView !== "links-publicos" ||
        !tenantPublicLinkCapabilities.read
      ) {
        return null;
      }
      return loadTenantPublicLinks(filters);
    },
    loadNext: () =>
      acceptsCallbacks() &&
      ["documentos", "favoritos", "busca"].includes(activeView)
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
              if (typeof result === "boolean") {
                rememberSnapshot({
                  documentId: mutationDocumentId,
                  favorite: result,
                });
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
    createPublicLink: (input, documentId) =>
      mutatePublicLink(
        (signal) =>
          publicLinks.create(
            documentId,
            {
              ...input,
              versionId: activeDetail?.document?.currentVersionId,
            },
            { signal },
          ),
        "create",
        documentId,
      ),
    updatePublicLink: (linkId, patch, documentId) =>
      mutatePublicLink(
        (signal) => publicLinks.update(documentId, linkId, patch, { signal }),
        "update",
        documentId,
      ),
    updateTenantPublicLink,
    decideDeletionRequest,
    promoteVersion: (versionId, documentId) =>
      mutate(() => detail.promoteVersion(versionId), documentId, {
        refreshDocument: true,
        refreshVersions: true,
      }),
    openViewer: (documentId, page = 1) =>
      viewerEnabled && acceptsCallbacks()
        ? viewerRoute.open(documentId, page)
        : null,
    async viewerGoToPage(page) {
      if (!viewerEnabled || !acceptsCallbacks()) return null;
      const renderedPage = await viewer.goToPage(page);
      if (acceptsCallbacks() && Number.isSafeInteger(renderedPage))
        viewerRoute.setPage(renderedPage);
      return renderedPage;
    },
    viewerDownload: () =>
      viewerEnabled && acceptsCallbacks() ? viewer.download() : null,
    closeViewer: () =>
      viewerEnabled && acceptsCallbacks() ? viewerRoute.close() : null,
    openUpload,
    startUpload,
    retryUpload,
    cancelUpload,
  });

  return Object.freeze({
    async start() {
      if (destroyed) throw new TypeError("Workspace encerrado.");
      if (!callbacksEnabled) throw new TypeError("Workspace suspenso.");
      if (started) return startPromise;
      started = true;
      unbindView = view.bind(handlers);
      startPromise = loadInitialState().then(async (result) => {
        if (viewerEnabled && acceptsCallbacks()) await viewerRoute.start();
        return result;
      });
      return startPromise;
    },
    ...handlers,
    destroy(reason = "destroyed") {
      if (destroyed) return;
      destroyed = true;
      cancelEffects();
      clearSensitiveState(reason);
      viewerRoute?.destroy();
      lifecycle.destroy();
      catalog.destroy();
      detail.destroy();
      void viewer?.destroy(reason);
      upload?.destroy();
      unbindView?.();
      view.destroy();
    },
  });
}
