const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const PATCH_KEYS = new Set([
  'collectionId',
  'title',
  'description',
  'classification',
  'indexingPolicy',
]);

function identifier(value, name) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 256 ||
    value !== value.trim() ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
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
  return Object.freeze({
    ...value,
    documentId: identifier(value.documentId, 'Documento'),
  });
}

export function normalizeDocumentDetail(
  payload,
  headers,
  fallbackPermissions = [],
  expectedDocumentId = null,
) {
  if (!plainObject(payload) || !plainObject(payload.document)) {
    throw new TypeError('Resposta de detalhe inválida.');
  }
  const document = normalizeDocument(payload.document);
  if (expectedDocumentId !== null && document.documentId !== expectedDocumentId) {
    throw new TypeError('Resposta de detalhe inválida.');
  }
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
    uploadVersion: granted.has('create_version'),
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

function normalizeVersions(payload, expectedDocumentId) {
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
      if (
        Object.hasOwn(item, 'documentId') &&
        item.documentId !== expectedDocumentId
      ) {
        throw new TypeError('Resposta de versões inválida.');
      }
      return Object.freeze({ ...item, documentId: expectedDocumentId });
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
  let favorite = null;
  let destroyed = false;
  let generation = 0;
  let activeDetailRequest = null;
  let activeVersionRequest = null;
  let activeMutation = null;
  const pendingFavoriteDocuments = new Set();

  function documentTarget(documentId, suffix = '') {
    return `/v1/documents/${encodeURIComponent(identifier(documentId, 'Documento'))}${suffix}`;
  }

  function contextForCurrent() {
    if (!current) throw new TypeError('Detalhe documental não carregado.');
    return Object.freeze({
      documentId: current.document.documentId,
      generation,
      detail: current,
    });
  }

  function contextIsActive(context) {
    return (
      !destroyed &&
      current?.document?.documentId === context.documentId &&
      generation === context.generation
    );
  }

  function generationIsActive(expectedGeneration) {
    return !destroyed && generation === expectedGeneration;
  }

  function abortOperation(operation) {
    operation?.controller?.abort();
  }

  function invalidateOperations() {
    abortOperation(activeDetailRequest);
    abortOperation(activeVersionRequest);
    abortOperation(activeMutation);
    activeDetailRequest = null;
    activeVersionRequest = null;
    activeMutation = null;
  }

  function emit(status, extra = {}) {
    const stateDocumentId =
      typeof extra.documentId === 'string'
        ? extra.documentId
        : current?.document?.documentId ?? null;
    onState(
      Object.freeze({
        status,
        documentId: stateDocumentId,
        generation,
        detail: current,
        favorite,
        actions: current
          ? deriveAllowedDetailActions(current.permissions)
          : deriveAllowedDetailActions([]),
        ...extra,
      }),
    );
  }

  async function runMutation(action, requestFactory, applyResponse, pending = null) {
    const context = contextForCurrent();
    assertAction(context.detail, action);
    if (activeMutation) {
      throw new TypeError('Já existe uma operação em andamento.');
    }

    const operation = {
      context,
      controller: new AbortController(),
    };
    activeMutation = operation;
    emit('saving', pending ? { pending } : {});
    try {
      const request = requestFactory(context);
      const response = await client.request(request.target, {
        ...request.options,
        signal: operation.controller.signal,
      });
      if (!contextIsActive(context)) return null;

      const applied = applyResponse
        ? applyResponse(response, context)
        : { value: current, extra: {} };
      if (!contextIsActive(context)) return null;
      emit('ready', applied.extra ?? {});
      return applied.value;
    } catch (error) {
      if (!contextIsActive(context) || error?.code === 'request_aborted') return null;
      const extra = pending ? { error, pending } : { error };
      if (error?.code === 'conflict') emit('conflict', extra);
      else emit('error', extra);
      throw error;
    } finally {
      if (activeMutation === operation) activeMutation = null;
    }
  }

  async function load(documentId, loadOptions = {}) {
    if (destroyed) throw new TypeError('Detalhe documental encerrado.');
    const normalizedId = identifier(documentId, 'Documento');
    generation += 1;
    const requestGeneration = generation;
    invalidateOperations();
    current = null;
    favorite = null;
    const controller = new AbortController();
    const operation = { controller, generation: requestGeneration, documentId: normalizedId };
    activeDetailRequest = operation;
    emit('loading', { documentId: normalizedId });
    try {
      const response = await client.request(
        documentTarget(normalizedId),
        { signal: controller.signal },
      );
      if (controller.signal.aborted || !generationIsActive(requestGeneration)) return null;
      current = normalizeDocumentDetail(response.data, response.headers, [], normalizedId);
      favorite =
        typeof loadOptions.favorite === 'boolean' ? loadOptions.favorite : null;
      emit('ready');
      return current;
    } catch (error) {
      if (
        controller.signal.aborted ||
        !generationIsActive(requestGeneration) ||
        error?.code === 'request_aborted'
      ) {
        return null;
      }
      emit('error', { error, documentId: normalizedId });
      throw error;
    } finally {
      if (activeDetailRequest === operation) activeDetailRequest = null;
    }
  }

  async function refresh() {
    const context = contextForCurrent();
    assertAction(context.detail, 'open');
    abortOperation(activeDetailRequest);
    const operation = {
      context,
      controller: new AbortController(),
    };
    activeDetailRequest = operation;
    emit('loading');
    try {
      const response = await client.request(documentTarget(context.documentId), {
        signal: operation.controller.signal,
      });
      if (!contextIsActive(context)) return null;
      current = normalizeDocumentDetail(
        response.data,
        response.headers,
        context.detail.permissions,
        context.documentId,
      );
      emit('ready');
      return current;
    } catch (error) {
      if (
        !contextIsActive(context) ||
        operation.controller.signal.aborted ||
        error?.code === 'request_aborted'
      ) {
        return null;
      }
      emit('error', { error });
      throw error;
    } finally {
      if (activeDetailRequest === operation) activeDetailRequest = null;
    }
  }

  async function updateMetadata(patch) {
    const body = normalizePatch(patch);
    return runMutation(
      'edit',
      (context) => ({
        target: documentTarget(context.documentId),
        options: {
          method: 'PATCH',
          headers: { 'If-Match': context.detail.etag },
          body,
        },
      }),
      (response, context) => {
        current = normalizeDocumentDetail(
          response.data,
          response.headers,
          context.detail.permissions,
          context.documentId,
        );
        return { value: current };
      },
      Object.freeze({ type: 'metadata', values: body }),
    );
  }

  async function setFavorite(value) {
    if (typeof value !== 'boolean') throw new TypeError('Favorito inválido.');
    const context = contextForCurrent();
    assertAction(context.detail, 'favorite');
    if (pendingFavoriteDocuments.has(context.documentId)) {
      throw new TypeError('Já existe uma operação em andamento.');
    }
    pendingFavoriteDocuments.add(context.documentId);
    try {
      return await runMutation(
        'favorite',
        (activeContext) => ({
          target: documentTarget(activeContext.documentId, '/favorite'),
          options: {
            method: value ? 'POST' : 'DELETE',
            ...(value ? { body: {} } : {}),
          },
        }),
        () => {
          favorite = value;
          return { value: favorite };
        },
      );
    } finally {
      pendingFavoriteDocuments.delete(context.documentId);
    }
  }

  async function transition(action) {
    return runMutation(
      action,
      (context) => ({
        target: documentTarget(
          context.documentId,
          action === 'archive' ? '/archive' : '/restore',
        ),
        options: { method: 'POST', body: {} },
      }),
      (response, context) => {
        current = normalizeDocumentDetail(
          response.data,
          response.headers,
          context.detail.permissions,
          context.documentId,
        );
        return { value: current };
      },
    );
  }

  async function requestDeletion(reason) {
    const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
    if (normalizedReason.length === 0 || normalizedReason.length > 2000) {
      throw new TypeError('Motivo de exclusão inválido.');
    }
    const body = Object.freeze({
      request_id: identifier(createRequestId(), 'Solicitação'),
      reason: normalizedReason,
      requested_at: now(),
    });
    return runMutation(
      'requestDeletion',
      (context) => ({
        target: documentTarget(context.documentId, '/deletion-requests'),
        options: {
          method: 'POST',
          body,
        },
      }),
      (response) => {
        const deletionRequest = response.data?.request ?? null;
        return {
          value: deletionRequest,
          extra: { deletionRequest },
        };
      },
      Object.freeze({ type: 'deletion', values: { reason: normalizedReason } }),
    );
  }

  async function loadVersions() {
    const context = contextForCurrent();
    assertAction(context.detail, 'open');
    abortOperation(activeVersionRequest);
    const operation = {
      context,
      controller: new AbortController(),
    };
    activeVersionRequest = operation;
    try {
      const response = await client.request(documentTarget(context.documentId, '/versions'), {
        signal: operation.controller.signal,
      });
      if (!contextIsActive(context)) return null;
      return normalizeVersions(response.data, context.documentId);
    } catch (error) {
      if (
        !contextIsActive(context) ||
        operation.controller.signal.aborted ||
        error?.code === 'request_aborted'
      ) {
        return null;
      }
      throw error;
    } finally {
      if (activeVersionRequest === operation) activeVersionRequest = null;
    }
  }

  async function promoteVersion(versionId) {
    const normalizedId = identifier(versionId, 'Versão');
    return runMutation(
      'promoteVersion',
      (context) => ({
        target: documentTarget(
          context.documentId,
          `/versions/${encodeURIComponent(normalizedId)}/promote`,
        ),
        options: { method: 'POST', body: {} },
      }),
      (response, context) => {
        const version = response.data?.version;
        if (!plainObject(version) || typeof version.publicationStatus !== 'string') {
          throw new TypeError('Resposta de promoção inválida.');
        }
        if (
          Object.hasOwn(version, 'documentId') &&
          version.documentId !== context.documentId
        ) {
          throw new TypeError('Resposta de promoção inválida.');
        }
        const promotedVersion = Object.freeze({
          ...version,
          documentId: context.documentId,
        });
        return {
          value: promotedVersion,
          extra: { promotedVersion },
        };
      },
    );
  }

  return Object.freeze({
    load,
    refresh,
    updateMetadata,
    setFavorite,
    archive: () => transition('archive'),
    restore: () => transition('restore'),
    requestDeletion,
    loadVersions,
    promoteVersion,
    getDetail: () => current,
    getFavorite: () => favorite,
    getContext: () =>
      current
        ? Object.freeze({ documentId: current.document.documentId, generation })
        : null,
    cancel() {
      generation += 1;
      invalidateOperations();
      current = null;
      favorite = null;
    },
    destroy() {
      destroyed = true;
      generation += 1;
      invalidateOperations();
      current = null;
      favorite = null;
    },
  });
}
