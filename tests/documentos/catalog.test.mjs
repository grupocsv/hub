import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bindCatalogLifecycle,
  buildCatalogTarget,
  buildSearchRequest,
  createCatalogController,
  createRecentStore,
  normalizeCatalogPayload,
} from '../../docs/public/documentos/assets/catalog.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function catalogItem(overrides = {}) {
  return {
    tenantId: 'tenant-a',
    documentId: 'document-a',
    collectionId: null,
    title: 'Documento A',
    description: 'Descrição autorizada',
    classification: 'internal',
    indexingPolicy: 'metadata_only',
    lifecycleStatus: 'active',
    currentVersionId: 'version-a',
    owner: { type: 'human', id: 'user-a' },
    metadataVersion: 1,
    etag: 'W/"metadata-1"',
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T11:00:00.000Z',
    favorite: false,
    ...overrides,
  };
}

test('constrói query fechada com limite de 20, filtros permitidos e cursor opaco', () => {
  assert.equal(
    buildCatalogTarget({
      collectionId: 'collection-a',
      classification: 'internal',
      lifecycleStatus: 'active',
      favorite: true,
      cursor: 'cursor opaco',
    }),
    '/v1/documents?collection_id=collection-a&lifecycle_status=active&classification=internal&favorite=true&limit=20&cursor=cursor+opaco',
  );
  assert.equal(buildCatalogTarget({}), '/v1/documents?limit=20');
  assert.throws(
    () => buildCatalogTarget({ query: 'não permitido' }),
    /parâmetro de catálogo não permitido/i,
  );
  assert.throws(() => buildCatalogTarget({ favorite: false }), /favorito inválido/i);
});

test('separa pesquisa da listagem e limita a consulta a 20 resultados', () => {
  assert.deepEqual(buildSearchRequest('  protocolo clínico  '), {
    target: '/v1/search',
    options: {
      method: 'POST',
      body: { query: 'protocolo clínico', limit: 20 },
    },
  });
  assert.throws(() => buildSearchRequest('   '), /busca inválida/i);
  assert.throws(() => buildSearchRequest('x'.repeat(501)), /busca inválida/i);
});

test('normaliza catálogo somente quando favorito é verificável em todos os itens', () => {
  assert.deepEqual(
    normalizeCatalogPayload({ items: [catalogItem({ favorite: true })], next_cursor: null }),
    { items: [catalogItem({ favorite: true })], nextCursor: null },
  );
  const missingFavorite = catalogItem();
  delete missingFavorite.favorite;
  assert.throws(
    () => normalizeCatalogPayload({ items: [missingFavorite], next_cursor: null }),
    /resposta de catálogo inválida/i,
  );
});

test('cancela a listagem anterior e nunca mistura resposta de busca com catálogo', async () => {
  const first = deferred();
  const calls = [];
  const states = [];
  const client = {
    request(target, options = {}) {
      calls.push({ target, options });
      if (calls.length === 1) return first.promise;
      return Promise.resolve({
        data: {
          query_id: 'query-a',
          results: [
            {
              document_id: 'document-search',
              version_id: 'version-search',
              chunk_id: 'chunk-search',
              title: 'Resultado',
              score: 0.9,
              excerpt: 'Trecho autorizado',
            },
          ],
        },
      });
    },
  };
  const controller = createCatalogController({
    client,
    portal: 'unimed',
    onState: (state) => states.push(state),
  });

  const listPromise = controller.loadList({ classification: 'internal' });
  const searchResult = await controller.search('resultado');

  assert.equal(calls[0].options.signal.aborted, true);
  assert.equal(calls[0].target, '/v1/documents?classification=internal&limit=20');
  assert.equal(calls[1].target, '/v1/search');
  assert.deepEqual(searchResult.items.map((item) => item.documentId), ['document-search']);

  first.resolve({ data: { items: [catalogItem()], next_cursor: null } });
  await listPromise;
  assert.equal(states.at(-1).mode, 'search');
  assert.deepEqual(states.at(-1).items.map((item) => item.documentId), ['document-search']);
});

test('carrega coleções e tags em requests separados e representa catálogo vazio', async () => {
  const calls = [];
  const states = [];
  const client = {
    async request(target) {
      calls.push(target);
      if (target === '/v1/collections') {
        return { data: { items: [{ collectionId: 'collection-a', parentId: null, name: 'Coleção A', slug: 'colecao-a', status: 'active' }] } };
      }
      if (target === '/v1/tags') {
        return { data: { items: [{ tagId: 'tag-a', name: 'Tag A', slug: 'tag-a' }] } };
      }
      return { data: { items: [], next_cursor: null } };
    },
  };
  const controller = createCatalogController({
    client,
    portal: 'unimed',
    onState: (state) => states.push(state),
  });

  const metadata = await controller.loadMetadata();
  await controller.loadList({});

  assert.deepEqual(calls.slice(0, 2), ['/v1/collections', '/v1/tags']);
  assert.deepEqual(metadata.collections.map((item) => item.collectionId), ['collection-a']);
  assert.deepEqual(metadata.tags.map((item) => item.tagId), ['tag-a']);
  assert.equal(states.at(-1).status, 'empty');
});

test('recentes são efêmeros, ordenados e limpos em toda fronteira de contexto', () => {
  let now = 1;
  const store = createRecentStore({ portal: 'unimed', now: () => now });
  store.record('document-a');
  now = 2;
  store.record('document-b');
  now = 3;
  store.record('document-a');
  assert.deepEqual(store.list(), ['document-a', 'document-b']);

  store.setPortal('icds');
  assert.deepEqual(store.list(), []);
  store.record('document-c');
  store.clear('session_lost');
  assert.deepEqual(store.list(), []);
  assert.equal(store.size, 0);
});

test('BFCache cancela efeitos e limpa recentes antes de qualquer retomada', () => {
  const listeners = new Map();
  const order = [];
  const target = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
  };
  const lifecycle = bindCatalogLifecycle({
    target,
    cancelActive: () => order.push('cancel'),
    clearSensitiveState: () => order.push('clear'),
    onRestored: () => order.push('restored'),
  });

  listeners.get('pageshow')({ persisted: true });
  assert.deepEqual(order, ['cancel', 'clear', 'restored']);
  lifecycle.destroy();
  assert.equal(listeners.size, 0);
});
