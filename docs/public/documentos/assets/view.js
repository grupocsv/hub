const CLASSIFICATION_LABELS = Object.freeze({
  public: "Público",
  internal: "Interno",
  restricted: "Restrito",
  confidential: "Confidencial",
});
const LIFECYCLE_LABELS = Object.freeze({
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
  deletion_requested: "Exclusão Solicitada",
  deleting: "Em Exclusão",
  deleted: "Excluído",
});
const UPLOAD_STATE_COPY = Object.freeze({
  validating: "Validando o arquivo.",
  hashing: "Calculando a integridade SHA-256.",
  creating_document: "Criando o registro do documento.",
  creating_session: "Preparando uma sessão privada de envio.",
  uploading: "Transmitindo o arquivo.",
  completing: "Confirmando o recebimento do arquivo.",
  processing: "O arquivo foi recebido e está em processamento.",
  succeeded: "Documento processado com sucesso.",
  security_failed: "O arquivo foi rejeitado pela verificação de segurança.",
  processing_failed: "Não foi possível concluir o processamento do arquivo.",
  timeout: "O processamento continua em segundo plano.",
  cancelled: "Envio cancelado.",
  error: "Não foi possível concluir o envio.",
});
const PROCESSING_LABELS = Object.freeze({
  uploadStatus: "Upload",
  securityStatus: "Segurança",
  previewStatus: "Pré-visualização",
  extractionStatus: "Extração",
  indexingStatus: "Indexação",
  publicationStatus: "Publicação",
  jobStatus: "Processamento",
});
const PUBLIC_LINK_STATUS_LABELS = Object.freeze({
  active: "Ativo",
  inactive: "Inativo",
});
const RESERVED_PUBLIC_SLUGS = new Set([
  "admin",
  "api",
  "docs",
  "health",
  "login",
  "openapi",
]);
const DELETION_STATUS_LABELS = Object.freeze({
  requested: "Aguardando Análise",
  pending: "Aguardando Análise",
  approved: "Exclusão Lógica Aprovada",
  executed: "Excluído Logicamente",
  rejected: "Rejeitada",
  cancelled: "Cancelada",
});
const ACTIONS = Object.freeze([
  Object.freeze({ id: "open", label: "Abrir Documento" }),
  Object.freeze({ id: "favorite", label: "Favoritar" }),
  Object.freeze({ id: "uploadVersion", label: "Enviar Nova Versão" }),
  Object.freeze({ id: "edit", label: "Editar Metadados" }),
  Object.freeze({ id: "archive", label: "Arquivar" }),
  Object.freeze({ id: "restore", label: "Restaurar" }),
  Object.freeze({ id: "requestDeletion", label: "Solicitar Exclusão" }),
]);

function plainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function catalogItem(value) {
  const searchResult = value?.source === "search";
  if (
    !plainObject(value) ||
    typeof value.documentId !== "string" ||
    typeof value.title !== "string" ||
    (searchResult
      ? typeof value.excerpt !== "string"
      : typeof value.description !== "string") ||
    (!searchResult && typeof value.classification !== "string") ||
    (!searchResult && typeof value.lifecycleStatus !== "string") ||
    (!searchResult && typeof value.updatedAt !== "string") ||
    (searchResult
      ? value.favorite !== null
      : typeof value.favorite !== "boolean" && value.favorite !== null)
  ) {
    throw new TypeError("Item de catálogo inválido.");
  }
  return Object.freeze({
    ...value,
    description: searchResult ? value.excerpt : value.description,
    classificationLabel: searchResult
      ? "Resultado da Busca"
      : (CLASSIFICATION_LABELS[value.classification] ?? "Não Classificado"),
    lifecycleLabel: searchResult
      ? ""
      : (LIFECYCLE_LABELS[value.lifecycleStatus] ?? "Estado Indisponível"),
    isSearchResult: searchResult,
  });
}

export function buildCatalogViewModel(state) {
  if (
    !plainObject(state) ||
    !["loading", "ready", "empty", "error"].includes(state.status)
  ) {
    throw new TypeError("Estado de catálogo inválido.");
  }
  const items = Array.isArray(state.items) ? state.items.map(catalogItem) : [];
  if (state.status === "ready" && items.length === 0) {
    throw new TypeError("Estado de catálogo inválido.");
  }
  return Object.freeze({
    status: state.status,
    mode: state.mode ?? "catalog",
    items: Object.freeze(items),
    hasNextPage:
      typeof state.nextCursor === "string" && state.nextCursor.length > 0,
  });
}

export function buildDetailViewModel(state, versions = [], capabilities = {}) {
  if (
    !plainObject(state) ||
    !["loading", "ready", "saving", "conflict", "error"].includes(state.status)
  ) {
    throw new TypeError("Estado de detalhe inválido.");
  }
  const document = state.detail?.document ?? null;
  const actions = state.actions ?? {};
  if (
    document !== null &&
    (!plainObject(document) || typeof document.documentId !== "string")
  ) {
    throw new TypeError("Estado de detalhe inválido.");
  }
  const visibleActions = ACTIONS.filter((action) => {
    if (actions[action.id] !== true) return false;
    if (action.id === "open") {
      return capabilities.viewer === true && capabilities.openViewer === true;
    }
    if (action.id === "favorite") {
      return (
        capabilities.favorites === true && typeof state.favorite === "boolean"
      );
    }
    if (action.id === "uploadVersion") {
      return capabilities.upload === true && capabilities.openUpload === true;
    }
    return true;
  }).map((action) =>
    Object.freeze({
      ...action,
      label:
        action.id === "favorite" && state.favorite === true
          ? "Remover dos Favoritos"
          : action.label,
    }),
  );
  const normalizedVersions = versions.map((version) => {
    if (
      !plainObject(version) ||
      typeof version.versionId !== "string" ||
      document === null ||
      version.documentId !== document.documentId
    ) {
      throw new TypeError("Versão documental inválida.");
    }
    return Object.freeze({
      ...version,
      canPromote:
        actions.promoteVersion === true &&
        version.publicationStatus === "eligible",
    });
  });
  return Object.freeze({
    status: state.status,
    document,
    favorite: typeof state.favorite === "boolean" ? state.favorite : null,
    actions: Object.freeze(visibleActions),
    versions: Object.freeze(normalizedVersions),
    busy: state.status === "loading" || state.status === "saving",
    actionsDisabled: state.status !== "ready",
    canReload:
      document !== null &&
      (state.status === "conflict" || state.status === "error"),
    message:
      state.status === "conflict" || state.status === "error"
        ? state.error?.message || "Não foi possível concluir a operação."
        : null,
    pending: plainObject(state.pending)
      ? Object.freeze({
          ...state.pending,
          values: plainObject(state.pending.values)
            ? Object.freeze({ ...state.pending.values })
            : Object.freeze({}),
        })
      : null,
  });
}

export function buildPublicLinksViewModel(state) {
  if (
    !plainObject(state) ||
    !["hidden", "loading", "ready", "saving", "error"].includes(state.status)
  ) {
    throw new TypeError("Estado de links públicos inválido.");
  }
  const capabilities = plainObject(state.capabilities)
    ? state.capabilities
    : Object.freeze({});
  const items = Array.isArray(state.items) ? state.items : [];
  for (const item of items) {
    if (
      !plainObject(item) ||
      typeof item.linkId !== "string" ||
      typeof item.documentId !== "string" ||
      typeof item.slug !== "string" ||
      typeof item.publicUrl !== "string" ||
      !Object.hasOwn(PUBLIC_LINK_STATUS_LABELS, item.status) ||
      typeof item.allowDownload !== "boolean"
    ) {
      throw new TypeError("Estado de links públicos inválido.");
    }
  }
  return Object.freeze({
    status: state.status,
    items: Object.freeze(items.map((item) => Object.freeze({ ...item }))),
    capabilities: Object.freeze({
      read: capabilities.read === true,
      create: capabilities.create === true,
      update: capabilities.update === true,
    }),
    message:
      state.status === "error"
        ? state.error?.message || "Não foi possível carregar os links públicos."
        : null,
  });
}

export function buildPublicLinksAdminViewModel(state) {
  const model = buildPublicLinksViewModel(state);
  for (const item of model.items) {
    if (
      (item.documentTitle !== null &&
        item.documentTitle !== undefined &&
        typeof item.documentTitle !== "string") ||
      (item.tenantId !== null &&
        item.tenantId !== undefined &&
        typeof item.tenantId !== "string")
    ) {
      throw new TypeError("Estado do painel de links públicos inválido.");
    }
  }
  const filters = plainObject(state.filters) ? state.filters : {};
  if (
    (filters.status !== undefined &&
      !["", "active", "inactive"].includes(filters.status)) ||
    (filters.slug !== undefined && typeof filters.slug !== "string") ||
    (filters.documentId !== undefined &&
      typeof filters.documentId !== "string")
  ) {
    throw new TypeError("Filtros do painel de links públicos inválidos.");
  }
  return Object.freeze({
    ...model,
    filters: Object.freeze({
      status: filters.status ?? "",
      slug: filters.slug ?? "",
      documentId: filters.documentId ?? "",
    }),
  });
}

export function buildDeletionRequestsViewModel(state) {
  if (
    !plainObject(state) ||
    !["loading", "ready", "saving", "error"].includes(state.status)
  ) {
    throw new TypeError("Estado de solicitações de exclusão inválido.");
  }
  const capabilities = plainObject(state.capabilities)
    ? state.capabilities
    : Object.freeze({});
  const items = Array.isArray(state.items) ? state.items : [];
  for (const item of items) {
    if (
      !plainObject(item) ||
      typeof item.requestId !== "string" ||
      typeof item.documentId !== "string" ||
      typeof item.reason !== "string" ||
      !Object.hasOwn(DELETION_STATUS_LABELS, item.status)
    ) {
      throw new TypeError("Estado de solicitações de exclusão inválido.");
    }
  }
  return Object.freeze({
    status: state.status,
    items: Object.freeze(items.map((item) => Object.freeze({ ...item }))),
    capabilities: Object.freeze({
      read: capabilities.read === true,
      review: capabilities.review === true,
      cancel: capabilities.cancel === true,
    }),
    busy: state.status === "loading" || state.status === "saving",
    message:
      state.status === "error"
        ? state.error?.message || "Não foi possível carregar as solicitações de exclusão."
        : null,
  });
}

function appendTextElement(documentRef, parent, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function button(documentRef, label, action, options = {}) {
  const element = documentRef.createElement("button");
  element.type = options.type ?? "button";
  element.className = options.className ?? "docs-button docs-button--secondary";
  element.textContent = label;
  element.dataset.action = action;
  if (options.documentId) element.dataset.documentId = options.documentId;
  if (options.versionId) element.dataset.versionId = options.versionId;
  if (options.ariaLabel) element.setAttribute("aria-label", options.ariaLabel);
  if (options.disabled) element.disabled = true;
  return element;
}

export function shouldRestoreCatalogFocus(origin, activeElement, body) {
  return Boolean(
    activeElement === origin ||
    (origin?.isConnected === false &&
      (!activeElement || activeElement === body)),
  );
}

export function resolveCatalogFocusIntent(
  previousIntent,
  origin,
  activeElement,
  body,
) {
  if (activeElement && activeElement !== body && activeElement !== origin) {
    return false;
  }
  if (previousIntent === false) return false;
  if (previousIntent === true) return true;
  return shouldRestoreCatalogFocus(origin, activeElement, body);
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Data Indisponível";
  }
}

export function createDocumentosView(options = {}) {
  const documentRef = options.documentRef ?? globalThis.document;
  const windowRef =
    options.windowRef ?? documentRef?.defaultView ?? globalThis.window;
  const renderState = options.renderState ?? (() => {});
  const features = plainObject(options.features)
    ? options.features
    : Object.freeze({});
  const favoritesEnabled = features.favorites === true;
  const searchEnabled = features.search === true;
  const onActionError =
    options.onActionError ??
    (() =>
      renderState("error", "Não foi possível concluir a ação solicitada.", {
        controlsEnabled: true,
      }));
  if (!documentRef?.querySelector || typeof renderState !== "function") {
    throw new TypeError(
      "Dependências obrigatórias da apresentação estão ausentes.",
    );
  }

  const content = documentRef.querySelector("#docs-content");
  const loadMore = documentRef.querySelector("#docs-load-more");
  const detailRoot = documentRef.querySelector("#docs-detail");
  const detailPanel = detailRoot?.querySelector(".docs-dialog__panel");
  const detailTitle = documentRef.querySelector("#docs-detail-title");
  const detailContent = documentRef.querySelector("#docs-detail-content");
  const detailActions = documentRef.querySelector("#docs-detail-actions");
  const publicLinksRoot = documentRef.querySelector("#docs-public-links");
  const publicLinksStatus = documentRef.querySelector(
    "#docs-public-links-status",
  );
  const publicLinksList = documentRef.querySelector("#docs-public-links-list");
  const publicLinkCreate = documentRef.querySelector(
    "#docs-public-link-create",
  );
  const versionList = documentRef.querySelector("#docs-version-list");
  const viewerRoot = documentRef.querySelector("#docs-viewer");
  const viewerPanel = viewerRoot?.querySelector(".docs-viewer__panel");
  const viewerTitle = documentRef.querySelector("#docs-viewer-title");
  const viewerStatus = documentRef.querySelector("#docs-viewer-status");
  const viewerContent = documentRef.querySelector("#docs-viewer-content");
  const viewerCanvas = documentRef.querySelector("#docs-viewer-canvas");
  const viewerPage = documentRef.querySelector("#docs-viewer-page");
  const viewerPrevious = viewerRoot?.querySelector(
    '[data-action="viewer-previous"]',
  );
  const viewerNext = viewerRoot?.querySelector('[data-action="viewer-next"]');
  const viewerDownload = viewerRoot?.querySelector(
    '[data-action="viewer-download"]',
  );
  const viewerClose = viewerRoot?.querySelector(
    'button[data-action="close-viewer"]',
  );
  const filtersForm = documentRef.querySelector(".docs-filters__form");
  const searchForm = documentRef.querySelector(".docs-search");
  const searchInput = documentRef.querySelector("#docs-search");
  const searchSubmit = searchForm?.querySelector(".docs-search__submit");
  const uploadButton = documentRef.querySelector("#docs-upload");
  const uploadRoot = documentRef.querySelector("#docs-upload-dialog");
  const uploadPanel = uploadRoot?.querySelector(".docs-upload__panel");
  const uploadTitle = documentRef.querySelector("#docs-upload-title");
  const uploadForm = documentRef.querySelector("#docs-upload-form");
  const uploadDocumentId = documentRef.querySelector(
    "#docs-upload-document-id",
  );
  const uploadMetadata = documentRef.querySelector("#docs-upload-metadata");
  const uploadDocumentTitle = documentRef.querySelector(
    "#docs-upload-document-title",
  );
  const uploadDescription = documentRef.querySelector(
    "#docs-upload-description",
  );
  const uploadCollection = documentRef.querySelector("#docs-upload-collection");
  const uploadClassification = documentRef.querySelector(
    "#docs-upload-classification",
  );
  const uploadIndexing = documentRef.querySelector("#docs-upload-indexing");
  const uploadFile = documentRef.querySelector("#docs-upload-file");
  const uploadStatus = documentRef.querySelector("#docs-upload-status");
  const uploadProcessing = documentRef.querySelector("#docs-upload-processing");
  const uploadSubmit = uploadForm?.querySelector('button[type="submit"]');
  const uploadRetry = uploadRoot?.querySelector('[data-action="retry-upload"]');
  const favoritesNavigation = documentRef.querySelector(
    '[data-view="favoritos"]',
  );
  const deletionAdminNavigation = documentRef.querySelector(
    '[data-view="exclusoes"]',
  );
  const publicLinksAdminNavigation = documentRef.querySelector(
    '[data-view="links-publicos"]',
  );
  const collectionFilter = documentRef.querySelector("#docs-collection-filter");
  const tagFilter = documentRef.querySelector("#docs-tag-filter");
  const classificationFilter = documentRef.querySelector(
    "#docs-classification-filter",
  );
  const lifecycleFilter = documentRef.querySelector("#docs-lifecycle-filter");
  const backgroundElements = [
    ...documentRef.querySelectorAll(
      ".skip-link, .docs-topbar, #docs-main, .docs-footer",
    ),
  ];
  if (
    !content ||
    !loadMore ||
    !detailRoot ||
    !detailPanel ||
    !detailContent ||
    !detailActions ||
    !publicLinksRoot ||
    !publicLinksStatus ||
    !publicLinksList ||
    !publicLinkCreate ||
    !versionList
  ) {
    throw new TypeError("Shell de apresentação incompleto.");
  }
  if (searchEnabled && (!searchForm || !searchInput || !searchSubmit)) {
    throw new TypeError("Shell da busca incompleto.");
  }
  if (
    features.viewer === true &&
    (!viewerRoot ||
      !viewerPanel ||
      !viewerTitle ||
      !viewerStatus ||
      !viewerContent ||
      !viewerCanvas ||
      !viewerPage ||
      !viewerPrevious ||
      !viewerNext ||
      !viewerDownload ||
      !viewerClose)
  ) {
    throw new TypeError("Shell do viewer incompleto.");
  }
  if (
    features.upload === true &&
    (!uploadButton ||
      !uploadRoot ||
      !uploadPanel ||
      !uploadTitle ||
      !uploadForm ||
      !uploadDocumentId ||
      !uploadMetadata ||
      !uploadDocumentTitle ||
      !uploadDescription ||
      !uploadCollection ||
      !uploadClassification ||
      !uploadIndexing ||
      !uploadFile ||
      !uploadStatus ||
      !uploadProcessing ||
      !uploadSubmit ||
      !uploadRetry)
  ) {
    throw new TypeError("Shell do upload incompleto.");
  }

  let boundHandlers = null;
  let previousFocus = null;
  let lastDetailState = null;
  let versions = Object.freeze([]);
  let cleanup = [];
  let pendingActionFocus = null;
  let pendingCatalogFocus = null;
  let viewerPreviousFocus = null;
  let viewerOpenedFromDetail = false;
  let lastViewerState = null;
  let currentPdfRender = null;
  let pdfRenderGeneration = 0;
  let catalogPermissions = new Set();
  let uploadPreviousFocus = null;
  let uploadOpenedFromDetail = false;
  let lastUploadState = null;
  let lastPublicLinksState = null;
  const confirmAction =
    options.confirmAction ?? ((message) => windowRef?.confirm?.(message) === true);
  const copyText =
    options.copyText ??
    ((value) => {
      if (typeof windowRef?.navigator?.clipboard?.writeText !== "function") {
        throw new TypeError("A cópia não está disponível neste navegador.");
      }
      return windowRef.navigator.clipboard.writeText(value);
    });
  const viewerModeQuery =
    options.viewerModeQuery ??
    windowRef?.matchMedia?.("(max-width: 48rem)") ??
    Object.freeze({ matches: false });

  function dispatch(action) {
    Promise.resolve()
      .then(action)
      .catch((error) => {
        if (error?.code === "request_aborted") return;
        onActionError(error);
      });
  }

  function setBackgroundInert(value) {
    for (const element of backgroundElements) {
      element.inert = value;
      if (value) element.setAttribute?.("aria-hidden", "true");
      else element.removeAttribute?.("aria-hidden");
    }
  }

  function setViewerBackgroundInert(value) {
    setBackgroundInert(value);
    detailRoot.inert = value;
    if (value) detailRoot.setAttribute?.("aria-hidden", "true");
    else detailRoot.removeAttribute?.("aria-hidden");
  }

  function syncFeatureControls() {
    if (searchForm) {
      const enabled =
        searchEnabled &&
        typeof boundHandlers?.search === "function" &&
        typeof boundHandlers?.navigate === "function";
      searchForm.hidden = !enabled;
      searchForm.dataset.featureDisabled = String(!enabled);
      if (searchInput) searchInput.disabled = !enabled;
      if (searchSubmit) searchSubmit.disabled = !enabled;
    }
    if (uploadButton) {
      const enabled =
        features.upload === true &&
        catalogPermissions.has("create") &&
        typeof boundHandlers?.openUpload === "function";
      uploadButton.hidden = !enabled;
      uploadButton.disabled = !enabled;
    }
    if (favoritesNavigation) {
      const enabled = favoritesEnabled && Boolean(boundHandlers);
      favoritesNavigation.hidden = !enabled;
      favoritesNavigation.disabled = !enabled;
    }
    if (deletionAdminNavigation) {
      const canRead =
        catalogPermissions.has("manage_deletion_requests") ||
        catalogPermissions.has("review_deletion_requests") ||
        catalogPermissions.has("cancel_deletion_request") ||
        catalogPermissions.has("read_deletion_requests");
      const enabled = canRead && typeof boundHandlers?.navigate === "function";
      deletionAdminNavigation.hidden = !enabled;
      deletionAdminNavigation.disabled = !enabled;
    }
    if (publicLinksAdminNavigation) {
      const canRead =
        catalogPermissions.has("manage_public_links") ||
        catalogPermissions.has("read_public_links");
      const enabled = canRead && typeof boundHandlers?.navigate === "function";
      publicLinksAdminNavigation.hidden = !enabled;
      publicLinksAdminNavigation.disabled = !enabled;
    }
  }

  function selectNavigation(viewName = "documentos") {
    for (const navigation of documentRef.querySelectorAll("[data-view]")) {
      if (navigation.dataset.view === viewName) {
        navigation.setAttribute("aria-current", "page");
      } else {
        navigation.removeAttribute("aria-current");
      }
    }
  }

  function listen(target, event, handler) {
    target?.addEventListener?.(event, handler);
    cleanup.push(() => target?.removeEventListener?.(event, handler));
  }

  function replaceSelectOptions(
    select,
    items,
    valueKey,
    labelKey,
    initialLabel,
  ) {
    if (!select) return;
    const selected = select.value;
    select.replaceChildren();
    const initial = documentRef.createElement("option");
    initial.value = "";
    initial.textContent = initialLabel;
    select.append(initial);
    for (const item of items) {
      const option = documentRef.createElement("option");
      option.value = item[valueKey];
      option.textContent = item[labelKey];
      select.append(option);
    }
    if ([...select.options].some((option) => option.value === selected))
      select.value = selected;
  }

  function setMetadata(metadata) {
    catalogPermissions = new Set(
      Array.isArray(metadata.permissions)
        ? metadata.permissions.filter(
            (permission) => typeof permission === "string",
          )
        : [],
    );
    replaceSelectOptions(
      collectionFilter,
      metadata.collections,
      "collectionId",
      "name",
      "Todas as Coleções",
    );
    replaceSelectOptions(
      tagFilter,
      metadata.tags,
      "tagId",
      "name",
      "Todas as Tags",
    );
    replaceSelectOptions(
      uploadCollection,
      metadata.collections,
      "collectionId",
      "name",
      "Sem Coleção",
    );
    syncFeatureControls();
  }

  function setFilters(filters = {}) {
    if (collectionFilter) collectionFilter.value = filters.collectionId ?? "";
    if (tagFilter) tagFilter.value = filters.tagId ?? "";
    if (classificationFilter)
      classificationFilter.value = filters.classification ?? "";
    if (lifecycleFilter) lifecycleFilter.value = filters.lifecycleStatus ?? "";
  }

  function showContent() {
    const status = documentRef.querySelector("#docs-status");
    if (status) status.hidden = true;
    content.hidden = false;
  }

  function captureCatalogFocusIntent() {
    if (!pendingCatalogFocus) return;
    pendingCatalogFocus.shouldRestore = resolveCatalogFocusIntent(
      pendingCatalogFocus.shouldRestore,
      pendingCatalogFocus.origin,
      documentRef.activeElement,
      documentRef.body,
    );
  }

  function restoreCatalogFocus() {
    if (!pendingCatalogFocus) return;
    captureCatalogFocusIntent();
    const origin = pendingCatalogFocus.origin;
    const shouldRestore = pendingCatalogFocus.shouldRestore === true;
    if (!shouldRestore) {
      pendingCatalogFocus = null;
      return;
    }
    const replacement = [...content.querySelectorAll("[data-action]")].find(
      (element) =>
        element.dataset.action === pendingCatalogFocus.action &&
        (pendingCatalogFocus.documentId === null ||
          element.dataset.documentId === pendingCatalogFocus.documentId) &&
        !element.disabled,
    );
    const fallback = documentRef.querySelector(
      '[data-view][aria-current="page"]',
    );
    (replacement ?? fallback)?.focus?.();
    pendingCatalogFocus = null;
  }

  function renderCatalog(state) {
    captureCatalogFocusIntent();
    const model = buildCatalogViewModel(state);
    if (model.status === "loading") {
      loadMore.hidden = true;
      loadMore.disabled = true;
      renderState("loading", undefined, { controlsEnabled: true });
      return;
    }
    if (model.status === "empty") {
      renderState("empty", undefined, { controlsEnabled: true });
      loadMore.hidden = true;
      restoreCatalogFocus();
      return;
    }
    if (model.status === "error") {
      renderState("error", undefined, { controlsEnabled: true });
      loadMore.hidden = true;
      restoreCatalogFocus();
      return;
    }

    content.replaceChildren();
    const grid = documentRef.createElement("div");
    grid.className = "docs-card-grid";
    for (const item of model.items) {
      const article = documentRef.createElement("article");
      article.className = "docs-card";
      article.dataset.documentId = item.documentId;

      const header = documentRef.createElement("div");
      header.className = "docs-card__header";
      appendTextElement(
        documentRef,
        header,
        "span",
        "docs-badge",
        item.classificationLabel,
      );
      if (item.lifecycleLabel) {
        appendTextElement(
          documentRef,
          header,
          "span",
          "docs-card__status",
          item.lifecycleLabel,
        );
      }
      article.append(header);

      appendTextElement(documentRef, article, "h3", "", item.title);
      appendTextElement(
        documentRef,
        article,
        "p",
        "docs-card__description",
        item.description || "Sem descrição.",
      );
      if (item.updatedAt) {
        appendTextElement(
          documentRef,
          article,
          "p",
          "docs-card__date",
          `Atualizado em ${formatDate(item.updatedAt)}`,
        );
      }

      const actions = documentRef.createElement("div");
      actions.className = "docs-card__actions";
      actions.append(
        button(documentRef, "Ver Detalhes", "open-detail", {
          documentId: item.documentId,
          className: "docs-button docs-button--secondary",
          ariaLabel: `Ver detalhes de ${item.title}`,
        }),
      );
      if (favoritesEnabled && typeof item.favorite === "boolean") {
        const favoriteButton = button(
          documentRef,
          item.favorite ? "Remover dos Favoritos" : "Favoritar",
          "toggle-card-favorite",
          {
            documentId: item.documentId,
            ariaLabel: `${item.favorite ? "Remover dos favoritos" : "Favoritar"}: ${item.title}`,
          },
        );
        favoriteButton.dataset.favorite = String(item.favorite);
        favoriteButton.setAttribute("aria-pressed", String(item.favorite));
        actions.append(favoriteButton);
      }
      article.append(actions);
      grid.append(article);
    }
    content.append(grid);
    showContent();
    loadMore.hidden = !model.hasNextPage;
    loadMore.disabled = !model.hasNextPage;
    restoreCatalogFocus();
  }

  function closeDetail() {
    if (detailRoot.hidden) return;
    detailRoot.hidden = true;
    documentRef.body?.classList?.remove("is-dialog-open");
    setBackgroundInert(false);
    const fallbackFocus =
      documentRef.querySelector('[data-view][aria-current="page"]') ??
      searchInput ??
      documentRef.querySelector("#docs-main");
    const focusTarget =
      previousFocus && previousFocus.isConnected !== false
        ? previousFocus
        : fallbackFocus;
    focusTarget?.focus?.();
    previousFocus = null;
    pendingActionFocus = null;
  }

  function openDetail({ captureFocus = true } = {}) {
    if (detailRoot.hidden) {
      if (captureFocus) previousFocus = documentRef.activeElement;
      detailRoot.hidden = false;
      documentRef.body?.classList?.add("is-dialog-open");
      setBackgroundInert(true);
      detailPanel.focus();
    }
  }

  function setUploadMetadataEnabled(enabled) {
    if (!uploadMetadata) return;
    uploadMetadata.hidden = !enabled;
    uploadMetadata.disabled = !enabled;
  }

  function openUpload(value = {}) {
    if (
      features.upload !== true ||
      !uploadRoot ||
      !uploadForm ||
      !["create", "version"].includes(value.mode)
    ) {
      return null;
    }
    uploadPreviousFocus = documentRef.activeElement;
    uploadOpenedFromDetail = value.mode === "version" && !detailRoot.hidden;
    if (uploadOpenedFromDetail) detailRoot.hidden = true;
    detailRoot.inert = true;
    detailRoot.setAttribute("aria-hidden", "true");
    uploadForm.reset();
    if (!searchEnabled) uploadIndexing.value = "metadata_only";
    uploadDocumentId.value =
      value.mode === "version" ? (value.documentId ?? "") : "";
    setUploadMetadataEnabled(value.mode === "create");
    uploadTitle.textContent =
      value.mode === "version"
        ? `Enviar Nova Versão — ${value.title || "Documento"}`
        : "Enviar Documento";
    uploadRoot.hidden = false;
    documentRef.body?.classList?.add("is-dialog-open");
    setBackgroundInert(true);
    lastUploadState = Object.freeze({ status: "idle" });
    renderUpload(lastUploadState);
    const entry = value.mode === "create" ? uploadDocumentTitle : uploadFile;
    entry?.focus?.();
    return value;
  }

  function closeUpload({ restoreFocus = true } = {}) {
    if (!uploadRoot || uploadRoot.hidden) return;
    uploadRoot.hidden = true;
    uploadForm?.removeAttribute("aria-busy");
    uploadForm?.reset();
    uploadStatus.textContent = "";
    uploadStatus.className = "docs-upload__status";
    uploadProcessing.replaceChildren();
    uploadProcessing.hidden = true;
    detailRoot.inert = false;
    detailRoot.removeAttribute("aria-hidden");
    setBackgroundInert(false);
    documentRef.body?.classList?.remove("is-dialog-open");

    if (uploadOpenedFromDetail && lastDetailState?.detail?.document) {
      detailRoot.hidden = false;
      documentRef.body?.classList?.add("is-dialog-open");
      setBackgroundInert(true);
    }
    const focusTarget =
      uploadPreviousFocus && uploadPreviousFocus.isConnected !== false
        ? uploadPreviousFocus
        : (documentRef.querySelector('[data-view][aria-current="page"]') ??
          searchInput ??
          documentRef.querySelector("#docs-main"));
    uploadPreviousFocus = null;
    uploadOpenedFromDetail = false;
    lastUploadState = null;
    if (restoreFocus) focusTarget?.focus?.();
  }

  function renderUpload(state) {
    if (features.upload !== true || !uploadRoot || !plainObject(state)) return;
    lastUploadState = state;
    const busy = [
      "validating",
      "hashing",
      "creating_document",
      "creating_session",
      "uploading",
      "completing",
      "processing",
    ].includes(state.status);
    const terminalSuccess = state.status === "succeeded";
    const errorState = [
      "error",
      "security_failed",
      "processing_failed",
      "timeout",
    ].includes(state.status);
    const statusMessage =
      typeof state.message === "string"
        ? state.message
        : (UPLOAD_STATE_COPY[state.status] ?? "");

    uploadStatus.textContent = statusMessage;
    uploadStatus.className = `docs-upload__status${
      terminalSuccess ? " is-success" : errorState ? " is-error" : ""
    }`;
    uploadStatus.setAttribute("role", errorState ? "alert" : "status");
    if (busy) uploadForm.setAttribute("aria-busy", "true");
    else uploadForm.removeAttribute("aria-busy");

    for (const control of uploadForm.querySelectorAll(
      "input, textarea, select",
    )) {
      const metadataControl = uploadMetadata?.contains?.(control);
      control.disabled =
        busy || terminalSuccess || (metadataControl && uploadMetadata.hidden);
    }
    uploadSubmit.disabled = busy || terminalSuccess;
    uploadRetry.hidden = state.canRetry !== true;
    uploadRetry.disabled = busy;

    uploadProcessing.replaceChildren();
    if (plainObject(state.processing)) {
      for (const [key, label] of Object.entries(PROCESSING_LABELS)) {
        const value = state.processing[key];
        if (typeof value !== "string") continue;
        const item = documentRef.createElement("div");
        appendTextElement(documentRef, item, "dt", "", label);
        appendTextElement(
          documentRef,
          item,
          "dd",
          "",
          value.replaceAll("_", " "),
        );
        uploadProcessing.append(item);
      }
    }
    uploadProcessing.hidden = uploadProcessing.childElementCount === 0;
  }

  function viewerIsMobile() {
    return viewerModeQuery?.matches === true;
  }

  function hideDetailForViewer() {
    if (detailRoot.hidden) return;
    detailRoot.hidden = true;
    documentRef.body?.classList?.remove("is-dialog-open");
    setBackgroundInert(false);
  }

  function focusViewerEntry() {
    const target = viewerClose ?? viewerPanel;
    target?.focus?.();
    const verifyFocus = () => {
      if (
        !viewerRoot?.hidden &&
        !viewerRoot?.contains?.(documentRef.activeElement)
      ) {
        target?.focus?.();
      }
    };
    const enqueue = windowRef?.queueMicrotask ?? globalThis.queueMicrotask;
    if (typeof enqueue === "function") enqueue(verifyFocus);
    windowRef?.requestAnimationFrame?.(verifyFocus);
  }

  function syncViewerMode() {
    if (!viewerRoot || viewerRoot.hidden) return;
    const mobile = viewerIsMobile();
    viewerRoot.setAttribute("role", mobile ? "dialog" : "region");
    if (mobile) {
      viewerRoot.setAttribute("aria-modal", "true");
      setViewerBackgroundInert(true);
      documentRef.documentElement?.classList?.add("is-viewer-modal-open");
      documentRef.body?.classList?.add("is-dialog-open");
    } else {
      viewerRoot.removeAttribute("aria-modal");
      setViewerBackgroundInert(false);
      documentRef.documentElement?.classList?.remove("is-viewer-modal-open");
      documentRef.body?.classList?.remove("is-dialog-open");
    }
  }

  function openViewerPanel() {
    if (!viewerRoot || !viewerPanel || !viewerRoot.hidden) {
      syncViewerMode();
      return;
    }
    if (!viewerPreviousFocus) viewerPreviousFocus = documentRef.activeElement;
    hideDetailForViewer();
    viewerRoot.hidden = false;
    documentRef.body?.classList?.add("is-viewer-open");
    syncViewerMode();
    focusViewerEntry();
  }

  function clearViewerContent() {
    pdfRenderGeneration += 1;
    currentPdfRender?.cancel?.();
    currentPdfRender = null;
    viewerContent?.replaceChildren();
    if (viewerCanvas) {
      viewerCanvas.hidden = true;
      viewerCanvas.width = 0;
      viewerCanvas.height = 0;
      viewerCanvas.removeAttribute("style");
    }
  }

  function closeViewerPanel({
    restoreFocus = true,
    restoreDetail = true,
  } = {}) {
    if (!viewerRoot || viewerRoot.hidden) return;
    viewerRoot.hidden = true;
    viewerRoot.setAttribute("role", "region");
    viewerRoot.removeAttribute("aria-modal");
    setViewerBackgroundInert(false);
    documentRef.documentElement?.classList?.remove("is-viewer-modal-open");
    documentRef.body?.classList?.remove("is-viewer-open", "is-dialog-open");
    clearViewerContent();
    if (viewerStatus) {
      viewerStatus.textContent = "";
      viewerStatus.setAttribute("role", "status");
    }
    if (viewerTitle) viewerTitle.textContent = "Documento";
    if (viewerPage) viewerPage.textContent = "Página 1 de 1";
    if (viewerPrevious) viewerPrevious.disabled = true;
    if (viewerNext) viewerNext.disabled = true;
    if (viewerDownload) {
      viewerDownload.hidden = true;
      viewerDownload.disabled = true;
    }

    const focusTarget =
      viewerPreviousFocus && viewerPreviousFocus.isConnected !== false
        ? viewerPreviousFocus
        : (documentRef.querySelector('[data-view][aria-current="page"]') ??
          searchInput ??
          documentRef.querySelector("#docs-main"));
    const shouldRestoreDetail =
      restoreDetail &&
      viewerOpenedFromDetail &&
      lastDetailState?.detail?.document;
    viewerPreviousFocus = null;
    viewerOpenedFromDetail = false;
    lastViewerState = null;
    if (shouldRestoreDetail) {
      openDetail({ captureFocus: false });
      const openAction = detailRoot.querySelector(
        '[data-action="open"]:not(:disabled)',
      );
      (openAction ?? detailPanel).focus?.();
    } else if (restoreFocus) {
      focusTarget?.focus?.();
    }
  }

  function viewerMessage(title, detail, className = "") {
    const wrapper = documentRef.createElement("section");
    wrapper.className = `docs-viewer__message ${className}`.trim();
    appendTextElement(documentRef, wrapper, "h3", "", title);
    if (detail) appendTextElement(documentRef, wrapper, "p", "", detail);
    viewerContent.append(wrapper);
  }

  function renderMarkdownBlocks(blocks) {
    const article = documentRef.createElement("article");
    article.className = "docs-viewer__markdown";
    for (const block of blocks ?? []) {
      if (block.type === "heading") {
        const level = Math.min(6, Math.max(3, Number(block.level) + 2));
        appendTextElement(documentRef, article, `h${level}`, "", block.text);
      } else if (block.type === "list") {
        const list = documentRef.createElement(block.ordered ? "ol" : "ul");
        for (const item of block.items ?? []) {
          appendTextElement(documentRef, list, "li", "", item);
        }
        article.append(list);
      } else if (block.type === "quote") {
        appendTextElement(documentRef, article, "blockquote", "", block.text);
      } else if (block.type === "code") {
        const pre = documentRef.createElement("pre");
        appendTextElement(documentRef, pre, "code", "", block.text);
        article.append(pre);
      } else {
        appendTextElement(documentRef, article, "p", "", block.text);
      }
    }
    viewerContent.append(article);
  }

  function renderViewer(state) {
    if (!viewerRoot || features.viewer !== true) return;
    if (state?.status === "closed") {
      closeViewerPanel();
      return;
    }
    lastViewerState = state;
    openViewerPanel();
    if (viewerTitle) viewerTitle.textContent = state?.title || "Documento";
    if (viewerStatus) {
      viewerStatus.setAttribute(
        "role",
        state?.status === "error" ? "alert" : "status",
      );
      viewerStatus.textContent =
        state?.status === "loading"
          ? state.detail || "Carregando conteúdo."
          : state?.status === "error"
            ? state.detail || "Não foi possível acessar este conteúdo."
            : "";
    }
    if (viewerDownload) {
      const enabled = state?.canDownload === true;
      viewerDownload.hidden = !enabled;
      viewerDownload.disabled = !enabled;
    }
    const page = Number.isSafeInteger(state?.page) ? state.page : 1;
    const pageCount = Number.isSafeInteger(state?.pageCount)
      ? state.pageCount
      : 1;
    if (viewerPage) viewerPage.textContent = `Página ${page} de ${pageCount}`;
    if (viewerPrevious)
      viewerPrevious.disabled = state?.kind !== "pdf" || page <= 1;
    if (viewerNext)
      viewerNext.disabled = state?.kind !== "pdf" || page >= pageCount;

    if (state?.status === "ready" && state.kind === "pdf") return;
    clearViewerContent();
    if (state?.status === "loading") {
      viewerMessage("Carregando Conteúdo", state.detail || "Aguarde.");
      return;
    }
    if (state?.status === "error") {
      viewerMessage(
        state.title || "Conteúdo Indisponível",
        state.detail || "Não foi possível acessar este conteúdo.",
        "is-error",
      );
      return;
    }
    if (state?.kind === "image") {
      const image = documentRef.createElement("img");
      image.className = "docs-viewer__image";
      image.src = state.objectUrl;
      image.alt = `Imagem do documento ${state.title || "selecionado"}.`;
      viewerContent.append(image);
      return;
    }
    if (state?.kind === "text") {
      appendTextElement(
        documentRef,
        viewerContent,
        "pre",
        "docs-viewer__text",
        state.text,
      );
      return;
    }
    if (state?.kind === "markdown") {
      renderMarkdownBlocks(state.blocks);
      return;
    }
    viewerMessage(
      state?.title || "Visualização Indisponível",
      state?.detail || "Use o download autorizado para acessar este arquivo.",
    );
  }

  async function renderPdfPage({ page, pageNumber, pageCount, signal }) {
    if (
      !viewerContent ||
      !viewerCanvas ||
      !page?.getViewport ||
      !page?.render
    ) {
      throw new TypeError("Página PDF inválida.");
    }
    currentPdfRender?.cancel?.();
    clearViewerContent();
    const renderGeneration = pdfRenderGeneration;
    viewerCanvas.hidden = false;
    viewerContent.append(viewerCanvas);
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(
      280,
      (viewerContent.clientWidth || 960) - 32,
    );
    const cssScale = Math.min(2, availableWidth / baseViewport.width);
    const viewport = page.getViewport({ scale: cssScale });
    const outputScale = Math.min(
      2,
      Math.max(1, windowRef?.devicePixelRatio || 1),
    );
    viewerCanvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
    viewerCanvas.height = Math.max(
      1,
      Math.floor(viewport.height * outputScale),
    );
    viewerCanvas.style.width = `${Math.floor(viewport.width)}px`;
    viewerCanvas.style.height = `${Math.floor(viewport.height)}px`;
    const context = viewerCanvas.getContext("2d", { alpha: false });
    if (!context) throw new TypeError("Canvas PDF indisponível.");
    const renderTask = page.render({
      canvasContext: context,
      viewport,
      transform:
        outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
    });
    currentPdfRender = renderTask;
    const abort = () => renderTask.cancel?.();
    signal?.addEventListener?.("abort", abort, { once: true });
    try {
      await renderTask.promise;
      if (signal?.aborted || renderGeneration !== pdfRenderGeneration) {
        return renderTask;
      }
      const textLayer = documentRef.createElement("section");
      textLayer.className = "sr-only docs-viewer__pdf-text";
      textLayer.setAttribute(
        "aria-label",
        `Texto da página ${pageNumber} de ${pageCount}`,
      );
      let extracted = "";
      try {
        const textContent = await page.getTextContent?.();
        if (signal?.aborted || renderGeneration !== pdfRenderGeneration) {
          return renderTask;
        }
        extracted = (textContent?.items ?? [])
          .map((item) => (typeof item?.str === "string" ? item.str : ""))
          .filter(Boolean)
          .join(" ");
      } catch {
        extracted = "";
      }
      if (signal?.aborted || renderGeneration !== pdfRenderGeneration) {
        return renderTask;
      }
      textLayer.textContent =
        extracted || "Esta página não contém texto extraível.";
      viewerContent.append(textLayer);
      return renderTask;
    } finally {
      signal?.removeEventListener?.("abort", abort);
      if (currentPdfRender === renderTask) currentPdfRender = null;
    }
  }

  function detailField(list, label, value) {
    const wrapper = documentRef.createElement("div");
    wrapper.className = "docs-detail-field";
    appendTextElement(documentRef, wrapper, "dt", "", label);
    appendTextElement(documentRef, wrapper, "dd", "", value || "Não Informado");
    list.append(wrapper);
  }

  function renderEditForm(
    document,
    values = {},
    disabled = false,
    focus = true,
  ) {
    const form = documentRef.createElement("form");
    form.id = "docs-edit-form";
    form.className = "docs-inline-form";
    const titleLabel = appendTextElement(
      documentRef,
      form,
      "label",
      "",
      "Título",
    );
    const title = documentRef.createElement("input");
    title.name = "title";
    title.required = true;
    title.maxLength = 500;
    title.value =
      typeof values.title === "string" ? values.title : document.title;
    title.disabled = disabled;
    titleLabel.append(title);
    const descriptionLabel = appendTextElement(
      documentRef,
      form,
      "label",
      "",
      "Descrição",
    );
    const description = documentRef.createElement("textarea");
    description.name = "description";
    description.maxLength = 4000;
    description.value =
      typeof values.description === "string"
        ? values.description
        : document.description;
    description.disabled = disabled;
    descriptionLabel.append(description);
    form.append(
      button(documentRef, "Salvar Alterações", "save-metadata", {
        type: "submit",
        disabled,
      }),
    );
    detailContent.append(form);
    if (focus) title.focus();
  }

  function renderDeletionForm(values = {}, disabled = false, focus = true) {
    const form = documentRef.createElement("form");
    form.id = "docs-deletion-form";
    form.className = "docs-inline-form";
    const reasonLabel = appendTextElement(
      documentRef,
      form,
      "label",
      "",
      "Motivo da Solicitação",
    );
    const reason = documentRef.createElement("textarea");
    reason.name = "reason";
    reason.required = true;
    reason.maxLength = 2000;
    reason.value = typeof values.reason === "string" ? values.reason : "";
    reason.disabled = disabled;
    reasonLabel.append(reason);
    form.append(
      button(documentRef, "Confirmar Solicitação", "confirm-deletion", {
        type: "submit",
        disabled,
      }),
    );
    detailContent.append(form);
    if (focus) reason.focus();
  }

  function renderVersions(items = versions) {
    versions = Object.freeze([...items]);
    versionList.replaceChildren();
    if (versions.length === 0) {
      appendTextElement(
        documentRef,
        versionList,
        "p",
        "docs-muted",
        "Nenhuma versão disponível.",
      );
      return;
    }
    const list = documentRef.createElement("ul");
    list.className = "docs-version-list";
    const model = lastDetailState
      ? buildDetailViewModel(lastDetailState, versions, {
          viewer: features.viewer === true,
          openViewer: typeof boundHandlers?.openViewer === "function",
          favorites: favoritesEnabled,
          upload: features.upload === true,
          openUpload: typeof boundHandlers?.openUpload === "function",
        })
      : null;
    for (const version of model?.versions ?? versions) {
      const item = documentRef.createElement("li");
      appendTextElement(
        documentRef,
        item,
        "span",
        "",
        `Versão ${version.versionNumber ?? version.versionId} — ${version.publicationStatus}`,
      );
      if (version.canPromote) {
        item.append(
          button(documentRef, "Promover", "promote-version", {
            versionId: version.versionId,
            documentId: version.documentId,
            disabled: model?.actionsDisabled === true,
            ariaLabel: `Promover versão ${version.versionNumber ?? version.versionId}`,
          }),
        );
      }
      list.append(item);
    }
    versionList.append(list);
  }

  function renderVersionsError() {
    versions = Object.freeze([]);
    versionList.replaceChildren();
    const message = appendTextElement(
      documentRef,
      versionList,
      "p",
      "docs-detail-message is-error",
      "Não foi possível carregar o histórico de versões.",
    );
    message.setAttribute("role", "alert");
  }

  function renderPublicLinkForm() {
    publicLinksRoot.querySelector("#docs-public-link-form")?.remove();
    const form = documentRef.createElement("form");
    form.id = "docs-public-link-form";
    form.className = "docs-inline-form";

    const slugLabel = appendTextElement(
      documentRef,
      form,
      "label",
      "",
      "Endereço Curto",
    );
    const slug = documentRef.createElement("input");
    slug.name = "slug";
    slug.type = "text";
    slug.required = true;
    slug.minLength = 3;
    slug.maxLength = 48;
    slug.pattern = "[a-z0-9]+(?:-[a-z0-9]+)*";
    slug.autocomplete = "off";
    slug.placeholder = "manual-institucional";
    slug.addEventListener("input", () => slug.setCustomValidity(""));
    slug.setAttribute(
      "aria-describedby",
      "docs-public-link-slug-help",
    );
    slugLabel.append(slug);
    appendTextElement(
      documentRef,
      slugLabel,
      "small",
      "docs-muted",
      "Use de 3 a 48 caracteres: letras minúsculas, números e hífens simples entre termos.",
    ).id = "docs-public-link-slug-help";

    const expirationLabel = appendTextElement(
      documentRef,
      form,
      "label",
      "",
      "Expiração Opcional",
    );
    const expiration = documentRef.createElement("input");
    expiration.name = "expiresAt";
    expiration.type = "datetime-local";
    expirationLabel.append(expiration);

    const downloadLabel = documentRef.createElement("label");
    downloadLabel.className = "docs-checkbox";
    const allowDownload = documentRef.createElement("input");
    allowDownload.name = "allowDownload";
    allowDownload.type = "checkbox";
    downloadLabel.append(allowDownload);
    downloadLabel.append(documentRef.createTextNode(" Forçar download ao abrir"));
    form.append(downloadLabel);

    const actions = documentRef.createElement("div");
    actions.className = "docs-public-link__actions";
    actions.append(
      button(documentRef, "Cancelar", "cancel-public-link-form"),
      button(documentRef, "Criar Link Público", "create-public-link", {
        type: "submit",
        className: "docs-button docs-button--primary",
      }),
    );
    form.append(actions);
    publicLinksRoot.insertBefore(form, publicLinksList);
    slug.focus();
  }

  function renderPublicLinks(state) {
    const model = buildPublicLinksViewModel(state);
    lastPublicLinksState = model;
    publicLinksRoot.querySelector("#docs-public-link-form")?.remove();
    publicLinksRoot.hidden = model.status === "hidden" || !model.capabilities.read;
    publicLinkCreate.hidden = !model.capabilities.create;
    publicLinkCreate.disabled =
      !model.capabilities.create ||
      model.status === "loading" ||
      model.status === "saving";
    publicLinksStatus.className = `docs-inline-status${model.status === "error" ? " is-error" : ""}`;
    publicLinksStatus.textContent =
      model.status === "loading"
        ? "Carregando links públicos."
        : model.status === "saving"
          ? "Salvando alteração do link público."
          : model.message || "";
    publicLinksList.replaceChildren();
    if (publicLinksRoot.hidden || ["loading", "saving", "error"].includes(model.status)) {
      return;
    }
    if (model.items.length === 0) {
      appendTextElement(
        documentRef,
        publicLinksList,
        "p",
        "docs-muted",
        "Nenhum link público foi criado para este documento.",
      );
      return;
    }
    const list = documentRef.createElement("ul");
    list.className = "docs-public-link-list";
    for (const link of model.items) {
      const item = documentRef.createElement("li");
      item.className = "docs-public-link";
      const header = documentRef.createElement("div");
      header.className = "docs-public-link__header";
      appendTextElement(documentRef, header, "strong", "", `/${link.slug}`);
      appendTextElement(
        documentRef,
        header,
        "span",
        "docs-card__status",
        PUBLIC_LINK_STATUS_LABELS[link.status],
      );
      const url = documentRef.createElement("a");
      url.className = "docs-public-link__url";
      url.href = link.publicUrl;
      url.target = "_blank";
      url.rel = "noopener noreferrer";
      url.textContent = link.publicUrl;
      const meta = appendTextElement(
        documentRef,
        item,
        "p",
        "docs-public-link__meta",
        `${link.allowDownload ? "Forçar download" : "Abrir no navegador"} · ${
          link.expiresAt ? `expira em ${formatDate(link.expiresAt)}` : "sem expiração"
        }`,
      );
      const actions = documentRef.createElement("div");
      actions.className = "docs-public-link__actions";
      actions.append(
        button(documentRef, "Copiar URL", "copy-public-link", {
          ariaLabel: `Copiar URL do link /${link.slug}`,
        }),
      );
      actions.lastElementChild.dataset.publicUrl = link.publicUrl;
      if (model.capabilities.update) {
        const nextStatus = link.status === "active" ? "inactive" : "active";
        const toggle = button(
          documentRef,
          link.status === "active" ? "Inativar" : "Ativar",
          "toggle-public-link",
          {
            ariaLabel: `${link.status === "active" ? "Inativar" : "Ativar"} link /${link.slug}`,
          },
        );
        toggle.dataset.linkId = link.linkId;
        toggle.dataset.status = nextStatus;
        actions.append(toggle);
      }
      item.prepend(header, url);
      item.append(meta, actions);
      list.append(item);
    }
    publicLinksList.append(list);
  }

  function renderPublicLinksAdmin(state) {
    const model = buildPublicLinksAdminViewModel(state);
    loadMore.hidden = true;
    loadMore.disabled = true;
    showContent();
    content.replaceChildren();
    const heading = appendTextElement(
      documentRef,
      content,
      "h2",
      "",
      "Links Públicos",
    );
    heading.tabIndex = -1;
    appendTextElement(
      documentRef,
      content,
      "p",
      "docs-public-links-admin__intro",
      "Links explicitamente publicados no tenant atual. A opção de download define apenas se o navegador abre o arquivo ou força seu download.",
    );
    const filters = documentRef.createElement("form");
    filters.id = "docs-public-links-admin-filters";
    filters.className = "docs-public-links-admin__filters";
    const statusLabel = appendTextElement(
      documentRef,
      filters,
      "label",
      "",
      "Estado",
    );
    const status = documentRef.createElement("select");
    status.name = "status";
    for (const [value, label] of [
      ["", "Todos os Estados"],
      ["active", "Ativos"],
      ["inactive", "Inativos"],
    ]) {
      const option = documentRef.createElement("option");
      option.value = value;
      option.textContent = label;
      status.append(option);
    }
    status.value = model.filters.status;
    statusLabel.append(status);
    const slugLabel = appendTextElement(
      documentRef,
      filters,
      "label",
      "",
      "Slug",
    );
    const slug = documentRef.createElement("input");
    slug.name = "slug";
    slug.type = "text";
    slug.minLength = 3;
    slug.maxLength = 48;
    slug.pattern = "[a-z0-9]+(?:-[a-z0-9]+)*";
    slug.autocomplete = "off";
    slug.placeholder = "manual-institucional";
    slug.value = model.filters.slug;
    slugLabel.append(slug);
    const documentLabel = appendTextElement(
      documentRef,
      filters,
      "label",
      "",
      "ID do Documento",
    );
    const documentId = documentRef.createElement("input");
    documentId.name = "documentId";
    documentId.type = "text";
    documentId.maxLength = 256;
    documentId.autocomplete = "off";
    documentId.value = model.filters.documentId;
    documentLabel.append(documentId);
    const filterActions = documentRef.createElement("div");
    filterActions.className = "docs-public-links-admin__filter-actions";
    filterActions.append(
      button(documentRef, "Limpar", "clear-public-link-filters"),
      button(documentRef, "Aplicar Filtros", "apply-public-link-filters", {
        type: "submit",
        className: "docs-button docs-button--primary",
      }),
    );
    filters.append(filterActions);
    for (const control of filters.querySelectorAll("input, select, button")) {
      control.disabled = model.status === "loading" || model.status === "saving";
    }
    content.append(filters);
    const panelStatus = appendTextElement(
      documentRef,
      content,
      "p",
      "docs-inline-status",
      model.status === "saving" ? "Salvando alteração do link público." : "",
    );
    panelStatus.id = "docs-public-links-admin-status";
    panelStatus.setAttribute("role", "status");
    panelStatus.setAttribute("aria-live", "polite");
    if (model.status === "loading") {
      appendTextElement(
        documentRef,
        content,
        "p",
        "docs-muted",
        "Carregando todos os links públicos.",
      );
      return;
    }
    if (model.status === "error") {
      const error = appendTextElement(
        documentRef,
        content,
        "p",
        "docs-detail-message is-error",
        model.message,
      );
      error.setAttribute("role", "alert");
      return;
    }
    if (model.items.length === 0) {
      appendTextElement(
        documentRef,
        content,
        "p",
        "docs-muted",
        "Nenhum link público está cadastrado neste tenant.",
      );
      heading.focus();
      return;
    }
    const list = documentRef.createElement("ul");
    list.className = "docs-public-link-list docs-public-link-list--admin";
    for (const link of model.items) {
      const item = documentRef.createElement("li");
      item.className = "docs-public-link docs-public-link--admin";
      const header = documentRef.createElement("div");
      header.className = "docs-public-link__header";
      appendTextElement(
        documentRef,
        header,
        "strong",
        "",
        link.documentTitle || `Documento ${link.documentId}`,
      );
      appendTextElement(
        documentRef,
        header,
        "span",
        "docs-card__status",
        PUBLIC_LINK_STATUS_LABELS[link.status],
      );
      const url = documentRef.createElement("a");
      url.className = "docs-public-link__url";
      url.href = link.publicUrl;
      url.target = "_blank";
      url.rel = "noopener noreferrer";
      url.textContent = link.publicUrl;
      const identity = appendTextElement(
        documentRef,
        item,
        "p",
        "docs-public-link__meta",
        `Slug: /${link.slug} · Documento: ${link.documentId} · Central: contexto autenticado atual`,
      );
      const policy = appendTextElement(
        documentRef,
        item,
        "p",
        "docs-public-link__meta",
        `${link.allowDownload ? "Forçar download" : "Abrir no navegador"} · ${
          link.expiresAt
            ? `expira em ${formatDate(link.expiresAt)}`
            : "sem expiração"
        }`,
      );
      const actions = documentRef.createElement("div");
      actions.className = "docs-public-link__actions";
      const copy = button(
        documentRef,
        "Copiar URL",
        "copy-public-link-admin",
        { ariaLabel: `Copiar URL do link /${link.slug}` },
      );
      copy.dataset.publicUrl = link.publicUrl;
      actions.append(copy);
      if (model.capabilities.update) {
        const nextStatus = link.status === "active" ? "inactive" : "active";
        const toggle = button(
          documentRef,
          link.status === "active" ? "Inativar" : "Ativar",
          "toggle-public-link-admin",
          {
            ariaLabel: `${
              link.status === "active" ? "Inativar" : "Ativar"
            } link /${link.slug}`,
            disabled: model.status === "saving",
          },
        );
        toggle.dataset.documentId = link.documentId;
        toggle.dataset.linkId = link.linkId;
        toggle.dataset.status = nextStatus;
        actions.append(toggle);
      }
      item.prepend(header, url);
      item.append(identity, policy, actions);
      list.append(item);
    }
    content.append(list);
    if (model.status === "ready") heading.focus();
  }

  function renderDeletionRequests(state) {
    const model = buildDeletionRequestsViewModel(state);
    loadMore.hidden = true;
    loadMore.disabled = true;
    showContent();
    content.replaceChildren();
    const heading = appendTextElement(
      documentRef,
      content,
      "h2",
      "",
      "Solicitações de Exclusão",
    );
    heading.tabIndex = -1;
    appendTextElement(
      documentRef,
      content,
      "p",
      "docs-deletion-intro",
      "A aprovação realiza exclusão lógica: o documento fica indisponível no Hub, mas os bytes físicos não são apagados por esta ação.",
    );
    if (model.status === "loading") {
      appendTextElement(documentRef, content, "p", "docs-muted", "Carregando solicitações.");
      return;
    }
    if (model.status === "error") {
      const error = appendTextElement(
        documentRef,
        content,
        "p",
        "docs-detail-message is-error",
        model.message,
      );
      error.setAttribute("role", "alert");
      return;
    }
    if (model.items.length === 0) {
      appendTextElement(
        documentRef,
        content,
        "p",
        "docs-muted",
        "Não há solicitações de exclusão para analisar.",
      );
      heading.focus();
      return;
    }
    const list = documentRef.createElement("ul");
    list.className = "docs-deletion-list";
    for (const request of model.items) {
      const item = documentRef.createElement("li");
      item.className = "docs-deletion-card";
      const header = documentRef.createElement("div");
      header.className = "docs-deletion-card__header";
      appendTextElement(documentRef, header, "h3", "", request.documentTitle);
      appendTextElement(
        documentRef,
        header,
        "span",
        "docs-card__status",
        DELETION_STATUS_LABELS[request.status],
      );
      item.append(header);
      appendTextElement(documentRef, item, "p", "", request.reason);
      appendTextElement(
        documentRef,
        item,
        "p",
        "docs-deletion-card__meta",
        `Solicitada em ${formatDate(request.requestedAt)}${
          request.requestedBy ? ` por ${request.requestedBy}` : ""
        }`,
      );
      if (["requested", "pending"].includes(request.status)) {
        const actions = documentRef.createElement("div");
        actions.className = "docs-deletion-card__actions";
        if (model.capabilities.review) {
          for (const [action, label, className] of [
            ["approve-deletion", "Aprovar Exclusão Lógica", "docs-button docs-button--danger"],
            ["reject-deletion", "Rejeitar", "docs-button docs-button--secondary"],
          ]) {
            const control = button(documentRef, label, action, {
              disabled: model.busy,
              className,
            });
            control.dataset.requestId = request.requestId;
            actions.append(control);
          }
        }
        if (model.capabilities.cancel) {
          const cancel = button(documentRef, "Cancelar Solicitação", "cancel-deletion-request", {
            disabled: model.busy,
          });
          cancel.dataset.requestId = request.requestId;
          actions.append(cancel);
        }
        item.append(actions);
      }
      list.append(item);
    }
    content.append(list);
    if (model.status === "ready") heading.focus();
  }

  function renderDetail(state) {
    const wasOpen = !detailRoot.hidden;
    const activeAction =
      (detailRoot.contains?.(documentRef.activeElement)
        ? (documentRef.activeElement?.dataset?.action ?? null)
        : null) ?? pendingActionFocus;
    if (state.status === "loading") {
      versions = Object.freeze([]);
      renderVersions([]);
      renderPublicLinks({
        status: "hidden",
        items: [],
        capabilities: {},
      });
    }
    lastDetailState = state;
    const model = buildDetailViewModel(state, versions, {
      viewer: features.viewer === true,
      openViewer: typeof boundHandlers?.openViewer === "function",
      favorites: favoritesEnabled,
      upload: features.upload === true,
      openUpload: typeof boundHandlers?.openUpload === "function",
    });
    if (model.busy) detailPanel.setAttribute("aria-busy", "true");
    else detailPanel.removeAttribute("aria-busy");
    if (!model.document) {
      if (detailTitle) detailTitle.textContent = "Detalhes do Documento";
      detailContent.replaceChildren();
      detailActions.replaceChildren();
      renderVersions([]);
      const message =
        state.status === "loading"
          ? "Carregando Detalhes."
          : model.message || "Não foi possível carregar os detalhes.";
      const messageElement = appendTextElement(
        documentRef,
        detailContent,
        "p",
        state.status === "loading" ? "docs-muted" : "docs-detail-message",
        message,
      );
      if (state.status !== "loading")
        messageElement.setAttribute("role", "alert");
      openDetail();
      if (wasOpen) {
        const close = detailRoot.querySelector('[data-action="close-detail"]');
        (close ?? detailPanel).focus();
      }
      return;
    }
    if (detailTitle) detailTitle.textContent = model.document.title;
    detailContent.replaceChildren();
    if (model.message) {
      const messageElement = appendTextElement(
        documentRef,
        detailContent,
        "p",
        `docs-detail-message is-${state.status}`,
        model.message,
      );
      messageElement.setAttribute("role", "alert");
    }
    if (state.status === "saving") {
      const savingMessage = appendTextElement(
        documentRef,
        detailContent,
        "p",
        "docs-muted",
        "Salvando alterações.",
      );
      savingMessage.setAttribute("role", "status");
    }
    const description = appendTextElement(
      documentRef,
      detailContent,
      "p",
      "docs-detail-description",
      model.document.description || "Sem descrição.",
    );
    description.id = "docs-detail-description";
    const list = documentRef.createElement("dl");
    list.className = "docs-detail-list";
    detailField(
      list,
      "Classificação",
      CLASSIFICATION_LABELS[model.document.classification],
    );
    detailField(
      list,
      "Estado",
      LIFECYCLE_LABELS[model.document.lifecycleStatus],
    );
    detailField(list, "Política de Indexação", model.document.indexingPolicy);
    detailField(
      list,
      "Última Atualização",
      formatDate(model.document.updatedAt),
    );
    detailContent.append(list);

    detailActions.replaceChildren();
    for (const action of model.actions) {
      const actionButton = button(documentRef, action.label, action.id, {
        disabled: model.actionsDisabled,
        documentId: model.document.documentId,
        className:
          action.id === "requestDeletion"
            ? "docs-button docs-button--danger"
            : "docs-button docs-button--secondary",
      });
      if (action.id === "favorite") {
        actionButton.dataset.favorite = String(model.favorite);
        actionButton.setAttribute("aria-pressed", String(model.favorite));
      }
      detailActions.append(actionButton);
    }
    if (model.canReload) {
      detailActions.append(
        button(documentRef, "Recarregar Documento", "reload-detail", {
          documentId: model.document.documentId,
        }),
      );
    }
    renderVersions(model.versions);
    if (model.pending?.type === "metadata") {
      renderEditForm(model.document, model.pending.values, true, false);
    }
    if (model.pending?.type === "deletion") {
      renderDeletionForm(model.pending.values, true, false);
    }
    openDetail();
    if (wasOpen) {
      const availableActions = [
        ...detailRoot.querySelectorAll("[data-action]"),
      ];
      const replacement = availableActions.find(
        (element) =>
          element.dataset.action === activeAction && !element.disabled,
      );
      const reload = availableActions.find(
        (element) =>
          element.dataset.action === "reload-detail" && !element.disabled,
      );
      (replacement ?? reload ?? detailPanel).focus();
      if (state.status !== "saving") pendingActionFocus = null;
    }
  }

  function renderRecent(items) {
    renderCatalog({
      status: items.length === 0 ? "empty" : "ready",
      mode: "recent",
      items,
      nextCursor: null,
    });
  }

  function renderCollections(items) {
    captureCatalogFocusIntent();
    loadMore.hidden = true;
    loadMore.disabled = true;
    if (items.length === 0) {
      renderState("empty", "Nenhuma coleção está disponível.", {
        controlsEnabled: true,
      });
      return;
    }
    content.replaceChildren();
    const list = documentRef.createElement("div");
    list.className = "docs-collection-grid";
    for (const item of items) {
      const card = documentRef.createElement("article");
      card.className = "docs-collection-card";
      appendTextElement(documentRef, card, "h3", "", item.name);
      const open = button(documentRef, "Ver Documentos", "open-collection", {
        ariaLabel: `Ver documentos da coleção ${item.name}`,
      });
      open.dataset.collectionId = item.collectionId;
      card.append(open);
      list.append(card);
    }
    content.append(list);
    showContent();
  }

  function formFilters() {
    const filters = {};
    for (const select of [
      collectionFilter,
      tagFilter,
      classificationFilter,
      lifecycleFilter,
    ]) {
      if (select?.value) filters[select.name] = select.value;
    }
    return filters;
  }

  function bind(handlers) {
    if (boundHandlers) throw new TypeError("Apresentação já vinculada.");
    boundHandlers = handlers;
    selectNavigation("documentos");
    syncFeatureControls();

    listen(searchForm, "submit", (event) => {
      event.preventDefault();
      if (!searchEnabled) return;
      pendingCatalogFocus = null;
      const query = searchInput?.value?.trim();
      selectNavigation("documentos");
      dispatch(() =>
        query ? handlers.search(query) : handlers.navigate("documentos"),
      );
    });
    listen(filtersForm, "submit", (event) => {
      event.preventDefault();
      pendingCatalogFocus = null;
      selectNavigation("documentos");
      dispatch(() => handlers.applyFilters(formFilters()));
    });
    listen(filtersForm, "reset", () => {
      globalThis.queueMicrotask(() => {
        pendingCatalogFocus = null;
        selectNavigation("documentos");
        dispatch(() => handlers.applyFilters({}));
      });
    });
    listen(loadMore, "click", () => dispatch(() => handlers.loadNext()));
    listen(uploadButton, "click", () =>
      dispatch(() => handlers.openUpload?.()),
    );
    for (const navigation of documentRef.querySelectorAll("[data-view]")) {
      listen(navigation, "click", () => {
        if (navigation.disabled) return;
        pendingCatalogFocus = null;
        selectNavigation(navigation.dataset.view);
        dispatch(() => handlers.navigate(navigation.dataset.view));
      });
    }
    listen(content, "click", (event) => {
      const target = event.target.closest?.("[data-action]");
      if (!target || target.disabled) return;
      const documentId = target.dataset.documentId;
      if (target.dataset.action === "open-detail") {
        pendingCatalogFocus = null;
        const favoriteControl = target
          .closest("[data-document-id]")
          ?.querySelector('[data-action="toggle-card-favorite"]');
        const loadOptions = favoriteControl
          ? { favorite: favoriteControl.dataset.favorite === "true" }
          : {};
        dispatch(() => handlers.openDocument(documentId, loadOptions));
      }
      if (target.dataset.action === "toggle-card-favorite") {
        if (!favoritesEnabled) return;
        const nextFavorite = target.dataset.favorite !== "true";
        pendingCatalogFocus = {
          action: target.dataset.action,
          documentId,
          origin: target,
          shouldRestore: documentRef.activeElement === target,
        };
        target.disabled = true;
        target.setAttribute("aria-busy", "true");
        dispatch(async () => {
          try {
            return await handlers.toggleCardFavorite?.(
              nextFavorite,
              documentId,
              {
                favorite: target.dataset.favorite === "true",
              },
            );
          } catch (error) {
            const shouldMoveFocus = shouldRestoreCatalogFocus(
              target,
              documentRef.activeElement,
              documentRef.body,
            );
            pendingCatalogFocus = null;
            onActionError(error);
            if (shouldMoveFocus) {
              documentRef
                .querySelector('[data-view][aria-current="page"]')
                ?.focus?.();
            }
            return null;
          } finally {
            if (target.isConnected !== false) {
              target.disabled = false;
              target.removeAttribute("aria-busy");
            }
          }
        });
      }
      if (target.dataset.action === "open-collection") {
        pendingCatalogFocus = {
          action: target.dataset.action,
          documentId: null,
          origin: target,
        };
        selectNavigation("documentos");
        dispatch(() =>
          handlers.applyFilters({ collectionId: target.dataset.collectionId }),
        );
      }
      if (target.dataset.action === "copy-public-link-admin") {
        dispatch(async () => {
          await copyText(target.dataset.publicUrl);
          const status = documentRef.querySelector(
            "#docs-public-links-admin-status",
          );
          if (status) status.textContent = "URL pública copiada.";
        });
      }
      if (target.dataset.action === "toggle-public-link-admin") {
        const nextStatus = target.dataset.status;
        if (
          nextStatus === "inactive" &&
          !confirmAction(
            "Inativar este link? O acesso público será interrompido imediatamente.",
          )
        ) {
          return;
        }
        dispatch(() =>
          handlers.updateTenantPublicLink?.(
            target.dataset.documentId,
            target.dataset.linkId,
            { status: nextStatus },
          ),
        );
      }
      if (target.dataset.action === "clear-public-link-filters") {
        dispatch(() => handlers.applyPublicLinkFilters?.({}));
      }
      const deletionAction = {
        "approve-deletion": "approve",
        "reject-deletion": "reject",
        "cancel-deletion-request": "cancel",
      }[target.dataset.action];
      if (deletionAction) {
        const messages = {
          approve:
            "Aprovar a exclusão lógica? O documento ficará indisponível no Hub, mas os bytes físicos não serão apagados.",
          reject: "Rejeitar esta solicitação de exclusão?",
          cancel: "Cancelar esta solicitação de exclusão?",
        };
        if (!confirmAction(messages[deletionAction])) return;
        dispatch(() =>
          handlers.decideDeletionRequest?.(
            target.dataset.requestId,
            deletionAction,
          ),
        );
      }
    });
    listen(content, "submit", (event) => {
      if (event.target.id !== "docs-public-links-admin-filters") return;
      event.preventDefault();
      if (!event.target.checkValidity()) {
        event.target.reportValidity();
        return;
      }
      const data = new FormData(event.target);
      dispatch(() =>
        handlers.applyPublicLinkFilters?.({
          status: String(data.get("status") ?? ""),
          slug: String(data.get("slug") ?? "").trim().toLowerCase(),
          documentId: String(data.get("documentId") ?? "").trim(),
        }),
      );
    });
    listen(detailRoot, "click", (event) => {
      const target = event.target.closest?.("[data-action]");
      if (!target || target.disabled) return;
      const action = target.dataset.action;
      const documentId =
        target.dataset.documentId ??
        lastDetailState?.detail?.document?.documentId ??
        null;
      if (action === "close-detail") {
        closeDetail();
        dispatch(() => handlers.closeDocument?.());
      }
      if (action === "reload-detail") {
        pendingActionFocus = action;
        const loadOptions =
          typeof lastDetailState?.favorite === "boolean"
            ? { favorite: lastDetailState.favorite }
            : {};
        dispatch(() => handlers.openDocument(documentId, loadOptions));
      }
      if (action === "open") {
        viewerOpenedFromDetail = true;
        viewerPreviousFocus = target;
        hideDetailForViewer();
        dispatch(() => handlers.openViewer?.(documentId));
      }
      if (action === "favorite") {
        if (!favoritesEnabled) return;
        pendingActionFocus = action;
        dispatch(() =>
          handlers.setFavorite(target.dataset.favorite !== "true", documentId),
        );
      }
      if (action === "uploadVersion") {
        dispatch(() => handlers.openUpload?.(documentId));
      }
      if (action === "edit" && lastDetailState?.detail?.document) {
        renderEditForm(lastDetailState.detail.document);
      }
      if (action === "archive") {
        pendingActionFocus = action;
        dispatch(() => handlers.archive(documentId));
      }
      if (action === "restore") {
        pendingActionFocus = action;
        dispatch(() => handlers.restore(documentId));
      }
      if (action === "requestDeletion") renderDeletionForm();
      if (action === "open-public-link-form") renderPublicLinkForm();
      if (action === "cancel-public-link-form") {
        detailRoot.querySelector("#docs-public-link-form")?.remove();
        publicLinkCreate.focus();
      }
      if (action === "copy-public-link") {
        dispatch(async () => {
          await copyText(target.dataset.publicUrl);
          publicLinksStatus.textContent = "URL copiada.";
        });
      }
      if (action === "toggle-public-link") {
        const nextStatus = target.dataset.status;
        if (
          nextStatus === "inactive" &&
          !confirmAction(
            "Inativar este link? O acesso público será interrompido imediatamente.",
          )
        ) {
          return;
        }
        dispatch(() =>
          handlers.updatePublicLink?.(
            target.dataset.linkId,
            { status: nextStatus },
            documentId,
          ),
        );
      }
      if (action === "promote-version") {
        pendingActionFocus = action;
        dispatch(() =>
          handlers.promoteVersion(target.dataset.versionId, documentId),
        );
      }
    });
    listen(detailRoot, "submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      if (event.target.id === "docs-edit-form") {
        pendingActionFocus = "edit";
        const documentId =
          lastDetailState?.detail?.document?.documentId ?? null;
        dispatch(() =>
          handlers.updateMetadata(
            {
              title: String(data.get("title") ?? ""),
              description: String(data.get("description") ?? ""),
            },
            documentId,
          ),
        );
      }
      if (event.target.id === "docs-deletion-form") {
        pendingActionFocus = "requestDeletion";
        const documentId =
          lastDetailState?.detail?.document?.documentId ?? null;
        dispatch(() =>
          handlers.requestDeletion(
            String(data.get("reason") ?? ""),
            documentId,
          ),
        );
      }
      if (event.target.id === "docs-public-link-form") {
        const slugControl = event.target.elements?.namedItem?.("slug");
        slugControl?.setCustomValidity?.("");
        const slugValue = String(data.get("slug") ?? "")
          .trim()
          .toLowerCase();
        if (RESERVED_PUBLIC_SLUGS.has(slugValue)) {
          slugControl?.setCustomValidity?.(
            `O endereço curto “${slugValue}” é reservado. Escolha outro slug.`,
          );
          slugControl?.reportValidity?.();
          return;
        }
        if (!event.target.checkValidity()) {
          event.target.reportValidity();
          return;
        }
        const documentId =
          lastDetailState?.detail?.document?.documentId ?? null;
        dispatch(() =>
          handlers.createPublicLink?.(
            {
              slug: slugValue,
              expiresAt: String(data.get("expiresAt") ?? "") || null,
              allowDownload: data.get("allowDownload") === "on",
            },
            documentId,
          ),
        );
      }
    });
    listen(detailRoot, "keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetail();
        dispatch(() => handlers.closeDocument?.());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        ...detailRoot.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => !element.hidden);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && documentRef.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    listen(uploadForm, "submit", (event) => {
      event.preventDefault();
      if (!uploadForm.checkValidity()) {
        uploadForm.reportValidity();
        return;
      }
      const file = uploadFile.files?.[0];
      if (!file) {
        renderUpload({
          status: "error",
          message: "Selecione um arquivo permitido.",
          canRetry: false,
        });
        return;
      }
      dispatch(() =>
        handlers.startUpload?.({
          file,
          ...(uploadDocumentId.value
            ? { documentId: uploadDocumentId.value }
            : {
                title: uploadDocumentTitle.value,
                description: uploadDescription.value,
                collectionId: uploadCollection.value || null,
                classification: uploadClassification.value,
                indexingPolicy:
                  !searchEnabled && uploadIndexing.value === "full_text"
                    ? "metadata_only"
                    : uploadIndexing.value,
              }),
        }),
      );
    });
    listen(uploadRoot, "click", (event) => {
      const target = event.target.closest?.("[data-action]");
      if (!target || target.disabled) return;
      if (target.dataset.action === "cancel-upload") {
        closeUpload();
        dispatch(() => handlers.cancelUpload?.());
      }
      if (target.dataset.action === "retry-upload") {
        dispatch(() => handlers.retryUpload?.());
      }
    });
    listen(uploadRoot, "keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeUpload();
        dispatch(() => handlers.cancelUpload?.());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        ...uploadRoot.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => !element.hidden);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && documentRef.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    listen(viewerRoot, "click", (event) => {
      const target = event.target.closest?.("[data-action]");
      if (!target || target.disabled) return;
      const action = target.dataset.action;
      if (action === "close-viewer") {
        dispatch(() => handlers.closeViewer?.());
      } else if (action === "viewer-download") {
        dispatch(() => handlers.viewerDownload?.());
      } else if (action === "viewer-previous") {
        dispatch(() =>
          handlers.viewerGoToPage?.(
            Math.max(1, (lastViewerState?.page ?? 1) - 1),
          ),
        );
      } else if (action === "viewer-next") {
        dispatch(() =>
          handlers.viewerGoToPage?.(
            Math.min(
              lastViewerState?.pageCount ?? 1,
              (lastViewerState?.page ?? 1) + 1,
            ),
          ),
        );
      }
    });
    listen(viewerRoot, "keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dispatch(() => handlers.closeViewer?.());
        return;
      }
      if (event.key !== "Tab" || !viewerIsMobile()) return;
      const focusable = [
        ...viewerRoot.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => !element.hidden);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && documentRef.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    listen(viewerModeQuery, "change", syncViewerMode);

    return () => {
      for (const remove of cleanup.splice(0)) remove();
      selectNavigation("documentos");
      boundHandlers = null;
      syncFeatureControls();
    };
  }

  function clearSensitiveState() {
    closeViewerPanel({ restoreFocus: false, restoreDetail: false });
    closeUpload({ restoreFocus: false });
    closeDetail();
    setBackgroundInert(false);
    content.replaceChildren();
    content.hidden = true;
    detailContent.replaceChildren();
    detailActions.replaceChildren();
    versionList.replaceChildren();
    if (detailTitle) detailTitle.textContent = "Documento";
    if (searchInput) searchInput.value = "";
    replaceSelectOptions(
      collectionFilter,
      [],
      "collectionId",
      "name",
      "Todas as Coleções",
    );
    replaceSelectOptions(tagFilter, [], "tagId", "name", "Todas as Tags");
    if (classificationFilter) classificationFilter.value = "";
    if (lifecycleFilter) lifecycleFilter.value = "";
    loadMore.hidden = true;
    loadMore.disabled = true;
    versions = Object.freeze([]);
    lastDetailState = null;
    pendingActionFocus = null;
    pendingCatalogFocus = null;
    lastViewerState = null;
    lastUploadState = null;
    lastPublicLinksState = null;
    renderPublicLinks({
      status: "hidden",
      items: [],
      capabilities: {},
    });
    catalogPermissions = new Set();
    syncFeatureControls();
  }

  return Object.freeze({
    bind,
    setMetadata,
    setFilters,
    renderCatalog,
    renderDetail,
    renderVersions,
    renderVersionsError,
    renderPublicLinks,
    renderPublicLinksAdmin,
    renderDeletionRequests,
    renderRecent,
    renderCollections,
    renderViewer,
    renderPdfPage,
    openUpload,
    closeUpload,
    renderUpload,
    clearSensitiveState,
    destroy() {
      for (const remove of cleanup.splice(0)) remove();
      boundHandlers = null;
      clearSensitiveState();
    },
  });
}
