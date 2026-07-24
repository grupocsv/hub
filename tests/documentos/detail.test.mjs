import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDocumentDetailController,
  deriveAllowedDetailActions,
  normalizeDocumentDetail,
} from '../../docs/public/documentos/assets/detail.js';

function metadata(overrides = {}) {
  return {
    tenantId: 'unimed',
    documentId: 'document-a',
    collectionId: null,
    title: 'Documento A',
    description: 'Descrição',
    classification: 'internal',
    indexingPolicy: 'metadata_only',
    lifecycleStatus: 'active',
    currentVersionId: 'version-a',
    owner: { type: 'human', id: 'manager-user' },
    metadataVersion: 1,
    etag: 'W/"metadata-1"',
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T11:00:00.000Z',
    ...overrides,
  };
}

function responseHeaders(etag = 'W/"metadata-1"') {
  return new Headers({ ETag: etag });
}

test('normaliza detalhe e deriva ações somente das permissões efetivas', () => {
  const detail = normalizeDocumentDetail(
    {
      document: metadata(),
      permissions: ['read', 'update_metadata', 'archive', 'publish'],
    },
    responseHeaders(),
  );

  assert.equal(detail.etag, 'W/"metadata-1"');
  assert.deepEqual(deriveAllowedDetailActions(detail.permissions), {
    open: true,
    favorite: true,
    edit: true,
    archive: true,
    restore: false,
    requestDeletion: false,
    promoteVersion: true,
  });
  assert.deepEqual(deriveAllowedDetailActions(['read']), {
    open: true,
    favorite: true,
    edit: false,
    archive: false,
    restore: false,
    requestDeletion: false,
    promoteVersion: false,
  });
});

test('bloqueia ação não autorizada antes de qualquer request', async () => {
  const calls = [];
  const client = {
    async request(target, options = {}) {
      calls.push({ target, options });
      return {
        data: { document: metadata(), permissions: ['read'] },
        headers: responseHeaders(),
      };
    },
  };
  const controller = createDocumentDetailController({ client });
  await controller.load('document-a');

  await assert.rejects(
    () => controller.updateMetadata({ title: 'Alteração indevida' }),
    /ação não permitida/i,
  );
  await assert.rejects(() => controller.archive(), /ação não permitida/i);
  assert.equal(calls.length, 1);
});

test('atualiza metadados com If-Match, substitui ETag e não faz retry em conflito', async () => {
  const calls = [];
  const states = [];
  let patchAttempt = 0;
  const client = {
    async request(target, options = {}) {
      calls.push({ target, options });
      if (options.method === 'PATCH') {
        patchAttempt += 1;
        if (patchAttempt === 2) throw Object.assign(new Error('conflito'), { code: 'conflict' });
        return {
          data: {
            document: metadata({ title: 'Título atualizado', metadataVersion: 2, etag: 'W/"metadata-2"' }),
            permissions: ['read', 'update_metadata'],
          },
          headers: responseHeaders('W/"metadata-2"'),
        };
      }
      return {
        data: {
          document: metadata(),
          permissions: ['read', 'update_metadata'],
        },
        headers: responseHeaders(),
      };
    },
  };
  const controller = createDocumentDetailController({
    client,
    onState: (state) => states.push(state),
  });
  await controller.load('document-a');
  const updated = await controller.updateMetadata({ title: 'Título atualizado' });

  assert.equal(calls[1].target, '/v1/documents/document-a');
  assert.equal(calls[1].options.method, 'PATCH');
  assert.equal(calls[1].options.headers['If-Match'], 'W/"metadata-1"');
  assert.deepEqual(calls[1].options.body, { title: 'Título atualizado' });
  assert.equal(updated.etag, 'W/"metadata-2"');

  await assert.rejects(
    () => controller.updateMetadata({ title: 'Concorrente' }),
    /conflito/i,
  );
  assert.equal(patchAttempt, 2);
  assert.equal(states.at(-1).status, 'conflict');
});

test('executa favorito e ciclo de vida nos métodos e paths públicos confirmados', async () => {
  const calls = [];
  const client = {
    async request(target, options = {}) {
      calls.push({ target, options });
      if (target.endsWith('/archive')) {
        return {
          data: {
            document: metadata({ lifecycleStatus: 'archived' }),
            permissions: ['read', 'restore', 'request_deletion'],
          },
          headers: responseHeaders(),
        };
      }
      if (target.endsWith('/restore')) {
        return {
          data: {
            document: metadata({ lifecycleStatus: 'active' }),
            permissions: ['read', 'archive', 'request_deletion'],
          },
          headers: responseHeaders(),
        };
      }
      if (target.endsWith('/deletion-requests')) {
        return { data: { request: { requestId: 'request-a', status: 'requested' } }, headers: new Headers() };
      }
      if (options.method === 'POST' || options.method === 'DELETE') {
        return { data: null, headers: new Headers() };
      }
      return {
        data: {
          document: metadata(),
          permissions: ['read', 'archive', 'restore', 'request_deletion'],
        },
        headers: responseHeaders(),
      };
    },
  };
  const controller = createDocumentDetailController({
    client,
    now: () => '2026-07-24T12:00:00.000Z',
    createRequestId: () => 'request-a',
  });
  await controller.load('document-a');
  await controller.setFavorite(true);
  await controller.setFavorite(false);
  await controller.archive();
  await controller.restore();
  await controller.requestDeletion('Retenção encerrada');

  assert.deepEqual(
    calls.slice(1).map(({ target, options }) => [target, options.method, options.body]),
    [
      ['/v1/documents/document-a/favorite', 'POST', {}],
      ['/v1/documents/document-a/favorite', 'DELETE', undefined],
      ['/v1/documents/document-a/archive', 'POST', {}],
      ['/v1/documents/document-a/restore', 'POST', {}],
      [
        '/v1/documents/document-a/deletion-requests',
        'POST',
        {
          request_id: 'request-a',
          reason: 'Retenção encerrada',
          requested_at: '2026-07-24T12:00:00.000Z',
        },
      ],
    ],
  );
});

test('lista e promove versão elegível apenas com permissão publish', async () => {
  const calls = [];
  const client = {
    async request(target, options = {}) {
      calls.push({ target, options });
      if (target.endsWith('/versions')) {
        return {
          data: { items: [{ versionId: 'version-a', publicationStatus: 'eligible' }] },
          headers: new Headers(),
        };
      }
      if (target.endsWith('/promote')) {
        return {
          data: { version: { versionId: 'version-a', publicationStatus: 'current' } },
          headers: new Headers(),
        };
      }
      return {
        data: {
          document: metadata(),
          permissions: ['read', 'publish'],
        },
        headers: responseHeaders(),
      };
    },
  };
  const controller = createDocumentDetailController({ client });
  await controller.load('document-a');
  const versions = await controller.loadVersions();
  const promoted = await controller.promoteVersion('version-a');

  assert.deepEqual(versions.map((item) => item.versionId), ['version-a']);
  assert.equal(promoted.publicationStatus, 'current');
  assert.deepEqual(calls.slice(1).map(({ target, options }) => [target, options.method]), [
    ['/v1/documents/document-a/versions', undefined],
    ['/v1/documents/document-a/versions/version-a/promote', 'POST'],
  ]);
});
