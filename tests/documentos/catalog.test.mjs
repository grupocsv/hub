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

test('não pagina o snapshot anterior enquanto uma nova listagem está carregando', async () => {
  const replacement = deferred();
  const calls = [];
  const client = {
    request(target) {
      calls.push(target);
      if (calls.length === 1) {
        return Promise.resolve({
          data: {
            items: [catalogItem({ documentId: 'document-a' })],
            next_cursor: 'cursor-a',
          },
        });
      }
      return replacement.promise;
    },
  };
  const controller = createCatalogController({ client });

  await controller.loadList({ classification: 'internal' });
  const loadingReplacement = controller.loadList({ classification: 'public' });
  const paginationDuringLoad = await controller.loadNext();

  assert.equal(calls.length, 2);
  assert.equal(paginationDuringLoad.items[0].documentId, 'document-a');
  replacement.resolve({
    data: {
      items: [catalogItem({ documentId: 'document-b', classification: 'public' })],
      next_cursor: null,
    },
  });
  const replaced = await loadingReplacement;
  assert.equal(replaced.items[0].documentId, 'document-b');
});

test('carrega coleções, tags e capacidades em requests separados e representa catálogo vazio', async () => {
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
      if (target === '/v1/capabilities') {
        return { data: { permissions: ['create'] } };
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

  assert.deepEqual(
    calls.slice(0, 3),
    ['/v1/collections', '/v1/tags', '/v1/capabilities'],
  );
  assert.deepEqual(metadata.collections.map((item) => item.collectionId), ['collection-a']);
  assert.deepEqual(metadata.tags.map((item) => item.tagId), ['tag-a']);
  assert.deepEqual(metadata.permissions, ['create']);
  assert.equal(states.at(-1).status, 'empty');
});

test('cancelamento interrompe também os metadados iniciais do catálogo', async () => {
  const collections = deferred();
  const tags = deferred();
  const capabilities = deferred();
  const calls = [];
  const controller = createCatalogController({
    client: {
      request(target, options = {}) {
        calls.push({ target, options });
        if (target === '/v1/collections') return collections.promise;
        if (target === '/v1/tags') return tags.promise;
        return capabilities.promise;
      },
    },
  });

  const loading = controller.loadMetadata();
  controller.cancelActive();
  assert.equal(calls.length, 3);
  assert.equal(calls.every(({ options }) => options.signal.aborted), true);

  collections.resolve({ data: { items: [] } });
  tags.resolve({ data: { items: [] } });
  capabilities.resolve({ data: { permissions: [] } });
  assert.equal(await loading, null);
});

test('recentes são efêmeros, limitados a 20 e ordenados pelo updatedAt da API', () => {
  const store = createRecentStore({ portal: 'unimed' });
  for (let index = 0; index < 22; index += 1) {
    store.record(`document-${index}`, `2026-07-24T${String(index).padStart(2, '0')}:00:00.000Z`);
  }
  store.record('document-2', '2026-07-25T00:00:00.000Z');

  assert.equal(store.size, 20);
  assert.equal(store.list()[0], 'document-2');
  assert.equal(store.list().includes('document-0'), false);
  assert.equal(store.list().includes('document-1'), false);
  assert.throws(() => store.record('document-invalid', 'data inválida'), /atualização/i);

  store.setPortal('icds');
  assert.deepEqual(store.list(), []);
  store.record('document-c', '2026-07-25T01:00:00.000Z');
  store.clear('session_lost');
  assert.deepEqual(store.list(), []);
  assert.equal(store.size, 0);
});

test('pagehide cancela efeitos e limpa estado antes de qualquer BFCache', () => {
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
  });

  listeners.get('pagehide')({ persisted: true });
  assert.deepEqual(order, ['cancel', 'clear']);
  lifecycle.destroy();
  assert.equal(listeners.size, 0);
});

test('aceita identificadores opacos de até 256 caracteres sem aceitar controles ou espaços laterais', () => {
  const opaqueId = `documento-${'á'.repeat(246)}`;
  assert.equal(
    buildCatalogTarget({ collectionId: opaqueId }),
    `/v1/documents?collection_id=${encodeURIComponent(opaqueId)}&limit=20`,
  );
  assert.throws(() => buildCatalogTarget({ collectionId: ` ${opaqueId}` }), /coleção/i);
  assert.throws(() => buildCatalogTarget({ tagId: `tag\u0000id` }), /tag/i);
});
