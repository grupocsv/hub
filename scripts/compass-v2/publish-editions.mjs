import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const METADATA_FILES = ['metadata.yml', 'metadata.yaml', 'metadata.json'];
const PUBLISHABLE_NAMES = new Set(['compass.md', 'edition.css', 'release.json']);

async function readMetadata(editionDir) {
  for (const filename of METADATA_FILES) {
    try {
      const text = await readFile(path.join(editionDir, filename), 'utf8');
      return {
        filename,
        metadata: filename.endsWith('.json') ? JSON.parse(text) : parseYaml(text),
      };
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return null;
}

async function listFiles(root, prefix = '') {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, relative));
    if (entry.isFile()) files.push(relative);
  }
  return files;
}

async function sourceHash(editionDir) {
  const hash = createHash('sha256');
  for (const relative of await listFiles(editionDir)) {
    hash.update(relative.replaceAll(path.sep, '/'));
    hash.update('\0');
    hash.update(await readFile(path.join(editionDir, relative)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function assertSeparateTrees(sourceRoot, outputRoot) {
  const relative = path.relative(path.resolve(sourceRoot), path.resolve(outputRoot));
  if (!relative || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error('A árvore publicada não pode estar dentro da árvore canônica.');
  }
}

async function copyPublishable(editionDir, targetDir, metadataFilename) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(editionDir, { withFileTypes: true });
  for (const entry of entries) {
    const isPdf = entry.isFile() && entry.name.endsWith('.pdf');
    const isMetadata = entry.isFile() && entry.name === metadataFilename;
    const isAssetDir = entry.isDirectory() && entry.name === 'assets';
    const isEditionComponent = entry.isFile() && /^Compass\d{3}Content\.vue$/.test(entry.name);
    const isKnownFile = entry.isFile() && PUBLISHABLE_NAMES.has(entry.name);
    if (!isPdf && !isMetadata && !isAssetDir && !isEditionComponent && !isKnownFile) continue;
    await cp(path.join(editionDir, entry.name), path.join(targetDir, entry.name), {
      recursive: entry.isDirectory(),
      force: true,
    });
  }
}

export async function publishEditions({ sourceRoot, outputRoot }) {
  assertSeparateTrees(sourceRoot, outputRoot);
  await mkdir(outputRoot, { recursive: true });
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const skipped = [];
  let published = 0;

  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const editionDir = path.join(sourceRoot, entry.name);
    const loaded = await readMetadata(editionDir);
    if (!loaded || loaded.metadata?.schemaVersion !== 2 || loaded.metadata?.engine?.name !== 'compass-v2') {
      skipped.push(entry.name);
      continue;
    }
    const targetDir = path.join(outputRoot, entry.name);
    await copyPublishable(editionDir, targetDir, loaded.filename);
    const marker = {
      schemaVersion: 1,
      id: loaded.metadata.id,
      source: `compass/edicoes/${loaded.metadata.year}/${entry.name}`,
      sourceHash: await sourceHash(editionDir),
    };
    await writeFile(path.join(targetDir, '.compass-source.json'), `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
    published += 1;
  }

  return { published, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf('--source');
  const outputIndex = args.indexOf('--output');
  if (sourceIndex === -1 || outputIndex === -1 || !args[sourceIndex + 1] || !args[outputIndex + 1]) {
    throw new Error('Uso: node publish-editions.mjs --source <diretório-canônico> --output <diretório-docs>');
  }
  const result = await publishEditions({
    sourceRoot: path.resolve(args[sourceIndex + 1]),
    outputRoot: path.resolve(args[outputIndex + 1]),
  });
  console.log(`Compass™ v2: ${result.published} edição(ões) publicada(s); ${result.skipped.length} legada(s) preservada(s).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
