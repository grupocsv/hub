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
  if (document !== null && !plainObject(document)) {
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
    if (!plainObject(version) || typeof version.versionId !== "string") {
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
            documentId: model?.document?.documentId,
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

  function renderDetail(state) {
    const wasOpen = !detailRoot.hidden;
    const activeAction =
      (detailRoot.contains?.(documentRef.activeElement)
        ? (documentRef.activeElement?.dataset?.action ?? null)
        : null) ?? pendingActionFocus;
    if (state.status === "loading") {
      versions = Object.freeze([]);
      renderVersions([]);
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
