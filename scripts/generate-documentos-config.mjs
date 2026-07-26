import { createHash, randomUUID } from 'node:crypto';
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const CONFIG_KEYS = new Set([
  'schemaVersion',
  'enabled',
  'apiBaseUrl',
  'enabledPortals',
  'features',
]);
const FEATURE_KEYS = new Set(['favorites', 'offline', 'upload', 'viewer']);
const REGISTRY_KEYS = new Set(['schemaVersion', 'tenants']);
const TENANT_KEYS = new Set(['portal', 'enabled', 'href']);
const ALLOWED_API_ORIGINS = new Set(['https://hub.grupocsv.com']);
const HUB_AUTH_ORIGIN = 'https://csv-auth.guilherme-thom.workers.dev';
const CANONICAL_PORTAL = /^[a-z0-9][a-z0-9-]{0,63}$/u;
const DOCUMENTOS_ROUTE = '/documentos/';

function fail(message) {
  throw new Error(message);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertOnlyKeys(value, allowed, context) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      fail(`Campo não permitido ${context}: ${key}.`);
    }
  }
}

function parseJson(source, path) {
  try {
    return JSON.parse(source);
  } catch {
    fail(`JSON inválido em ${path}.`);
  }
}

async function readRequired(path, description) {
  try {
    await access(path, fsConstants.R_OK);
    return await readFile(path, 'utf8');
  } catch {
    fail(`${description} ausente: ${path}.`);
  }
}

function normalizeApiBaseUrl(value, enabled) {
  if (value === null) {
    if (enabled) fail('A aplicação habilitada exige uma base pública da API.');
    return null;
  }
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) {
    fail('URL pública inválida para a base da API.');
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail('URL pública inválida para a base da API.');
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== '/' && parsed.pathname !== '')
  ) {
    fail('URL pública inválida para a base da API.');
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_API_ORIGINS.has(parsed.origin)) {
    fail('A base da API deve usar uma origem HTTPS permitida.');
  }

  return parsed.origin;
}

function validateFeatures(value) {
  if (!isRecord(value)) fail('Objeto de features inválido.');
  assertOnlyKeys(value, FEATURE_KEYS, 'em features');

  const normalized = {};
  for (const key of FEATURE_KEYS) {
    if (typeof value[key] !== 'boolean') {
      fail(`Feature pública inválida: ${key}.`);
    }
    normalized[key] = value[key];
  }
  if (normalized.offline) {
    fail('A feature offline permanece indisponível nesta fase.');
  }
  return normalized;
}

function validatePortalList(value) {
  if (!Array.isArray(value)) fail('Lista de portais habilitados inválida.');
  const portals = [];
  const seen = new Set();
  for (const portal of value) {
    if (typeof portal !== 'string' || !CANONICAL_PORTAL.test(portal)) {
      fail('Identificador de portal inválido.');
    }
    if (seen.has(portal)) fail(`Portal habilitado duplicado: ${portal}.`);
    seen.add(portal);
    portals.push(portal);
  }
  return portals;
}

function validateRegistry(value) {
  if (!isRecord(value)) fail('Registro declarativo de tenants inválido.');
  assertOnlyKeys(value, REGISTRY_KEYS, 'no registro de tenants');
  if (value.schemaVersion !== 1 || !Array.isArray(value.tenants)) {
    fail('Schema do registro declarativo de tenants inválido.');
  }

  const registry = new Map();
  for (const entry of value.tenants) {
    if (!isRecord(entry)) fail('Entrada de tenant inválida.');
    assertOnlyKeys(entry, TENANT_KEYS, 'na entrada de tenant');
    if (typeof entry.portal !== 'string' || !CANONICAL_PORTAL.test(entry.portal)) {
      fail('Portal inválido no registro de tenants.');
    }
    if (registry.has(entry.portal)) fail(`Portal duplicado no registro: ${entry.portal}.`);
    if (typeof entry.enabled !== 'boolean') fail(`Estado inválido do portal ${entry.portal}.`);
    if (typeof entry.href !== 'string' || entry.href !== DOCUMENTOS_ROUTE) {
      fail(`Rota divergente no portal ${entry.portal}.`);
    }
    registry.set(entry.portal, Object.freeze({
      portal: entry.portal,
      enabled: entry.enabled,
      href: entry.href,
    }));
  }
  return registry;
}

function validateConfig(value, registry) {
  if (!isRecord(value)) fail('Configuração pública inválida.');
  assertOnlyKeys(value, CONFIG_KEYS, 'na configuração pública');
  if (value.schemaVersion !== 1) fail('Versão do schema da configuração inválida.');
  if (typeof value.enabled !== 'boolean') fail('Estado global da aplicação inválido.');

  const enabledPortals = validatePortalList(value.enabledPortals);
  for (const portal of enabledPortals) {
    const entry = registry.get(portal);
    if (!entry) fail(`Portal habilitado não registrado: ${portal}.`);
    if (!entry.enabled) fail(`Portal habilitado está desativado no registro: ${portal}.`);
  }
  if (!value.enabled && enabledPortals.length > 0) {
    fail('Aplicação globalmente desabilitada não pode habilitar portais.');
  }

  return Object.freeze({
    schemaVersion: 1,
    enabled: value.enabled,
    apiBaseUrl: normalizeApiBaseUrl(value.apiBaseUrl, value.enabled),
    enabledPortals,
    features: validateFeatures(value.features),
  });
}

function safeJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function normalizeLineEndings(value) {
  return value.replace(/\r\n?/gu, '\n');
}

function runtimeSource(config) {
  return `globalThis.HUB_DOCUMENTOS_CONFIG = Object.freeze(${safeJson(config)});\n`;
}

function integrityFor(source) {
  return `sha384-${createHash('sha384').update(source).digest('base64')}`;
}

function cspFor(config, integrity) {
  const connectSource = config.apiBaseUrl ? ` ${config.apiBaseUrl}` : '';
  return [
    "default-src 'none'",
    `script-src 'self' '${integrity}'`,
    "style-src 'self'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${connectSource} ${HUB_AUTH_ORIGIN}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

function replaceSingleMarker(source, marker, value, label) {
  const occurrences = source.split(marker).length - 1;
  if (occurrences !== 1) fail(`Marcador ${label} ausente ou duplicado no template.`);
  return source.replace(marker, value);
}

function shellSource(template, config, integrity) {
  const withIntegrity = replaceSingleMarker(
    template,
    '__DOCUMENTOS_RUNTIME_INTEGRITY__',
    integrity,
    'de integridade',
  );
  return replaceSingleMarker(withIntegrity, '__DOCUMENTOS_CSP__', cspFor(config, integrity), 'CSP');
}

async function validateStagedSet(stage, runtime, shell, integrity) {
  const stagedRuntime = await readFile(join(stage, 'assets', 'runtime-config.js'), 'utf8');
  const stagedShell = await readFile(join(stage, 'index.html'), 'utf8');
  if (stagedRuntime !== runtime || stagedShell !== shell) fail('Conjunto gerado divergente no staging.');
  if (!stagedShell.includes(`integrity="${integrity}"`)) fail('SRI divergente no shell gerado.');
  if (!stagedShell.includes(`'${integrity}'`)) fail('CSP divergente no shell gerado.');
  if (stagedShell.includes('__DOCUMENTOS_')) fail('Marcador não resolvido no shell gerado.');
}

async function promote(stage, target) {
  const parent = dirname(target);
  const backup = join(parent, `.documentos-backup-${randomUUID()}`);
  let hadPrevious = false;

  try {
    await access(target, fsConstants.F_OK);
    hadPrevious = true;
  } catch {
    hadPrevious = false;
  }

  if (hadPrevious) await rename(target, backup);
  try {
    await rename(stage, target);
  } catch (error) {
    if (hadPrevious) await rename(backup, target);
    throw error;
  }
  if (hadPrevious) await rm(backup, { recursive: true, force: true });
}

function rootFromArgs(argv) {
  if (argv.length === 0) return process.cwd();
  if (argv.length === 2 && argv[0] === '--root' && argv[1]) return resolve(argv[1]);
  fail('Uso: node scripts/generate-documentos-config.mjs [--root <diretório>].');
}

export async function generateDocumentosConfig(root) {
  const scriptsDir = join(root, 'scripts');
  const configPath = join(scriptsDir, 'documentos-runtime-config.json');
  const registryPath = join(scriptsDir, 'documentos-tenants.json');
  const templatePath = join(scriptsDir, 'documentos-shell.template.html');
  const target = join(root, 'docs', 'public', 'documentos');
  const parent = dirname(target);

  const configText = await readRequired(
    configPath,
    'Fonte da configuração versionada',
  );
  const registryText = await readRequired(
    registryPath,
    'Registro declarativo de tenants',
  );
  const template = normalizeLineEndings(
    await readRequired(templatePath, 'Template do shell'),
  );
  const registry = validateRegistry(parseJson(registryText, registryPath));
  const config = validateConfig(parseJson(configText, configPath), registry);
  const runtime = runtimeSource(config);
  const integrity = integrityFor(runtime);
  const shell = shellSource(template, config, integrity);

  await mkdir(parent, { recursive: true });
  const stage = await mkdtemp(join(parent, '.documentos-stage-'));
  try {
    try {
      await access(target, fsConstants.F_OK);
      await cp(target, stage, { recursive: true, force: true });
    } catch {
      // A primeira geração começa com staging vazio.
    }
    await mkdir(join(stage, 'assets'), { recursive: true });
    await writeFile(join(stage, 'assets', 'runtime-config.js'), runtime, 'utf8');
    await writeFile(join(stage, 'index.html'), shell, 'utf8');
    await validateStagedSet(stage, runtime, shell, integrity);
    await promote(stage, target);
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    throw error;
  }

  return Object.freeze({ target, integrity });
}

const executedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (executedDirectly) {
  generateDocumentosConfig(rootFromArgs(process.argv.slice(2)))
    .then(({ integrity }) => {
      process.stdout.write(`Hub Documentos: configuração gerada (${integrity}).\n`);
    })
    .catch((error) => {
      process.stderr.write(`Erro ao gerar Hub Documentos: ${error.message}\n`);
      process.exitCode = 1;
    });
}
