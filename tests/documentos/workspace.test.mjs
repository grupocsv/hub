import assert from 'node:assert/strict';
import test from 'node:test';

import { createDocumentosWorkspace } from '../../docs/public/documentos/assets/workspace.js';

function fixture() {
  const calls = [];
  const catalogState = {
    status: 'ready',
    mode: 'catalog',
    items: [{ documentId: 'document-a', title: 'Documento A', favorite: false }],
    nextCursor: null,
    filters: {},
  };
  let catalogOptions;
  let detailOptions;
  let handlers;
  let lifecycleOptions;
  const view = {
    bind(value) {
      handlers = value;
      calls.push(['view.bind']);
      return () => calls.push(['view.unbind']);
    },
    setMetadata(value) {
      calls.push(['view.metadata', value]);
    },
    renderCatalog(value) {
      calls.push(['view.catalog', value]);
    },
    renderDetail(value) {
      calls.push(['view.detail', value]);
    },
    renderVersions(value) {
      calls.push(['view.versions', value]);
    },
    renderRecent(value) {
      calls.push(['view.recent', value]);
    },
    renderCollections(value) {
      calls.push(['view.collections', value]);
    },
    clearSensitiveState(reason) {
      calls.push(['view.clear', reason]);
    },
    destroy() {
      calls.push(['view.destroy']);
    },
  };
  const catalog = {
    async loadMetadata() {
      calls.push(['catalog.metadata']);
      return {
        collections: [{ collectionId: 'collection-a', name: 'Coleção A' }],
        tags: [{ tagId: 'tag-a', name: 'Tag A' }],
      };
    },
    async loadList(filters) {
      calls.push(['catalog.list', filters]);
      catalogOptions.onState(catalogState);
      return catalogState;
    },
    async loadNext() {
      calls.push(['catalog.next']);
    },
    async search(query) {
      calls.push(['catalog.search', query]);
    },
    cancelActive() {
      calls.push(['catalog.cancel']);
    },
    destroy() {
      calls.push(['catalog.destroy']);
    },
  };
  const detail = {
    async load(documentId, options) {
      calls.push(['detail.load', documentId, options]);
      const loaded = {
        document: { documentId, title: 'Documento A' },
        permissions: ['read', 'update_metadata', 'archive', 'publish'],
      };
      detailOptions.onState({ status: 'ready', detail: loaded });
      return loaded;
    },
    async loadVersions() {
      calls.push(['detail.versions']);
      return [{ versionId: 'version-a', publicationStatus: 'eligible' }];
    },
    async updateMetadata(patch) {
      calls.push(['detail.update', patch]);
    },
    async setFavorite(value) {
      calls.push(['detail.favorite', value]);
    },
    async archive() {
      calls.push(['detail.archive']);
    },
    async restore() {
      calls.push(['detail.restore']);
    },
    async requestDeletion(reason) {
      calls.push(['detail.delete', reason]);
    },
    async promoteVersion(versionId) {
      calls.push(['detail.promote', versionId]);
    },
    cancel() {
      calls.push(['detail.cancel']);
    },
    destroy() {
      calls.push(['detail.destroy']);
    },
  };
  const recentEntries = [];
  const recent = {
    record(documentId) {
      recentEntries.unshift(documentId);
      calls.push(['recent.record', documentId]);
    },
    list() {
      return recentEntries;
    },
    clear() {
      recentEntries.length = 0;
      calls.push(['recent.clear']);
    },
  };

  const workspace = createDocumentosWorkspace({
    client: { request() {} },
    portal: 'unimed',
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
    bindLifecycle(options) {
      lifecycleOptions = options;
      return { destroy: () => calls.push(['lifecycle.destroy']) };
    },
  });

  return {
    workspace,
    calls,
    getHandlers: () => handlers,
    getLifecycleOptions: () => lifecycleOptions,
  };
}

test('inicia metadados e primeira página e liga a view uma única vez', async () => {
  const context = fixture();
  await context.workspace.start();
  await context.workspace.start();

  assert.deepEqual(context.calls.slice(0, 4), [
    ['view.bind'],
    ['catalog.metadata'],
    ['view.metadata', {
      collections: [{ collectionId: 'collection-a', name: 'Coleção A' }],
      tags: [{ tagId: 'tag-a', name: 'Tag A' }],
    }],
    ['catalog.list', {}],
  ]);
  assert.equal(context.calls.filter(([name]) => name === 'view.bind').length, 1);
});

test('orquestra busca, filtros, favoritos e paginação sem filtrar favoritos localmente', async () => {
  const context = fixture();
  await context.workspace.start();
  const handlers = context.getHandlers();

  await handlers.search('oncologia');
  await handlers.applyFilters({ collectionId: 'collection-a', tagId: 'tag-a' });
  await handlers.navigate('favoritos');
  await handlers.loadNext();

  assert.deepEqual(
    context.calls.filter(([name]) => name.startsWith('catalog.')),
    [
      ['catalog.metadata'],
      ['catalog.list', {}],
      ['catalog.search', 'oncologia'],
      ['catalog.list', { collectionId: 'collection-a', tagId: 'tag-a' }],
      ['catalog.list', { favorite: true }],
      ['catalog.next'],
    ],
  );
});

test('abre detalhe, registra recente efêmero e carrega versões autorizadas', async () => {
  const context = fixture();
  await context.workspace.start();
  const handlers = context.getHandlers();

  await handlers.openDocument('document-a', { favorite: false });
  await handlers.navigate('recentes');

  assert.deepEqual(context.calls.filter(([name]) => name.startsWith('detail.')), [
    ['detail.load', 'document-a', { favorite: false }],
    ['detail.versions'],
  ]);
  assert.ok(context.calls.some(([name, value]) => name === 'view.recent' && value[0].documentId === 'document-a'));
});

test('encaminha mutações ao controlador de detalhe e recarrega o catálogo atual', async () => {
  const context = fixture();
  await context.workspace.start();
  const handlers = context.getHandlers();
  await handlers.openDocument('document-a', { favorite: false });

  await handlers.updateMetadata({ title: 'Novo Título' });
  await handlers.setFavorite(true);
  await handlers.archive();
  await handlers.restore();
  await handlers.requestDeletion('Retenção encerrada');
  await handlers.promoteVersion('version-a');

  assert.deepEqual(context.calls.filter(([name]) => name.startsWith('detail.')).slice(2), [
    ['detail.update', { title: 'Novo Título' }],
    ['detail.favorite', true],
    ['detail.archive'],
    ['detail.restore'],
    ['detail.delete', 'Retenção encerrada'],
    ['detail.promote', 'version-a'],
  ]);
  assert.ok(context.calls.filter(([name]) => name === 'catalog.list').length >= 5);
});

test('BFCache e destruição limpam estado sensível antes de qualquer retomada', async () => {
  const context = fixture();
  await context.workspace.start();
  const lifecycle = context.getLifecycleOptions();
  context.calls.length = 0;

  lifecycle.cancelActive();
  lifecycle.clearSensitiveState('bfcache');
  await lifecycle.onRestored();

  assert.deepEqual(context.calls.slice(0, 4), [
    ['catalog.cancel'],
    ['detail.cancel'],
    ['recent.clear'],
    ['view.clear', 'bfcache'],
  ]);
  assert.ok(context.calls.some(([name]) => name === 'catalog.metadata'));

  context.calls.length = 0;
  context.workspace.destroy('session_lost');
  assert.deepEqual(context.calls.slice(0, 4), [
    ['catalog.cancel'],
    ['detail.cancel'],
    ['recent.clear'],
    ['view.clear', 'session_lost'],
  ]);
  assert.ok(context.calls.some(([name]) => name === 'catalog.destroy'));
  assert.ok(context.calls.some(([name]) => name === 'detail.destroy'));
});
