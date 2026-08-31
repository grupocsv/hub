import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { deriveCompassCatalog, normalizeEditionMetadata } from './schema.mjs';

const METADATA_FILES = ['metadata.json', 'metadata.yml', 'metadata.yaml'];

export function parseMetadataText(text, extension = '.yml') {
  if (extension === '.json') return JSON.parse(text);
  if (extension === '.yml' || extension === '.yaml') return parseYaml(text);
  throw new Error(`Formato de metadados não suportado: ${extension}`);
}

async function findMetadataFiles(sourceRoot) {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const files = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    for (const filename of METADATA_FILES) {
      const candidate = path.join(sourceRoot, entry.name, filename);
      try {
        await readFile(candidate, 'utf8');
        files.push({ directory: entry.name, file: candidate, filename });
        break;
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
  }
  return files;
}

function catalogProjection(edition) {
  return {
    schemaVersion: edition.schemaVersion,
    id: edition.id,
    number: edition.number,
    year: edition.year,
    slug: edition.slug,
    title: edition.title,
    subtitle: edition.subtitle,
    publishedAt: edition.publishedAt,
    status: edition.status,
    summary: edition.summary,
    topics: edition.topics,
    tags: edition.tags,
    product: edition.product,
    editorial: edition.editorial,
    elaboration: edition.elaboration,
    engine: edition.engine,
    routes: edition.routes,
    artifacts: edition.artifacts,
    release: edition.release,
    migration: edition.migration,
  };
}

export async function buildCatalog({ sourceRoot }) {
  const files = await findMetadataFiles(sourceRoot);
  const normalized = [];
  const sourceRecords = [];

  for (const item of files) {
    const text = await readFile(item.file, 'utf8');
    const parsed = parseMetadataText(text, path.extname(item.filename));
    normalized.push(normalizeEditionMetadata(parsed));
    sourceRecords.push({ directory: item.directory, filename: item.filename, text });
  }

  const editions = deriveCompassCatalog(normalized).map(catalogProjection);
  const sourceHash = createHash('sha256')
    .update(JSON.stringify(sourceRecords))
    .digest('hex');

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    sourceHash,
    total: editions.length,
    editions,
  };
}

export async function writeCatalog({ sourceRoot, output }) {
  const catalog = await buildCatalog({ sourceRoot });
  try {
    const previous = JSON.parse(await readFile(output, 'utf8'));
    if (previous.sourceHash === catalog.sourceHash && previous.generatedAt) {
      catalog.generatedAt = previous.generatedAt;
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  return catalog;
}

async function main() {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf('--source');
  const outputIndex = args.indexOf('--output');
  if (sourceIndex === -1 || outputIndex === -1 || !args[sourceIndex + 1] || !args[outputIndex + 1]) {
    throw new Error('Uso: node catalog.mjs --source <diretório> --output <arquivo>');
  }
  const catalog = await writeCatalog({
    sourceRoot: path.resolve(args[sourceIndex + 1]),
    output: path.resolve(args[outputIndex + 1]),
  });
  console.log(`Catálogo Compass™ v2: ${catalog.total} edições.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
