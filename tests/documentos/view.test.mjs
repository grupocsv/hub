import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildCatalogViewModel,
  buildDetailViewModel,
  resolveCatalogFocusIntent,
  shouldRestoreCatalogFocus,
} from "../../docs/public/documentos/assets/view.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HUB_ROOT = path.resolve(HERE, "../..");

function catalogItem(overrides = {}) {
  return {
    documentId: "document-a",
    title: "Protocolo Assistencial",
    description: "Versão institucional vigente.",
    classification: "internal",
    lifecycleStatus: "active",
    updatedAt: "2026-07-24T11:00:00.000Z",
    favorite: false,
    ...overrides,
  };
}

test("constrói modelo de catálogo verificável para pronto, vazio, erro e paginação", () => {
  const ready = buildCatalogViewModel({
    status: "ready",
    mode: "catalog",
    items: [catalogItem()],
    nextCursor: "cursor-a",
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.items[0].classificationLabel, "Interno");
  assert.equal(ready.items[0].lifecycleLabel, "Ativo");
  assert.equal(ready.hasNextPage, true);

  assert.equal(
    buildCatalogViewModel({ status: "empty", items: [], nextCursor: null })
      .status,
    "empty",
  );
  assert.equal(
    buildCatalogViewModel({ status: "error", items: [], nextCursor: null })
      .status,
    "error",
  );
  assert.throws(
    () =>
      buildCatalogViewModel({ status: "ready", items: [{}], nextCursor: null }),
    /catálogo/i,
  );
});

test("Recentes aceita snapshot completo com favorito ainda desconhecido", () => {
  const recent = buildCatalogViewModel({
    status: "ready",
    mode: "recent",
    items: [catalogItem({ favorite: null })],
    nextCursor: null,
  });

  assert.equal(recent.items[0].favorite, null);
  assert.equal(recent.items[0].isSearchResult, false);
});

test("constrói modelo de detalhe somente com ações autorizadas e versões públicas", () => {
  const model = buildDetailViewModel(
    {
      status: "ready",
      favorite: true,
      detail: {
        document: catalogItem({
          indexingPolicy: "metadata_only",
          currentVersionId: "version-a",
        }),
        permissions: ["read", "update_metadata", "archive", "publish"],
      },
      actions: {
        open: true,
        favorite: true,
        edit: true,
        archive: true,
        restore: false,
        requestDeletion: false,
        promoteVersion: true,
      },
    },
    [
      {
        versionId: "version-a",
        versionNumber: 1,
        publicationStatus: "eligible",
      },
    ],
    { viewer: true, openViewer: true, favorites: true },
  );

  assert.equal(model.favorite, true);
  assert.deepEqual(
    model.actions.map(({ id }) => id),
    ["open", "favorite", "edit", "archive"],
  );
  assert.equal(model.versions[0].canPromote, true);
  assert.equal(
    model.actions.some(({ id }) => id === "requestDeletion"),
    false,
  );
});

test("favoritos permanecem ocultos quando o flag está desligado", () => {
  const state = {
    status: "ready",
    favorite: true,
    detail: {
      document: catalogItem({ indexingPolicy: "metadata_only" }),
      permissions: ["read"],
    },
    actions: {
      open: true,
      favorite: true,
    },
  };

  const disabled = buildDetailViewModel(state, [], {
    viewer: false,
    openViewer: false,
    favorites: false,
  });
  const enabled = buildDetailViewModel(state, [], {
    viewer: false,
    openViewer: false,
    favorites: true,
  });

  assert.equal(
    disabled.actions.some(({ id }) => id === "favorite"),
    false,
  );
  assert.equal(
    enabled.actions.some(({ id }) => id === "favorite"),
    true,
  );
});

test("upload de versão aparece somente com permissão, flag e handler", () => {
  const state = {
    status: "ready",
    favorite: false,
    detail: {
      document: catalogItem({ indexingPolicy: "metadata_only" }),
      permissions: ["read", "create_version"],
    },
    actions: {
      open: true,
      favorite: true,
      uploadVersion: true,
    },
  };

  assert.equal(
    buildDetailViewModel(state, [], {
      upload: true,
      openUpload: true,
    }).actions.some(({ id }) => id === "uploadVersion"),
    true,
  );
  assert.equal(
    buildDetailViewModel(state, [], {
      upload: false,
      openUpload: true,
    }).actions.some(({ id }) => id === "uploadVersion"),
    false,
  );
  assert.equal(
    buildDetailViewModel(
      { ...state, actions: { ...state.actions, uploadVersion: false } },
      [],
      { upload: true, openUpload: true },
    ).actions.some(({ id }) => id === "uploadVersion"),
    false,
  );
});

test("resultado de busca não infere estado de favorito desconhecido", () => {
  const model = buildDetailViewModel(
    {
      status: "ready",
      favorite: null,
      detail: {
        document: catalogItem({ indexingPolicy: "metadata_only" }),
        permissions: ["read"],
      },
      actions: {
        open: true,
        favorite: true,
      },
    },
    [],
    { favorites: true },
  );

  assert.equal(model.favorite, null);
  assert.equal(
    model.actions.some(({ id }) => id === "favorite"),
    false,
  );
});

test("viewer permanece oculto sem flag e handler e conflitos têm mensagem pública", () => {
  const state = {
    status: "conflict",
    favorite: false,
    error: new Error(
      "O conteúdo foi alterado. Atualize os dados e tente novamente.",
    ),
    detail: {
      document: catalogItem({ indexingPolicy: "metadata_only" }),
      permissions: ["read"],
    },
    actions: {
      open: true,
      favorite: true,
    },
    pending: {
      type: "metadata",
      values: { title: "Rascunho preservado" },
    },
  };

  assert.equal(
    buildDetailViewModel(state, [], {
      viewer: false,
      openViewer: true,
    }).actions.some(({ id }) => id === "open"),
    false,
  );
  assert.equal(
    buildDetailViewModel(state, [], {
      viewer: true,
      openViewer: false,
    }).actions.some(({ id }) => id === "open"),
    false,
  );
  const enabled = buildDetailViewModel(state, [], {
    viewer: true,
    openViewer: true,
  });
  assert.equal(
    enabled.actions.some(({ id }) => id === "open"),
    true,
  );
  assert.equal(enabled.message, state.error.message);
  assert.deepEqual(enabled.pending, state.pending);
  assert.equal(enabled.busy, false);
  assert.equal(enabled.actionsDisabled, true);
  assert.equal(enabled.canReload, true);
});

test("restaura foco do catálogo somente quando a ação assíncrona ainda detém a intenção", () => {
  const body = {};
  const origin = { isConnected: true };
  const otherControl = {};

  assert.equal(shouldRestoreCatalogFocus(origin, origin, body), true);
  assert.equal(
    shouldRestoreCatalogFocus({ isConnected: false }, body, body),
    true,
  );
  assert.equal(shouldRestoreCatalogFocus(origin, otherControl, body), false);

  let intent = resolveCatalogFocusIntent(undefined, origin, otherControl, body);
  assert.equal(intent, false);
  origin.isConnected = false;
  intent = resolveCatalogFocusIntent(intent, origin, body, body);
  assert.equal(intent, false);

  const retainedOrigin = { isConnected: true };
  intent = resolveCatalogFocusIntent(
    undefined,
    retainedOrigin,
    retainedOrigin,
    body,
  );
  retainedOrigin.isConnected = false;
  intent = resolveCatalogFocusIntent(intent, retainedOrigin, body, body);
  assert.equal(intent, true);
});

test("camada DOM não usa HTML arbitrário e shell contém filtros e painel semântico", async () => {
  const [source, template] = await Promise.all([
    readFile(
      path.join(HUB_ROOT, "docs/public/documentos/assets/view.js"),
      "utf8",
    ),
    readFile(
      path.join(HUB_ROOT, "scripts/documentos-shell.template.html"),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /createElement\(/);
  assert.match(source, /textContent\s*=/);
  assert.match(template, /id="docs-filters"/);
  assert.match(template, /id="docs-collection-filter"/);
  assert.match(template, /id="docs-tag-filter"/);
  assert.match(template, /id="docs-classification-filter"/);
  assert.match(template, /id="docs-detail"[^>]*role="dialog"/);
  assert.match(template, /aria-modal="true"/);
  assert.match(template, /id="docs-detail-title"/);
  assert.match(template, /id="docs-load-more"/);
  assert.match(
    template,
    /id="docs-upload"[^>]*hidden[^>]*disabled|id="docs-upload"[^>]*disabled[^>]*hidden/,
  );
  assert.match(
    template,
    /id="docs-upload-dialog"[^>]*role="dialog"[^>]*aria-modal="true"/,
  );
  assert.match(template, /id="docs-upload-form"/);
  assert.match(template, /id="docs-upload-file"[^>]*type="file"/);
  assert.match(template, /id="docs-upload-status"[^>]*aria-live="polite"/);
  assert.match(template, /data-action="cancel-upload"/);
  assert.match(template, /accept="\.pdf,\.png,\.jpg,\.jpeg,\.webp,\.txt,\.md"/);
  assert.match(
    template,
    /class="docs-dialog__backdrop"[^>]*aria-hidden="true"/,
  );
  assert.doesNotMatch(template, /class="docs-dialog__backdrop"[^>]*<button/i);
  assert.match(
    source,
    /clearSensitiveState\(\)[\s\S]*searchInput\.value\s*=\s*(['"])\1/,
  );
  assert.match(source, /backgroundElements[\s\S]*\.inert\s*=/);
  assert.match(
    source,
    /event\.key\s*===\s*['"]Escape['"][\s\S]{0,300}handlers\.closeDocument/,
  );
  assert.match(source, /previousFocus[\s\S]{0,300}isConnected/);
  assert.match(source, /fallbackFocus/);
  assert.match(source, /data-action[^]*reload-detail|['"]reload-detail['"]/);
  assert.match(source, /aria-busy/);
  assert.match(source, /features\.favorites\s*===\s*true/);
  assert.match(source, /data-view="favoritos"/);
  assert.match(source, /favoritesEnabled\s*&&\s*Boolean\(boundHandlers\)/);
  assert.match(source, /selectNavigation\(['"]documentos['"]\)/);
  assert.match(
    source,
    /reset['"][^]*selectNavigation\(['"]documentos['"]\)[^]*applyFilters\(\{\}\)/,
  );
  assert.match(
    source,
    /open-collection['"][^]*selectNavigation\(['"]documentos['"]\)[^]*applyFilters/,
  );
  assert.match(source, /input:not\(:disabled\)/);
  assert.match(source, /disabled:\s*model\?\.actionsDisabled\s*===\s*true/);
  assert.match(source, /handlers\.toggleCardFavorite\?\./);
  assert.match(source, /handlers\.startUpload\?\./);
  assert.match(source, /handlers\.cancelUpload\?\./);
  assert.match(source, /handlers\.retryUpload\?\./);
  assert.match(source, /ariaLabel:\s*`Ver detalhes de \$\{item\.title\}`/);
  assert.match(source, /ariaLabel:\s*`Promover versão \$\{/);
  assert.match(
    source,
    /ariaLabel:\s*`Ver documentos da coleção \$\{item\.name\}`/,
  );
  assert.match(
    source,
    /function renderCollections[^]*loadMore\.hidden\s*=\s*true[^]*loadMore\.disabled\s*=\s*true[^]*items\.length\s*===\s*0/,
  );
  assert.match(source, /function setFilters\(/);
});

test("viewer alterna semântica responsiva e invalida renderização PDF tardia", async () => {
  const source = await readFile(
    path.join(HUB_ROOT, "docs/public/documentos/assets/view.js"),
    "utf8",
  );

  assert.match(source, /matchMedia\?\.\(['"]\(max-width:\s*48rem\)['"]\)/);
  assert.match(
    source,
    /setAttribute\(['"]role['"],\s*mobile\s*\?\s*['"]dialog['"]\s*:\s*['"]region['"]\)/,
  );
  assert.match(source, /setAttribute\(['"]aria-modal['"],\s*['"]true['"]\)/);
  assert.match(source, /removeAttribute\(['"]aria-modal['"]\)/);
  assert.match(
    source,
    /documentElement\?\.classList\?\.add\(['"]is-viewer-modal-open['"]\)/,
  );
  assert.match(
    source,
    /documentElement\?\.classList\?\.remove\(['"]is-viewer-modal-open['"]\)/,
  );
  assert.match(
    source,
    /event\.key\s*!==\s*['"]Tab['"]\s*\|\|\s*!viewerIsMobile\(\)/,
  );
  assert.match(source, /handlers\.closeViewer\?\./);
  assert.match(source, /function focusViewerEntry\(/);
  assert.match(
    source,
    /querySelector\(\s*['"]button\[data-action="close-viewer"\]['"]\s*,?\s*\)/,
  );
  assert.match(
    source,
    /viewerRoot\?\.contains\?\.\(documentRef\.activeElement\)/,
  );
  assert.match(source, /requestAnimationFrame\?\.\(verifyFocus\)/);
  assert.match(source, /getTextContent\?\.\(\)/);
  assert.match(
    source,
    /signal\?\.aborted[\s\S]{0,120}renderGeneration\s*!==\s*pdfRenderGeneration/,
  );
  assert.match(source, /pdfRenderGeneration\s*\+=\s*1/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
});
