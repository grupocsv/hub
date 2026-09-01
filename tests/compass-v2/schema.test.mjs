import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const moduleUrl = pathToFileURL(path.join(repoRoot, 'scripts/compass-v2/schema.mjs')).href;

async function fixture(name) {
  return JSON.parse(await readFile(path.join(here, 'fixtures', name), 'utf8'));
}

async function loadSchemaModule() {
  try {
    return await import(moduleUrl);
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

test('expõe o contrato executável do Compass™ v2', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'scripts/compass-v2/schema.mjs ainda não existe');
  assert.equal(typeof schema.normalizeEditionMetadata, 'function');
  assert.equal(typeof schema.validateEditionMetadata, 'function');
  assert.equal(typeof schema.deriveCompassCatalog, 'function');
  assert.equal(typeof schema.buildEditionSlug, 'function');
});

test('fixa a hierarquia canônica de marcas sem ambiguidade', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'schema ausente');
  assert.deepEqual(schema.COMPASS_BRAND_CREDITS, {
    product: 'Compass™ — um produto do Grupo CSV',
    editorialResponsibility: 'Responsabilidade editorial: MedValor®',
    elaboration: 'Elaboração: AxiaCare®',
  });
});

test('normaliza o schema histórico 001–006 para o contrato v2', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'schema ausente');
  const normalized = schema.normalizeEditionMetadata(await fixture('legacy-001.json'));
  assert.equal(normalized.schemaVersion, 2);
  assert.equal(normalized.id, '001-2026');
  assert.equal(normalized.number, 1);
  assert.equal(normalized.year, 2026);
  assert.equal(normalized.slug, '001');
  assert.equal(normalized.status, 'Publicado');
  assert.equal(normalized.product.name, 'Compass™');
  assert.equal(normalized.product.owner, 'Grupo CSV');
  assert.equal(normalized.editorial.responsible, 'MedValor®');
  assert.deepEqual(normalized.elaboration, ['AxiaCare®']);
});

test('normaliza o schema histórico divergente da edição 007', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'schema ausente');
  const normalized = schema.normalizeEditionMetadata(await fixture('legacy-007.json'));
  assert.equal(normalized.id, '007-2026');
  assert.equal(normalized.number, 7);
  assert.equal(normalized.slug, '007');
  assert.equal(normalized.title, 'Crise de sustentabilidade e eficiência na saúde suplementar brasileira');
  assert.equal(normalized.publishedAt, '2026-06-07');
});

test('aceita a edição 008 nativa somente com créditos, artefatos e release completos', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'schema ausente');
  const edition = await fixture('native-008.json');
  const result = schema.validateEditionMetadata(edition);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.deepEqual(result.errors, []);
});

test('rejeita metadados com responsabilidade editorial ou elaboração incorretas', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'schema ausente');
  const edition = await fixture('native-008.json');
  edition.editorial.responsible = 'Grupo CSV';
  edition.elaboration = [];
  const result = schema.validateEditionMetadata(edition);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.path === 'editorial.responsible'));
  assert.ok(result.errors.some((error) => error.path === 'elaboration'));
});

test('gera slugs imutáveis de três dígitos e rejeita números fora do contrato', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'schema ausente');
  assert.equal(schema.buildEditionSlug(1), '001');
  assert.equal(schema.buildEditionSlug(8), '008');
  assert.throws(() => schema.buildEditionSlug(0), /edição/i);
  assert.throws(() => schema.buildEditionSlug(1000), /edição/i);
});

test('deriva catálogo único, ordenado e sem duplicação manual', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'schema ausente');
  const editions = [
    schema.normalizeEditionMetadata(await fixture('legacy-001.json')),
    schema.normalizeEditionMetadata(await fixture('legacy-007.json')),
    await fixture('native-008.json'),
  ];
  const catalog = schema.deriveCompassCatalog(editions);
  assert.deepEqual(catalog.map((item) => item.slug), ['008', '007', '001']);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  assert.equal(catalog[0].routes.web, '/compass/edicoes/2026/008/compass');
  assert.equal(catalog[0].routes.pdf, '/compass/edicoes/2026/008/compass_008_2026.pdf');
});

test('falha ao derivar catálogo quando duas edições disputam o mesmo slug', async () => {
  const schema = await loadSchemaModule();
  assert.notEqual(schema, null, 'schema ausente');
  const edition = await fixture('native-008.json');
  assert.throws(() => schema.deriveCompassCatalog([edition, structuredClone(edition)]), /duplicad/i);
});
