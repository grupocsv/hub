import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildCatalogViewModel,
  buildDetailViewModel,
} from '../../docs/public/documentos/assets/view.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HUB_ROOT = path.resolve(HERE, '../..');

function catalogItem(overrides = {}) {
  return {
    documentId: 'document-a',
    title: 'Protocolo Assistencial',
    description: 'Versão institucional vigente.',
    classification: 'internal',
    lifecycleStatus: 'active',
    updatedAt: '2026-07-24T11:00:00.000Z',
    favorite: false,
    ...overrides,
  };
}

test('constrói modelo de catálogo verificável para pronto, vazio, erro e paginação', () => {
  const ready = buildCatalogViewModel({
    status: 'ready',
    mode: 'catalog',
    items: [catalogItem()],
    nextCursor: 'cursor-a',
  });
  assert.equal(ready.status, 'ready');
  assert.equal(ready.items[0].classificationLabel, 'Interno');
  assert.equal(ready.items[0].lifecycleLabel, 'Ativo');
  assert.equal(ready.hasNextPage, true);

  assert.equal(buildCatalogViewModel({ status: 'empty', items: [], nextCursor: null }).status, 'empty');
  assert.equal(buildCatalogViewModel({ status: 'error', items: [], nextCursor: null }).status, 'error');
  assert.throws(() => buildCatalogViewModel({ status: 'ready', items: [{}], nextCursor: null }), /catálogo/i);
});

test('constrói modelo de detalhe somente com ações autorizadas e versões públicas', () => {
  const model = buildDetailViewModel(
    {
      status: 'ready',
      favorite: true,
      detail: {
        document: catalogItem({
          indexingPolicy: 'metadata_only',
          currentVersionId: 'version-a',
        }),
        permissions: ['read', 'update_metadata', 'archive', 'publish'],
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
    [{ versionId: 'version-a', versionNumber: 1, publicationStatus: 'eligible' }],
  );

  assert.equal(model.favorite, true);
  assert.deepEqual(model.actions.map(({ id }) => id), ['open', 'favorite', 'edit', 'archive']);
  assert.equal(model.versions[0].canPromote, true);
  assert.equal(model.actions.some(({ id }) => id === 'requestDeletion'), false);
});

test('camada DOM não usa HTML arbitrário e shell contém filtros e painel semântico', async () => {
  const [source, template] = await Promise.all([
    readFile(path.join(HUB_ROOT, 'docs/public/documentos/assets/view.js'), 'utf8'),
    readFile(path.join(HUB_ROOT, 'scripts/documentos-shell.template.html'), 'utf8'),
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
});
