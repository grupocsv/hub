import assert from "node:assert/strict";
import test from "node:test";

import { createDocumentosWorkspace } from "../../docs/public/documentos/assets/workspace.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function fixture(overrides = {}) {
  const calls = [];
  const catalogState = {
    status: "ready",
    mode: "catalog",
    items: [
      {
        documentId: "document-a",
        title: "Documento A",
        favorite: false,
        updatedAt: "2026-07-24T11:00:00.000Z",
      },
    ],
    nextCursor: null,
    filters: {},
  };
  let catalogOptions;
  let detailOptions;
  let handlers;
  let lifecycleOptions;
  let viewerOptions;
  let uploadOptions;
  const view = {
    bind(value) {
      handlers = value;
      calls.push(["view.bind"]);
      return () => calls.push(["view.unbind"]);
    },
    setMetadata(value) {
      calls.push(["view.metadata", value]);
    },
    setFilters(value) {
      calls.push(["view.filters", value]);
    },
    renderCatalog(value) {
      calls.push(["view.catalog", value]);
    },
    renderDetail(value) {
      calls.push(["view.detail", value]);
    },
    renderVersions(value) {
      calls.push(["view.versions", value]);
    },
    renderVersionsError() {
      calls.push(["view.versions.error"]);
    },
    renderRecent(value) {
      calls.push(["view.recent", value]);
    },
    renderCollections(value) {
      calls.push(["view.collections", value]);
    },
    renderViewer(value) {
      calls.push(["view.viewer", value]);
    },
    async renderPdfPage(value) {
      calls.push(["view.viewer.pdf", value]);
    },
    openUpload(value) {
      calls.push(["view.upload.open", value]);
    },
    closeUpload() {
      calls.push(["view.upload.close"]);
    },
    renderUpload(value) {
      calls.push(["view.upload", value]);
    },
    clearSensitiveState(reason) {
      calls.push(["view.clear", reason]);
    },
    destroy() {
      calls.push(["view.destroy"]);
    },
  };
  const catalog = {
    async loadMetadata() {
      calls.push(["catalog.metadata"]);
      return {
        collections: [{ collectionId: "collection-a", name: "Coleção A" }],
        tags: [{ tagId: "tag-a", name: "Tag A" }],
        permissions: ["create"],
      };
    },
    async loadList(filters) {
      calls.push(["catalog.list", filters]);
      catalogOptions.onState(catalogState);
      return catalogState;
    },
    async loadNext() {
      calls.push(["catalog.next"]);
    },
    async search(query) {
      calls.push(["catalog.search", query]);
    },
    cancelActive() {
      calls.push(["catalog.cancel"]);
    },
    destroy() {
      calls.push(["catalog.destroy"]);
    },
  };
  Object.assign(catalog, overrides.catalog);
  const detail = {
    async load(documentId, options) {
      calls.push(["detail.load", documentId, options]);
      const loaded = {
        document: {
          documentId,
          title: "Documento A",
          description: "Descrição completa.",
          classification: "internal",
          lifecycleStatus: "active",
          indexingPolicy: "metadata_only",
          updatedAt: "2026-07-24T11:00:00.000Z",
        },
        permissions: [
          "read",
          "create_version",
          "update_metadata",
          "archive",
          "publish",
        ],
      };
      detailOptions.onState({ status: "ready", detail: loaded });
      return loaded;
    },
    async loadVersions() {
      calls.push(["detail.versions"]);
      return [{ versionId: "version-a", publicationStatus: "eligible" }];
    },
    async updateMetadata(patch) {
      calls.push(["detail.update", patch]);
    },
    async setFavorite(value) {
      calls.push(["detail.favorite", value]);
    },
    async archive() {
      calls.push(["detail.archive"]);
    },
    async restore() {
      calls.push(["detail.restore"]);
    },
    async requestDeletion(reason) {
      calls.push(["detail.delete", reason]);
    },
    async promoteVersion(versionId) {
      calls.push(["detail.promote", versionId]);
    },
    async refresh() {
      calls.push(["detail.refresh"]);
      return {
        document: {
          documentId: "document-a",
          title: "Documento A",
          updatedAt: "2026-07-24T12:00:00.000Z",
        },
        permissions: ["read"],
        etag: '"etag-revalidado"',
      };
    },
    cancel() {
      calls.push(["detail.cancel"]);
    },
    destroy() {
      calls.push(["detail.destroy"]);
    },
  };
  Object.assign(detail, overrides.detail);
  const viewer = {
    async open(value) {
      calls.push(["viewer.open", value]);
      return { kind: "pdf", page: value.page ?? 1 };
    },
    async goToPage(value) {
      calls.push(["viewer.page", value]);
      return value;
    },
    async download() {
      calls.push(["viewer.download"]);
      return true;
    },
    async close() {
      calls.push(["viewer.close"]);
    },
    async destroy(reason) {
      calls.push(["viewer.destroy", reason]);
    },
  };
  Object.assign(viewer, overrides.viewer);
  const upload = {
    async start(value) {
      calls.push(["upload.start", value]);
      const result = {
        status: "succeeded",
        documentId: value.documentId ?? "document-created",
        versionId: "version-uploaded",
      };
      uploadOptions.onState(result);
      return result;
    },
    async retry() {
      calls.push(["upload.retry"]);
      return { status: "processing" };
    },
    async cancel() {
      calls.push(["upload.cancel"]);
      return { status: "cancelled" };
    },
    destroy() {
      calls.push(["upload.destroy"]);
    },
  };
  Object.assign(upload, overrides.upload);
  const recentEntries = [];
  const recent = {
    record(documentId, updatedAt) {
      recentEntries.unshift(documentId);
      calls.push(["recent.record", documentId, updatedAt]);
    },
    list() {
      return recentEntries;
    },
    clear() {
      recentEntries.length = 0;
      calls.push(["recent.clear"]);
    },
  };

  const workspace = createDocumentosWorkspace({
    client: { request() {} },
    portal: "unimed",
    view,
    createCatalogController(options) {
      catalogOptions = options;
      return catalog;
    },
    createDetailController(options) {
      detailOptions = options;
      return detail;
    },
    createRecentStore() {
      return recent;
    },
    features: overrides.features ?? { favorites: true, search: true },
    createViewerController(options) {
      viewerOptions = options;
      return viewer;
    },
    createUploadController(options) {
      uploadOptions = options;
      return upload;
    },
    locationRef: overrides.locationRef,
    historyRef: overrides.historyRef,
    routeEventTarget: overrides.routeEventTarget,
    bindLifecycle(options) {
      lifecycleOptions = options;
      return { destroy: () => calls.push(["lifecycle.destroy"]) };
    },
  });

  return {
    workspace,
    calls,
    getHandlers: () => handlers,
    getLifecycleOptions: () => lifecycleOptions,
    getDetailOptions: () => detailOptions,
    getViewerOptions: () => viewerOptions,
    getUploadOptions: () => uploadOptions,
    emitCatalog: (state) => catalogOptions.onState(state),
  };
}

test("inicia metadados e primeira página e liga a view uma única vez", async () => {
  const context = fixture();
  await context.workspace.start();
  await context.workspace.start();

  assert.deepEqual(context.calls.slice(0, 4), [
    ["view.bind"],
    ["catalog.metadata"],
    [
      "view.metadata",
      {
        collections: [{ collectionId: "collection-a", name: "Coleção A" }],
        tags: [{ tagId: "tag-a", name: "Tag A" }],
        permissions: ["create"],
      },
    ],
    ["catalog.list", {}],
  ]);
  assert.equal(
    context.calls.filter(([name]) => name === "view.bind").length,
    1,
  );
});

test("condiciona upload a create ou create_version e atualiza o catálogo após sucesso", async () => {
  const context = fixture({
    features: { favorites: true, upload: true },
  });
  await context.workspace.start();
  const handlers = context.getHandlers();

  assert.deepEqual(handlers.openUpload(), {
    mode: "create",
    collections: [{ collectionId: "collection-a", name: "Coleção A" }],
  });
  const createResult = await handlers.startUpload({
    file: { name: "novo.pdf" },
    title: "Novo Documento",
  });
  assert.equal(createResult.status, "succeeded");
  assert.deepEqual(
    context.calls.find(([name]) => name === "upload.start")?.[1].permissions,
    ["create"],
  );

  await handlers.openDocument("document-a");
  assert.deepEqual(handlers.openUpload("document-a"), {
    mode: "version",
    documentId: "document-a",
    title: "Documento A",
  });
  await handlers.startUpload({
    file: { name: "versao.pdf" },
    documentId: "document-a",
  });
  const versionStart = context.calls
    .filter(([name]) => name === "upload.start")
    .at(-1)[1];
  assert.deepEqual(versionStart.permissions, [
    "read",
    "create_version",
    "update_metadata",
    "archive",
    "publish",
  ]);

  await handlers.retryUpload();
  await handlers.cancelUpload();
  assert.equal(
    context.calls.some(([name]) => name === "upload.retry"),
    true,
  );
  assert.equal(
    context.calls.some(([name]) => name === "upload.cancel"),
    true,
  );
  assert.equal(
    context.calls.filter(([name]) => name === "catalog.list").length >= 3,
    true,
  );
});

test("não abre upload quando a capacidade ou a permissão documental não foi concedida", async () => {
  const context = fixture({
    features: { favorites: true, upload: true },
    catalog: {
      async loadMetadata() {
        context.calls.push(["catalog.metadata"]);
        return {
          collections: [],
          tags: [],
          permissions: [],
        };
      },
    },
    detail: {
      async load(documentId) {
        const loaded = {
          document: {
            documentId,
            title: "Somente Leitura",
            description: "",
            classification: "internal",
            lifecycleStatus: "active",
            indexingPolicy: "metadata_only",
            updatedAt: "2026-07-24T11:00:00.000Z",
          },
          permissions: ["read"],
        };
        return loaded;
      },
    },
  });
  await context.workspace.start();
  const handlers = context.getHandlers();

  assert.equal(handlers.openUpload(), null);
  await handlers.openDocument("document-a");
  assert.equal(handlers.openUpload("document-a"), null);
  assert.equal(
    context.calls.some(([name]) => name === "view.upload.open"),
    false,
  );
});

test("orquestra busca, filtros, favoritos e paginação sem filtrar favoritos localmente", async () => {
  const context = fixture();
  await context.workspace.start();
  const handlers = context.getHandlers();

  await handlers.search("oncologia");
  await handlers.applyFilters({ collectionId: "collection-a", tagId: "tag-a" });
  await handlers.navigate("favoritos");
  await handlers.loadNext();

  assert.deepEqual(
    context.calls.filter(([name]) => name.startsWith("catalog.")),
    [
      ["catalog.metadata"],
      ["catalog.list", {}],
      ["catalog.search", "oncologia"],
      ["catalog.list", { collectionId: "collection-a", tagId: "tag-a" }],
      ["catalog.list", { favorite: true }],
      ["catalog.next"],
    ],
  );
  assert.deepEqual(
    context.calls.filter(([name]) => name === "view.filters"),
    [
      ["view.filters", {}],
      ["view.filters", { collectionId: "collection-a", tagId: "tag-a" }],
      ["view.filters", {}],
    ],
  );
});

test("busca falha fechado quando features.search está ausente", async () => {
  const context = fixture({ features: { favorites: true } });
  await context.workspace.start();
  context.calls.length = 0;

  assert.equal(await context.getHandlers().search("oncologia"), null);
  assert.equal(
    context.calls.some(([name]) => name === "catalog.search"),
    false,
  );
});

test("abre detalhe, registra recente efêmero e carrega versões autorizadas", async () => {
  const context = fixture();
  await context.workspace.start();
  const handlers = context.getHandlers();

  await handlers.openDocument("document-a", { favorite: false });
  await handlers.navigate("recentes");

  assert.deepEqual(
    context.calls.filter(([name]) => name.startsWith("detail.")),
    [["detail.load", "document-a", { favorite: false }], ["detail.versions"]],
  );
  assert.ok(
    context.calls.some(
      ([name, value]) =>
        name === "view.recent" && value[0].documentId === "document-a",
    ),
  );
});

test("encaminha mutações ao controlador de detalhe e recarrega o catálogo atual", async () => {
  const context = fixture();
  await context.workspace.start();
  const handlers = context.getHandlers();
  await handlers.openDocument("document-a", { favorite: false });

  await handlers.updateMetadata({ title: "Novo Título" });
  await handlers.setFavorite(true);
  await handlers.archive();
  await handlers.restore();
  await handlers.requestDeletion("Retenção encerrada");
  await handlers.promoteVersion("version-a");

  assert.deepEqual(
    context.calls.filter(([name]) => name.startsWith("detail.")).slice(2),
    [
      ["detail.update", { title: "Novo Título" }],
      ["detail.favorite", true],
      ["detail.archive"],
      ["detail.restore"],
      ["detail.delete", "Retenção encerrada"],
      ["detail.refresh"],
      ["detail.promote", "version-a"],
      ["detail.refresh"],
      ["detail.versions"],
    ],
  );
  assert.ok(
    context.calls.filter(([name]) => name === "catalog.list").length >= 5,
  );
});

test("exclusão e promoção usam somente o updatedAt do GET canônico posterior", async () => {
  const refreshedAt = ["2026-07-24T13:00:00.000Z", "2026-07-24T14:00:00.000Z"];
  const context = fixture({
    detail: {
      async requestDeletion() {
        return {
          requestId: "request-a",
          createdAt: "2026-07-24T12:00:00.000Z",
        };
      },
      async promoteVersion() {
        return {
          versionId: "version-a",
          updatedAt: "2026-07-24T12:30:00.000Z",
        };
      },
      async refresh() {
        const updatedAt = refreshedAt.shift();
        return {
          document: {
            documentId: "document-a",
            title: "Documento Canônico",
            updatedAt,
          },
          permissions: ["read", "publish"],
          etag: `"${updatedAt}"`,
        };
      },
    },
  });
  await context.workspace.start();
  await context.workspace.openDocument("document-a");
  context.calls.length = 0;

  await context.workspace.requestDeletion("Retenção encerrada", "document-a");
  await context.workspace.promoteVersion("version-a", "document-a");

  const recordedTimestamps = context.calls
    .filter(([name]) => name === "recent.record")
    .map(([, , updatedAt]) => updatedAt);
  assert.deepEqual(recordedTimestamps, [
    "2026-07-24T13:00:00.000Z",
    "2026-07-24T14:00:00.000Z",
  ]);
  assert.equal(recordedTimestamps.includes("2026-07-24T12:00:00.000Z"), false);
  assert.equal(recordedTimestamps.includes("2026-07-24T12:30:00.000Z"), false);
});

test("falha no GET posterior não invalida mutação já confirmada nem altera Recentes", async () => {
  const confirmedRequest = { requestId: "request-a", status: "requested" };
  const context = fixture({
    detail: {
      async requestDeletion() {
        return confirmedRequest;
      },
      async refresh() {
        throw new Error("leitura indisponível");
      },
    },
  });
  await context.workspace.start();
  await context.workspace.openDocument("document-a");
  context.calls.length = 0;

  const result = await context.workspace.requestDeletion(
    "Retenção encerrada",
    "document-a",
  );

  assert.equal(result, confirmedRequest);
  assert.equal(
    context.calls.some(([name]) => name === "recent.record"),
    false,
  );
});

test("atualiza Recentes somente com updatedAt confirmado pela resposta da mutação", async () => {
  const confirmedUpdatedAt = "2026-07-24T12:30:00.000Z";
  const context = fixture({
    detail: {
      async updateMetadata() {
        return {
          document: {
            documentId: "document-a",
            title: "Documento Atualizado",
            updatedAt: confirmedUpdatedAt,
          },
          permissions: ["read", "update_metadata"],
          etag: '"etag-atualizado"',
        };
      },
      async setFavorite() {
        return true;
      },
    },
  });
  await context.workspace.start();
  await context.workspace.openDocument("document-a", { favorite: false });
  await context.workspace.navigate("recentes");
  context.calls.length = 0;

  await context.workspace.updateMetadata(
    { title: "Documento Atualizado" },
    "document-a",
  );
  assert.ok(
    context.calls.some(
      ([name, documentId, updatedAt]) =>
        name === "recent.record" &&
        documentId === "document-a" &&
        updatedAt === confirmedUpdatedAt,
    ),
  );
  const refreshedRecent = context.calls.find(
    ([name]) => name === "view.recent",
  );
  assert.equal(refreshedRecent[1][0].title, "Documento Atualizado");
  assert.equal(refreshedRecent[1][0].updatedAt, confirmedUpdatedAt);

  context.calls.length = 0;
  await context.workspace.setFavorite(true, "document-a");
  assert.equal(
    context.calls.some(([name]) => name === "recent.record"),
    false,
  );

  const favoriteRecent = context.calls.find(([name]) => name === "view.recent");
  assert.equal(favoriteRecent[1][0].favorite, true);
});

test("favorito do cartão valida o detalhe sem abrir o modal", async () => {
  const context = fixture({
    detail: {
      async setFavorite(value) {
        context.calls.push(["detail.favorite", value]);
        return value;
      },
    },
  });
  await context.workspace.start();
  context.calls.length = 0;

  const result = await context.workspace.toggleCardFavorite(
    true,
    "document-a",
    { favorite: false },
  );

  assert.equal(result, true);
  assert.ok(context.calls.some(([name]) => name === "detail.load"));
  assert.ok(
    context.calls.some(
      ([name, value]) => name === "detail.favorite" && value === true,
    ),
  );
  assert.ok(context.calls.some(([name]) => name === "detail.cancel"));
  assert.equal(
    context.calls.some(([name]) => name === "view.detail"),
    false,
  );
});

test("favorito de cartão supersedido não atinge o documento que assumiu a seleção", async () => {
  const pendingCardLoad = deferred();
  let controllerDocumentId = null;
  const favoriteTargets = [];
  let context;
  context = fixture({
    detail: {
      async load(documentId) {
        context.calls.push(["detail.load", documentId]);
        controllerDocumentId = documentId;
        if (documentId === "document-a") return pendingCardLoad.promise;
        return {
          document: {
            documentId,
            title: "Documento B",
            description: "",
            classification: "internal",
            lifecycleStatus: "active",
            indexingPolicy: "metadata_only",
            updatedAt: "2026-07-24T12:00:00.000Z",
          },
          permissions: ["read"],
        };
      },
      async loadVersions() {
        return [];
      },
      async setFavorite(value) {
        favoriteTargets.push([controllerDocumentId, value]);
        return value;
      },
    },
  });
  await context.workspace.start();

  const toggle = context.workspace.toggleCardFavorite(
    true,
    "document-a",
    { favorite: false },
  );
  await Promise.resolve();
  await context.workspace.openDocument("document-b");
  pendingCardLoad.resolve({
    document: {
      documentId: "document-a",
      title: "Documento A",
      description: "",
      classification: "internal",
      lifecycleStatus: "active",
      indexingPolicy: "metadata_only",
      updatedAt: "2026-07-24T11:00:00.000Z",
    },
    permissions: ["read"],
  });

  assert.equal(await toggle, null);
  assert.deepEqual(favoriteTargets, []);
});

test("bloqueia de forma determinística favoritos concorrentes do mesmo cartão", async () => {
  const pendingFavorite = deferred();
  let favoriteRequests = 0;
  let context;
  context = fixture({
    detail: {
      async setFavorite(value) {
        favoriteRequests += 1;
        context.calls.push(["detail.favorite", value]);
        return pendingFavorite.promise;
      },
    },
  });
  await context.workspace.start();

  const first = context.workspace.toggleCardFavorite(
    true,
    "document-a",
    { favorite: false },
  );
  await Promise.resolve();
  await Promise.resolve();
  const second = context.workspace.toggleCardFavorite(
    false,
    "document-a",
    { favorite: false },
  );
  await Promise.resolve();

  assert.equal(favoriteRequests, 1);
  assert.equal(await second, null);
  pendingFavorite.resolve(true);
  assert.equal(await first, true);
  assert.equal(favoriteRequests, 1);
});

test("resultado parcial de busca não contamina snapshot completo de Recentes", async () => {
  const context = fixture();
  await context.workspace.start();
  await context.workspace.openDocument("document-a", { favorite: true });
  context.emitCatalog({
    status: "ready",
    mode: "catalog",
    items: [
      {
        documentId: "document-a",
        title: "Documento Completo",
        description: "Descrição completa.",
        classification: "internal",
        lifecycleStatus: "active",
        updatedAt: "2026-07-24T11:00:00.000Z",
        favorite: true,
      },
    ],
    nextCursor: null,
  });
  context.emitCatalog({
    status: "ready",
    mode: "search",
    items: [
      {
        documentId: "document-a",
        versionId: "version-a",
        title: "Recorte da Busca",
        excerpt: "Trecho parcial.",
        score: 0.9,
        source: "search",
        favorite: null,
      },
    ],
    nextCursor: null,
  });

  await context.workspace.navigate("recentes");
  const recentRender = context.calls
    .filter(([name]) => name === "view.recent")
    .at(-1);
  assert.equal(recentRender[1][0].title, "Documento Completo");
  assert.equal(recentRender[1][0].favorite, true);
  assert.equal(recentRender[1][0].updatedAt, "2026-07-24T11:00:00.000Z");
});

test("documento aberto somente pela busca entra em Recentes com favorito desconhecido", async () => {
  const context = fixture();
  await context.workspace.start();
  context.emitCatalog({
    status: "ready",
    mode: "search",
    items: [
      {
        documentId: "document-b",
        versionId: "version-b",
        title: "Documento da Busca",
        excerpt: "Trecho parcial.",
        score: 0.9,
        source: "search",
        favorite: null,
      },
    ],
    nextCursor: null,
  });

  await context.workspace.openDocument("document-b");
  await context.workspace.navigate("recentes");

  const recentRender = context.calls
    .filter(([name]) => name === "view.recent")
    .at(-1);
  assert.equal(recentRender[1][0].documentId, "document-b");
  assert.equal(recentRender[1][0].favorite, null);
  assert.equal(recentRender[1][0].description, "Descrição completa.");
  assert.equal(recentRender[1][0].classification, "internal");
});

test("não renderiza versões tardias de A depois que B assume o detalhe", async () => {
  const versionsA = deferred();
  let currentDocumentId = null;
  const context = fixture({
    detail: {
      async load(documentId) {
        currentDocumentId = documentId;
        return {
          document: {
            documentId,
            title: documentId,
            updatedAt: `2026-07-24T${documentId === "document-a" ? "10" : "11"}:00:00.000Z`,
          },
          permissions: ["read"],
        };
      },
      loadVersions() {
        if (currentDocumentId === "document-a") return versionsA.promise;
        return Promise.resolve([
          { versionId: "version-b", publicationStatus: "current" },
        ]);
      },
    },
  });
  await context.workspace.start();

  const openA = context.workspace.openDocument("document-a");
  await Promise.resolve();
  await context.workspace.openDocument("document-b");
  versionsA.resolve([{ versionId: "version-a", publicationStatus: "current" }]);
  await openA;

  const rendered = context.calls
    .filter(([name]) => name === "view.versions")
    .map(([, versions]) => versions.map(({ versionId }) => versionId));
  assert.deepEqual(rendered.slice(0, 2), [[], []]);
  assert.deepEqual(
    rendered.filter((versionIds) => versionIds.length > 0),
    [["version-b"]],
  );
});

test("rejeita histórico explicitamente identificado como pertencente a outro documento", async () => {
  const context = fixture({
    detail: {
      async loadVersions() {
        return [
          {
            documentId: "document-b",
            versionId: "version-b",
            publicationStatus: "current",
          },
        ];
      },
    },
  });
  await context.workspace.start();
  context.calls.length = 0;

  await context.workspace.openDocument("document-a");

  assert.equal(
    context.calls.some(
      ([name, versions]) =>
        name === "view.versions" &&
        versions.some?.((version) => version.documentId === "document-b"),
    ),
    false,
  );
  assert.equal(
    context.calls.some(([name]) => name === "view.versions.error"),
    true,
  );
});

test("nova seleção limpa detalhe e versões antes do carregamento e mantém erro neutro", async () => {
  const pendingDocument = deferred();
  let context;
  context = fixture({
    detail: {
      async load(documentId) {
        if (documentId === "document-b") return pendingDocument.promise;
        const loaded = {
          document: {
            documentId,
            title: "Documento A",
            description: "Conteúdo anterior.",
            classification: "internal",
            lifecycleStatus: "active",
            indexingPolicy: "metadata_only",
            updatedAt: "2026-07-24T11:00:00.000Z",
          },
          permissions: ["read", "update_metadata"],
        };
        context.getDetailOptions().onState({
          status: "ready",
          documentId,
          detail: loaded,
          actions: { open: true, edit: true },
        });
        return loaded;
      },
    },
  });
  await context.workspace.start();
  await context.workspace.openDocument("document-a");
  context.calls.length = 0;

  const opening = context.workspace.openDocument("document-b");
  await Promise.resolve();
  const loading = context.calls
    .filter(([name]) => name === "view.detail")
    .at(-1)?.[1];
  assert.equal(loading?.status, "loading");
  assert.equal(loading?.documentId, "document-b");
  assert.equal(loading?.detail, null);

  pendingDocument.reject(new Error("detalhe indisponível"));
  await assert.rejects(() => opening, /detalhe indisponível/i);
  const failed = context.calls
    .filter(([name]) => name === "view.detail")
    .at(-1)?.[1];
  assert.equal(failed?.status, "error");
  assert.equal(failed?.documentId, "document-b");
  assert.equal(failed?.detail, null);
});

test("flag de favoritos desligado impede navegação e mutação também no workspace", async () => {
  const context = fixture({ features: { favorites: false } });
  await context.workspace.start();
  await context.workspace.openDocument("document-a", { favorite: false });
  context.calls.length = 0;

  assert.equal(await context.workspace.navigate("favoritos"), null);
  assert.equal(await context.workspace.setFavorite(true, "document-a"), null);
  assert.equal(
    context.calls.some(
      ([name, value]) =>
        name === "detail.favorite" ||
        (name === "catalog.list" && value?.favorite === true),
    ),
    false,
  );
});

test("não aplica ação encadeada de um cartão quando outro documento já está ativo", async () => {
  const context = fixture();
  await context.workspace.start();
  await context.workspace.openDocument("document-b");
  context.calls.length = 0;

  const result = await context.workspace.setFavorite(true, "document-a");

  assert.equal(result, null);
  assert.equal(
    context.calls.some(([name]) => name === "detail.favorite"),
    false,
  );
});

test("falha do histórico não invalida o detalhe nem impede ação contextual posterior", async () => {
  const context = fixture({
    detail: {
      async loadVersions() {
        context.calls.push(["detail.versions"]);
        throw new Error("histórico indisponível");
      },
    },
  });
  await context.workspace.start();

  const loaded = await context.workspace.openDocument("document-a");
  assert.equal(loaded.document.documentId, "document-a");
  assert.ok(context.calls.some(([name]) => name === "view.versions.error"));

  await context.workspace.setFavorite(true, "document-a");
  assert.ok(context.calls.some(([name]) => name === "detail.favorite"));
});

test("Recentes e Coleções cancelam catálogo pendente antes de renderizar a vista local", async () => {
  const context = fixture();
  await context.workspace.start();
  context.calls.length = 0;

  await context.workspace.navigate("recentes");
  assert.deepEqual(context.calls.slice(0, 3), [
    ["catalog.cancel"],
    ["view.filters", {}],
    ["view.recent", []],
  ]);

  context.calls.length = 0;
  await context.workspace.navigate("colecoes");
  assert.deepEqual(context.calls.slice(0, 3), [
    ["catalog.cancel"],
    ["view.filters", {}],
    ["view.collections", [{ collectionId: "collection-a", name: "Coleção A" }]],
  ]);

  context.calls.length = 0;
  await context.getHandlers().loadNext();
  assert.equal(
    context.calls.some(([name]) => name === "catalog.next"),
    false,
  );
});

test("pagehide e destruição limpam estado sensível sem request automático com sessão antiga", async () => {
  const context = fixture();
  await context.workspace.start();
  const lifecycle = context.getLifecycleOptions();
  context.calls.length = 0;

  lifecycle.cancelActive();
  lifecycle.clearSensitiveState("pagehide");

  assert.deepEqual(context.calls.slice(0, 4), [
    ["catalog.cancel"],
    ["detail.cancel"],
    ["recent.clear"],
    ["view.clear", "pagehide"],
  ]);
  assert.equal(
    context.calls.some(([name]) => name === "catalog.metadata"),
    false,
  );

  context.calls.length = 0;
  context.workspace.destroy("session_lost");
  assert.deepEqual(context.calls.slice(0, 4), [
    ["catalog.cancel"],
    ["detail.cancel"],
    ["recent.clear"],
    ["view.clear", "session_lost"],
  ]);
  assert.ok(context.calls.some(([name]) => name === "catalog.destroy"));
  assert.ok(context.calls.some(([name]) => name === "detail.destroy"));
});

test("pagehide invalida callbacks tardios de catálogo e detalhe", async () => {
  const context = fixture();
  await context.workspace.start();
  const lifecycle = context.getLifecycleOptions();
  lifecycle.cancelActive();
  lifecycle.clearSensitiveState("pagehide");
  const clearIndex = context.calls.findLastIndex(
    ([name]) => name === "view.clear",
  );

  context.emitCatalog({
    status: "ready",
    mode: "catalog",
    items: [
      {
        documentId: "document-antigo",
        title: "Documento Antigo",
        description: "",
        classification: "internal",
        lifecycleStatus: "active",
        updatedAt: "2026-07-24T10:00:00.000Z",
        favorite: false,
      },
    ],
    nextCursor: null,
  });
  context.getDetailOptions().onState({
    status: "ready",
    documentId: "document-antigo",
    detail: {
      document: {
        documentId: "document-antigo",
        title: "Documento Antigo",
      },
      permissions: ["read"],
    },
    actions: { open: true },
  });

  assert.equal(
    context.calls
      .slice(clearIndex + 1)
      .some(([name]) => name === "view.catalog" || name === "view.detail"),
    false,
  );
});

test("callback tardio de mutação não substitui a seleção atual", async () => {
  const context = fixture();
  await context.workspace.start();
  await context.workspace.openDocument("document-b");
  context.calls.length = 0;

  context.getDetailOptions().onState({
    status: "ready",
    documentId: "document-a",
    detail: {
      document: {
        documentId: "document-a",
        title: "Documento A Tardio",
        updatedAt: "2026-07-24T13:00:00.000Z",
      },
      permissions: ["read", "update_metadata"],
    },
    actions: { open: true, edit: true },
  });

  assert.equal(
    context.calls.some(([name]) => name === "view.detail"),
    false,
  );
  assert.equal(
    context.calls.some(
      ([name, documentId]) =>
        name === "recent.record" && documentId === "document-a",
    ),
    false,
  );
});

test("pagehide ignora qualquer estado tardio do upload anterior", async () => {
  const context = fixture({
    features: { favorites: true, upload: true },
  });
  await context.workspace.start();
  context.getHandlers().openUpload();
  const lifecycle = context.getLifecycleOptions();
  lifecycle.cancelActive();
  lifecycle.clearSensitiveState("pagehide");
  const clearIndex = context.calls.findLastIndex(
    ([name]) => name === "view.clear",
  );

  context.getUploadOptions().onState({
    status: "processing",
    documentId: "document-antigo",
  });

  assert.equal(
    context.calls
      .slice(clearIndex + 1)
      .some(([name]) => name === "view.upload"),
    false,
  );
});

test("viewer usa a versão vigente pronta, atualiza fragmento e preserva o catálogo desktop", async () => {
  const listeners = new Map();
  const locationRef = {
    hash: "",
    pathname: "/documentos/",
    search: "?portal=unimed",
  };
  const historyCalls = [];
  const historyRef = {
    state: { hub: true },
    pushState(state, _title, url) {
      historyCalls.push(["push", state, url]);
      locationRef.hash = url.includes("#") ? url.slice(url.indexOf("#")) : "";
    },
    replaceState(state, _title, url) {
      historyCalls.push(["replace", state, url]);
      locationRef.hash = url.includes("#") ? url.slice(url.indexOf("#")) : "";
    },
    back() {
      historyCalls.push(["back"]);
      locationRef.hash = "";
    },
  };
  const context = fixture({
    features: { favorites: true, viewer: true },
    locationRef,
    historyRef,
    routeEventTarget: {
      addEventListener(type, handler) {
        listeners.set(type, handler);
      },
      removeEventListener(type, handler) {
        if (listeners.get(type) === handler) listeners.delete(type);
      },
    },
    detail: {
      async load(documentId) {
        const loaded = {
          document: {
            documentId,
            currentVersionId: "version-current",
            title: "Documento A",
            description: "Descrição.",
            classification: "internal",
            lifecycleStatus: "active",
            indexingPolicy: "metadata_only",
            updatedAt: "2026-07-24T11:00:00.000Z",
          },
          permissions: ["read"],
        };
        return loaded;
      },
      async loadVersions() {
        return [
          {
            versionId: "version-current",
            versionNumber: 2,
            originalName: "documento-a.pdf",
            uploadStatus: "uploaded",
            securityStatus: "clean",
            mimeDetected: "application/pdf",
            sizeBytes: 120,
            publicationStatus: "current",
          },
        ];
      },
    },
  });

  await context.workspace.start();
  const handlers = context.getHandlers();
  await handlers.openViewer("document-a");

  const opening = context.calls.find(([name]) => name === "viewer.open");
  assert.deepEqual(opening, [
    "viewer.open",
    {
      documentId: "document-a",
      versionId: "version-current",
      title: "Documento A",
      fileName: "documento-a.pdf",
      page: 1,
    },
  ]);
  assert.deepEqual(historyCalls[0], [
    "push",
    historyRef.state,
    "/documentos/?portal=unimed#document=document-a&page=1",
  ]);
  assert.equal(
    context.calls.some(([name]) => name === "catalog.destroy"),
    false,
  );

  await handlers.viewerGoToPage(2);
  assert.deepEqual(historyCalls.at(-1), [
    "replace",
    historyRef.state,
    "/documentos/?portal=unimed#document=document-a&page=2",
  ]);
  await handlers.closeViewer();
  assert.deepEqual(historyCalls.at(-1), ["back"]);
  assert.equal(
    context.calls.some(([name]) => name === "viewer.close"),
    true,
  );
});

test("viewer aguarda exatamente o histórico da seleção ativa antes de escolher a versão", async () => {
  const pendingVersions = deferred();
  let versionsLoads = 0;
  const context = fixture({
    features: { favorites: true, viewer: true },
    locationRef: {
      hash: "",
      pathname: "/documentos/",
      search: "?portal=unimed",
    },
    historyRef: {
      state: null,
      pushState() {},
      replaceState() {},
      back() {},
    },
    routeEventTarget: {
      addEventListener() {},
      removeEventListener() {},
    },
    detail: {
      async load(documentId) {
        return {
          document: {
            documentId,
            currentVersionId: "version-current",
            title: "Documento em Carregamento",
            description: "",
            classification: "internal",
            lifecycleStatus: "active",
            indexingPolicy: "metadata_only",
            updatedAt: "2026-07-25T20:00:00.000Z",
          },
          permissions: ["read"],
        };
      },
      loadVersions() {
        versionsLoads += 1;
        return pendingVersions.promise;
      },
    },
  });
  await context.workspace.start();
  const detailOpening = context.workspace.openDocument("document-a");
  await Promise.resolve();
  await Promise.resolve();

  const viewerOpening = context.getHandlers().openViewer("document-a");
  await Promise.resolve();
  assert.equal(
    context.calls.some(([name]) => name === "viewer.open"),
    false,
  );

  pendingVersions.resolve([
    {
      versionId: "version-current",
      versionNumber: 1,
      originalName: "documento.pdf",
      uploadStatus: "uploaded",
      securityStatus: "clean",
      mimeDetected: "application/pdf",
      sizeBytes: 100,
      publicationStatus: "current",
    },
  ]);
  await Promise.all([detailOpening, viewerOpening]);

  assert.equal(versionsLoads, 1);
  assert.equal(
    context.calls.filter(([name]) => name === "viewer.open").length,
    1,
  );
});

test("fragmento do viewer só é restaurado depois de catálogo, detalhe e sessão do workspace", async () => {
  const locationRef = {
    hash: "#document=document-a&page=3",
    pathname: "/documentos/",
    search: "?portal=unimed",
  };
  const context = fixture({
    features: { favorites: true, viewer: true },
    locationRef,
    historyRef: {
      state: null,
      pushState() {},
      replaceState() {},
      back() {},
    },
    routeEventTarget: {
      addEventListener() {},
      removeEventListener() {},
    },
    detail: {
      async load(documentId) {
        return {
          document: {
            documentId,
            currentVersionId: "version-current",
            title: "Documento Restaurado",
            description: "",
            classification: "internal",
            lifecycleStatus: "active",
            indexingPolicy: "metadata_only",
            updatedAt: "2026-07-24T11:00:00.000Z",
          },
          permissions: ["read"],
        };
      },
      async loadVersions() {
        return [
          {
            versionId: "version-current",
            versionNumber: 1,
            originalName: "restaurado.pdf",
            uploadStatus: "uploaded",
            securityStatus: "clean",
            mimeDetected: "application/pdf",
            sizeBytes: 100,
            publicationStatus: "current",
          },
        ];
      },
    },
  });

  await context.workspace.start();
  const metadataIndex = context.calls.findIndex(
    ([name]) => name === "catalog.metadata",
  );
  const listIndex = context.calls.findIndex(
    ([name]) => name === "catalog.list",
  );
  const viewerIndex = context.calls.findIndex(
    ([name]) => name === "viewer.open",
  );
  assert.ok(metadataIndex >= 0);
  assert.ok(listIndex > metadataIndex);
  assert.ok(viewerIndex > listIndex);
  assert.equal(context.calls[viewerIndex][1].page, 3);

  context.workspace.destroy("pagehide");
  assert.equal(locationRef.hash, "#document=document-a&page=3");
  assert.equal(
    context.calls.some(([name]) => name === "viewer.destroy"),
    true,
  );
});
