import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const qualityPath = path.join(repoRoot, 'scripts/compass-v2/quality-gates.mjs');

async function loadQuality() {
  try {
    return await import(pathToFileURL(qualityPath).href);
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

test('compara textos obrigatórios entre web e PDF de forma normalizada', async () => {
  const quality = await loadQuality();
  assert.notEqual(quality, null, 'quality-gates.mjs ainda não existe');
  const result = quality.evaluateParity({
    webText: 'Compass™ — um produto do Grupo CSV\nResponsabilidade editorial: MedValor®\nElaboração: AxiaCare®',
    pdfText: 'Compass™  um produto do Grupo CSV  Responsabilidade editorial: MedValor®  Elaboração: AxiaCare®',
    requiredTexts: ['Compass™', 'Grupo CSV', 'MedValor®', 'AxiaCare®'],
  });
  assert.deepEqual(result, { ok: true, missingInWeb: [], missingInPdf: [] });
});

test('falha se uma marca canônica desaparecer de qualquer saída', async () => {
  const quality = await loadQuality();
  assert.notEqual(quality, null, 'quality-gates.mjs ainda não existe');
  const result = quality.evaluateParity({
    webText: 'Compass™ Grupo CSV MedValor® AxiaCare®',
    pdfText: 'Compass™ Grupo CSV MedValor®',
    requiredTexts: ['Compass™', 'Grupo CSV', 'MedValor®', 'AxiaCare®'],
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingInPdf, ['AxiaCare®']);
});

test('aplica limites operacionais ao PDF', async () => {
  const quality = await loadQuality();
  assert.notEqual(quality, null, 'quality-gates.mjs ainda não existe');
  assert.deepEqual(quality.evaluatePdfConstraints({ bytes: 3_500_000, pages: 20 }), {
    ok: true,
    maxBytes: 4_000_000,
    bytes: 3_500_000,
    pages: 20,
    violations: [],
  });
  const oversized = quality.evaluatePdfConstraints({ bytes: 4_000_001, pages: 20 });
  assert.equal(oversized.ok, false);
  assert.match(oversized.violations[0], /4.000.000/);
});

test('bloqueia título escuro na mídia de impressão mesmo quando a tela e o axe-core estão corretos', async () => {
  const quality = await loadQuality();
  assert.notEqual(quality, null, 'quality-gates.mjs ainda não existe');
  const blocked = quality.evaluateVisualTokens({
    backTitleColor: 'rgb(255, 255, 255)',
    backBackgroundColor: 'rgb(20, 23, 28)',
    printBackTitleColor: 'rgb(22, 59, 99)',
    printBackBackgroundColor: 'rgb(20, 23, 28)',
  });
  assert.equal(blocked.ok, false);
  assert.ok(blocked.backTitleContrast >= 4.5);
  assert.ok(blocked.printBackTitleContrast < 4.5);
  assert.deepEqual(blocked.violations, ['O título da contracapa no PDF não atende ao contraste mínimo de 4,5:1.']);

  const approved = quality.evaluateVisualTokens({
    backTitleColor: 'rgb(255, 255, 255)',
    backBackgroundColor: 'rgb(20, 23, 28)',
    printBackTitleColor: 'rgb(255, 255, 255)',
    printBackBackgroundColor: 'rgb(20, 23, 28)',
  });
  assert.equal(approved.ok, true);
});

test('o auditor usa PDF.js, axe-core e gera screenshots desktop e mobile', async () => {
  const source = await readFile(qualityPath, 'utf8').catch(() => '');
  assert.match(source, /pdfjs-dist/);
  assert.match(source, /AxeBuilder/);
  assert.match(source, /screenshot/);
  assert.match(source, /375/);
  assert.match(source, /1440/);
  assert.match(source, /assertLocalRenderUrl/);
  assert.match(source, /evaluateVisualTokens/);
});
