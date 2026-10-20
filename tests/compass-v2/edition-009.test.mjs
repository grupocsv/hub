import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { validateEditionMetadata } from '../../scripts/compass-v2/schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const editionDir = path.join(repoRoot, 'compass/edicoes/2026/009');

async function read(name) {
  return readFile(path.join(editionDir, name), 'utf8');
}

test('a edição 009 é nativa v2 com metadados válidos, créditos e artefatos completos', async () => {
  const metadata = parseYaml(await read('metadata.yml'));
  const validation = validateEditionMetadata(metadata);
  assert.deepEqual(validation.errors, []);
  assert.equal(metadata.id, '009-2026');
  assert.equal(metadata.slug, '009');
  assert.equal(metadata.title, 'Rumo à organização por condição');
  assert.equal(metadata.status, 'Publicado');
  assert.deepEqual(metadata.elaboration, ['Grupo CSV']);
  assert.equal(metadata.migration.state, 'native-v2');
  assert.equal(metadata.release.active, false);
  assert.equal(metadata.routes.pdf, '/compass/edicoes/2026/009/compass_009_2026.pdf');
  assert.ok(metadata.sources.some((source) => source.doi === '10.1056/CAT.26.0046'));
});

test('a fonte canônica da edição 009 usa o componente nativo, o modo paginado e a ação de download', async () => {
  const [source, component] = await Promise.all([read('compass.md'), read('Compass009Content.vue')]);
  assert.match(source, /mode:\s*paged/u);
  assert.match(source, /import Compass009Content from ['"]\.\/Compass009Content\.vue['"]/u);
  assert.match(source, /<Compass009Content\s*\/>/u);
  assert.match(source, /<style src="\.\/edition\.css"><\/style>/u);
  assert.match(component, /^<template>\s*<div class="compass-ed-009">/u);
  assert.match(component, /href=["']\.\/compass_009_2026\.pdf["'][^>]*\bdownload\b/u);
  assert.match(component, /Baixar PDF da edição 009/u);
  for (const credit of ['Compass™ — elaboração do Grupo CSV', 'Responsabilidade editorial: MedValor®']) {
    assert.ok(component.includes(credit), `crédito ausente: ${credit}`);
  }
  assert.doesNotMatch(component, /Minuta para revisão|Status<\/div>/u, 'a edição não carrega selo de estado editorial');
  assert.equal((component.match(/<section class="compass-page/gu) ?? []).length, 21);
  assert.doesNotMatch(component, /­/u, 'o componente não pode carregar hifens suaves');
});

test('o manifesto de release da edição 009 descreve o PDF versionado', async () => {
  const manifest = JSON.parse(await read('release.json'));
  assert.equal(manifest.editionId, '009-2026');
  assert.equal(manifest.pdf.filename, 'compass_009_2026.pdf');
  assert.equal(manifest.pdf.pages, 21);
  assert.match(manifest.pdf.sha256, /^[a-f0-9]{64}$/u);
  const pdf = await readFile(path.join(editionDir, 'compass_009_2026.pdf'));
  assert.equal(pdf.length, manifest.pdf.bytes);
  assert.ok(pdf.length < 4_000_000);
});
