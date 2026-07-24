const IDENTIFIER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{0,127})$/;
const PATCH_KEYS = new Set([
  'collectionId',
  'title',
  'description',
  'classification',
  'indexingPolicy',
]);

function identifier(value, name) {
  if (typeof value !== 'string' || !IDENTIFIER_PATTERN.test(value)) {
    throw new TypeError(`${name} inválido.`);
  }
  return value;
}

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizePermissions(value, fallback = []) {
  const source = value === undefined ? fallback : value;
  if (!Array.isArray(source) || source.some((item) => typeof item !== 'string')) {
    throw new TypeError('Permissões de detalhe inválidas.');
  }
  return Object.freeze([...new Set(source)]);
}

function normalizeDocument(value) {
  if (
    !plainObject(value) ||
    typeof value.documentId !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.classification !== 'string' ||
    typeof value.indexingPolicy !== 'string' ||
    typeof value.lifecycleStatus !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    throw new TypeError('Detalhe documental inválido.');
  }
  return Object.freeze({ ...value });
}

export function normalizeDocumentDetail(payload, headers, fallbackPermissions = []) {
  if (!plainObject(payload) || !plainObject(payload.document)) {
    throw new TypeError('Resposta de detalhe inválida.');
  }
  const document = normalizeDocument(payload.document);
  const headerEtag = headers?.get?.('etag');
  const etag = typeof headerEtag === 'string' && headerEtag.length > 0 ? headerEtag : document.etag;
  if (typeof etag !== 'string' || etag.length === 0) {
    throw new TypeError('ETag documental inválido.');
  }
  return Object.freeze({
    document,
    permissions: normalizePermissions(payload.permissions, fallbackPermissions),
    etag,
  });
}

export function deriveAllowedDetailActions(permissions) {
  const granted = new Set(normalizePermissions(permissions));
  return Object.freeze({
    open: granted.has('read'),
    favorite: granted.has('read'),
    edit: granted.has('update_metadata'),
    archive: granted.has('archive'),
    restore: granted.has('restore'),
    requestDeletion: granted.has('request_deletion'),
    promoteVersion: granted.has('publish'),
  });
}

function assertAction(detail, key) {
  if (!detail || deriveAllowedDetailActions(detail.permissions)[key] !== true) {
    throw new TypeError('Ação não permitida.');
  }
}

function normalizePatch(patch) {
  if (!plainObject(patch) || Object.keys(patch).length === 0) {
    throw new TypeError('Alteração de metadados inválida.');
  }
  for (const key of Object.keys(patch)) {
    if (!PATCH_KEYS.has(key)) throw new TypeError('Alteração de metadados inválida.');
  }
  const body = {};
  if (Object.hasOwn(patch, 'collectionId')) body.collection_id = patch.collectionId;
  if (Object.hasOwn(patch, 'title')) body.title = patch.title;
  if (Object.hasOwn(patch, 'description')) body.description = patch.description;
  if (Object.hasOwn(patch, 'classification')) body.classification = patch.classification;
  if (Object.hasOwn(patch, 'indexingPolicy')) body.indexing_policy = patch.indexingPolicy;
  return body;
}

function normalizeVersions(payload) {
  if (!plainObject(payload) || !Array.isArray(payload.items)) {
    throw new TypeError('Resposta de versões inválida.');
  }
  return Object.freeze(
    payload.items.map((item) => {
      if (
        !plainObject(item) ||
        typeof item.versionId !== 'string' ||
        typeof item.publicationStatus !== 'string'
      ) {
        throw new TypeError('Resposta de versões inválida.');
      }
      return Object.freeze({ ...item });
    }),
  );
}

export function createDocumentDetailController(options = {}) {
  const client = options.client;
  const onState = options.onState ?? (() => {});
  const now = options.now ?? (() => new Date().toISOString());
  const createRequestId = options.createRequestId ?? (() => crypto.randomUUID());
  if (
    !client ||
    typeof client.request !== 'function' ||
    typeof onState !== 'function' ||
    typeof now !== 'function' ||
    typeof createRequestId !== 'function'
  ) {
    throw new TypeError('Dependências obrigatórias do detalhe estão ausentes.');
  }

  let current = null;
  let favorite = false;
  let destroyed = false;
  let activeRequest = null;

  function documentTarget(suffix = '') {
    if (!current) throw new TypeError('Detalhe documental não carregado.');
    return `/v1/documents/${encodeURIComponent(current.document.documentId)}${suffix}`;
  }

  function emit(status, extra = {}) {
    onState(
      Object.freeze({
        status,
        detail: current,
        favorite,
        actions: current
          ? deriveAllowedDetailActions(current.permissions)
          : deriveAllowedDetailActions([]),
        ...extra,
      }),
    );
  }

  async function runMutation(action, request, normalizeResult) {
    assertAction(current, action);
    emit('saving');
    try {
      const response = await client.request(request.target, request.options);
      if (normalizeResult) current = normalizeResult(response);
      emit('ready');
      return current;
    } catch (error) {
      if (error?.code === 'conflict') emit('conflict', { error });
      else emit('error', { error });
      throw error;
    }
  }

  async function load(documentId, loadOptions = {}) {
    const normalizedId = identifier(documentId, 'Documento');
    activeRequest?.abort();
    const controller = new AbortController();
    activeRequest = controller;
    emit('loading');
    try {
      const response = await client.request(
        `/v1/documents/${encodeURIComponent(normalizedId)}`,
        { signal: controller.signal },
      );
      if (controller.signal.aborted || destroyed) return null;
      current = normalizeDocumentDetail(response.data, response.headers);
      favorite = loadOptions.favorite === true;
      emit('ready');
      return current;
    } catch (error) {
      if (controller.signal.aborted || error?.code === 'request_aborted') return null;
      emit('error', { error });
      throw error;
    } finally {
      if (activeRequest === controller) activeRequest = null;
    }
  }

  async function updateMetadata(patch) {
    const body = normalizePatch(patch);
    return runMutation(
      'edit',
      {
        target: documentTarget(),
        options: {
          method: 'PATCH',
          headers: { 'If-Match': current.etag },
          body,
        },
      },
      (response) => normalizeDocumentDetail(response.data, response.headers, current.permissions),
    );
  }

  async function setFavorite(value) {
    if (typeof value !== 'boolean') throw new TypeError('Favorito inválido.');
    assertAction(current, 'favorite');
    await client.request(documentTarget('/favorite'), {
      method: value ? 'POST' : 'DELETE',
      ...(value ? { body: {} } : {}),
    });
    favorite = value;
    emit('ready');
    return favorite;
  }

  async function transition(action) {
    return runMutation(
      action,
      {
        target: documentTarget(action === 'archive' ? '/archive' : '/restore'),
        options: { method: 'POST', body: {} },
      },
      (response) => normalizeDocumentDetail(response.data, response.headers, current.permissions),
    );
  }

  async function requestDeletion(reason) {
    assertAction(current, 'requestDeletion');
    const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
    if (normalizedReason.length === 0 || normalizedReason.length > 2000) {
      throw new TypeError('Motivo de exclusão inválido.');
    }
    const response = await client.request(documentTarget('/deletion-requests'), {
      method: 'POST',
      body: {
        request_id: identifier(createRequestId(), 'Solicitação'),
        reason: normalizedReason,
        requested_at: now(),
      },
    });
    emit('ready', { deletionRequest: response.data?.request ?? null });
    return response.data?.request ?? null;
  }

  async function loadVersions() {
    assertAction(current, 'open');
    const response = await client.request(documentTarget('/versions'));
    return normalizeVersions(response.data);
  }

  async function promoteVersion(versionId) {
    assertAction(current, 'promoteVersion');
    const normalizedId = identifier(versionId, 'Versão');
    const response = await client.request(
      documentTarget(`/versions/${encodeURIComponent(normalizedId)}/promote`),
      { method: 'POST', body: {} },
    );
    const version = response.data?.version;
    if (!plainObject(version) || typeof version.publicationStatus !== 'string') {
      throw new TypeError('Resposta de promoção inválida.');
    }
    emit('ready', { promotedVersion: Object.freeze({ ...version }) });
    return Object.freeze({ ...version });
  }

  return Object.freeze({
    load,
    updateMetadata,
    setFavorite,
    archive: () => transition('archive'),
    restore: () => transition('restore'),
    requestDeletion,
    loadVersions,
    promoteVersion,
    getDetail: () => current,
    getFavorite: () => favorite,
    cancel() {
      activeRequest?.abort();
      activeRequest = null;
    },
    destroy() {
      destroyed = true;
      activeRequest?.abort();
      activeRequest = null;
      current = null;
      favorite = false;
    },
  });
}
