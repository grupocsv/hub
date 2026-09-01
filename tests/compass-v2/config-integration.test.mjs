import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const configPath = path.join(repoRoot, 'docs/.vitepress/config.mts');

test('a sidebar Compass™ deriva suas edições do catálogo gerado', async () => {
  const config = await readFile(configPath, 'utf8');
  assert.match(config, /import\s+compassCatalog\s+from\s+['"]\.\.\/compass\/catalog\.json['"]/);
  assert.match(config, /compassCatalog\.editions\.map/);
  assert.doesNotMatch(config, /\{\s*text:\s*['"]001\s+—\s+Metas ACO/);
});

test('os títulos da sidebar são resumidos por função determinística', async () => {
  const config = await readFile(configPath, 'utf8');
  assert.match(config, /function\s+compassSidebarLabel/);
  assert.match(config, /edition\.slug/);
  assert.match(config, /edition\.title/);
});

test('a documentação operacional fixa as oito edições no motor v2 e congela o FPDF fora do caminho ativo', async () => {
  const [readme, infra, guide, metadataTemplate, editionTemplate] = await Promise.all([
    readFile(path.join(repoRoot, 'compass/README.md'), 'utf8'),
    readFile(path.join(repoRoot, 'docs/_infra/ferramentas/compass.md'), 'utf8'),
    readFile(path.join(repoRoot, 'docs/compass/skills/gerar-compass.md'), 'utf8'),
    readFile(path.join(repoRoot, 'compass/templates/metadata_template.yml'), 'utf8'),
    readFile(path.join(repoRoot, 'compass/templates/compass_template.md'), 'utf8'),
  ]);

  assert.match(readme, /As edições 001–008 usam o motor v2 como caminho ativo/u);
  assert.doesNotMatch(readme, /migração prevista no M8/u);
  assert.match(infra, /Acervo no Motor v2 \| 001–008/u);
  assert.match(guide, /render-pdf\.mjs/u);
  assert.match(guide, /quality-gates\.mjs/u);
  assert.doesNotMatch(guide, /python3 tools\/compass-pdf\/compass-pdf-gen\.py/u);
  assert.match(metadataTemplate, /schemaVersion:\s*2/u);
  assert.match(metadataTemplate, /name:\s*Compass™/u);
  assert.match(metadataTemplate, /responsible:\s*MedValor®/u);
  assert.match(editionTemplate, /<CompassEdition/u);
  assert.doesNotMatch(editionTemplate, /compass_header\.png/u);
});
