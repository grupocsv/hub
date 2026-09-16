import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DOCUMENTS_API_BASE_URL = "https://documentos-api.grupocsv.com";
export const CORPORATE_TENANT_ID = "grupo-csv";
export const COMPASS_COLLECTION = Object.freeze({
  collectionId: "compass",
  parentId: null,
  name: "Compass™",
  slug: "compass",
});

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "../..");
const DEFAULT_CATALOG_PATH = path.join(REPO_ROOT, "docs/compass/catalog.json");

class ApiError extends Error {
  constructor({ method, pathname, response }) {
    const requestId = response.headers.get("x-request-id");
    super(
      `${method} ${pathname} falhou com HTTP ${response.status}` +
        (requestId ? ` (request-id: ${requestId})` : ""),
    );
    this.name = "ApiError";
    this.status = response.status;
    this.pathname = pathname;
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} ausente ou inválido.`);
  }
  return value.trim();
}

function editionNumber(edition) {
  const number = String(edition.number).padStart(3, "0");
  if (!/^\d{3}$/u.test(number)) {
    throw new TypeError(`Número da edição Compass™ inválido: ${edition.number}.`);
  }
  return number;
}

export function descriptionForEdition(edition) {
  const number = editionNumber(edition);
  const year = Number(edition.year);
  const title = assertNonEmptyString(edition.title, `Edição ${number}: title`);
  if (!Number.isSafeInteger(year) || year < 2000 || year > 2100) {
    throw new TypeError(`Edição ${number}: year inválido.`);
  }

  const candidates = [edition.summary, edition.subtitle];
  const authoredDescription = candidates.find(
    (value) => typeof value === "string" && value.trim() !== "",
  );
  const description = authoredDescription?.trim() ?? `Edição ${number}/${year} do Compass™: ${title}.`;

  if (description.length > 4000) {
    throw new TypeError(`Edição ${number}: descrição excede 4.000 caracteres.`);
  }
  return description;
}

export function buildDesiredDocuments(catalog) {
  if (catalog?.schemaVersion !== 2 || !Array.isArray(catalog.editions)) {
    throw new TypeError("Catálogo Compass™ v2 inválido.");
  }

  const documents = catalog.editions.map((edition) => {
    const number = editionNumber(edition);
    const year = Number(edition.year);
    const title = assertNonEmptyString(edition.title, `Edição ${number}: title`);
    if (!Number.isSafeInteger(year) || year < 2000 || year > 2100) {
      throw new TypeError(`Edição ${number}: year inválido.`);
    }
    return Object.freeze({
      documentId: `compass-pdf-${year}-${number}`,
      catalogTitle: title,
      collectionId: COMPASS_COLLECTION.collectionId,
      description: descriptionForEdition(edition),
    });
  });

  const ids = documents.map((document) => document.documentId);
  if (new Set(ids).size !== ids.length) {
    throw new TypeError("Catálogo Compass™ contém edições duplicadas.");
  }

  return documents.sort((left, right) => left.documentId.localeCompare(right.documentId));
}

function authHeaders(token) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "X-Tenant-Id": CORPORATE_TENANT_ID,
  };
}

async function apiRequest({ fetchImpl, apiBaseUrl, token, pathname, method = "GET", body, headers = {} }) {
  const response = await fetchImpl(new URL(pathname, apiBaseUrl), {
    method,
    headers: {
      ...authHeaders(token),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!response.ok) throw new ApiError({ method, pathname, response });
  if (response.status === 204) return { response, payload: null };
  return { response, payload: await response.json() };
}

function collectionChange(existing) {
  const desired = COMPASS_COLLECTION;
  const changes = {};
  if (existing.name !== desired.name) changes.name = desired.name;
  if (existing.slug !== desired.slug) changes.slug = desired.slug;
  if (existing.parentId !== desired.parentId) changes.parent_id = desired.parentId;
  return changes;
}

async function listCollections(context) {
  const { payload } = await apiRequest({ ...context, pathname: "/v1/collections" });
  if (!Array.isArray(payload?.items)) {
    throw new TypeError("Resposta inválida ao listar coleções.");
  }
  return payload.items;
}

function resolveExistingCollection(collections) {
  const exact = collections.find(
    (collection) => collection.collectionId === COMPASS_COLLECTION.collectionId,
  );
  const sameSlug = collections.find(
    (collection) =>
      collection.slug === COMPASS_COLLECTION.slug &&
      collection.collectionId !== COMPASS_COLLECTION.collectionId,
  );
  if (sameSlug) {
    throw new Error(
      `O slug "${COMPASS_COLLECTION.slug}" já pertence à coleção ${sameSlug.collectionId}; sincronização interrompida.`,
    );
  }
  if (exact && exact.status !== "active") {
    throw new Error(`A coleção ${exact.collectionId} não está ativa.`);
  }
  return exact ?? null;
}

async function inspectCollection(context, plan) {
  const existing = resolveExistingCollection(await listCollections(context));

  if (!existing) {
    plan.collection = { action: "create", ...COMPASS_COLLECTION };
    return;
  }

  const changes = collectionChange(existing);
  if (Object.keys(changes).length === 0) {
    plan.collection = { action: "none", collectionId: existing.collectionId };
    return;
  }

  plan.collection = { action: "update", collectionId: existing.collectionId, changes };
}

async function applyCollection(context, operation) {
  if (operation.action === "none") return;
  if (operation.action === "create") {
    let created;
    try {
      const { payload } = await apiRequest({
        ...context,
        pathname: "/v1/collections",
        method: "POST",
        body: {
          collection_id: COMPASS_COLLECTION.collectionId,
          parent_id: COMPASS_COLLECTION.parentId,
          name: COMPASS_COLLECTION.name,
          slug: COMPASS_COLLECTION.slug,
        },
      });
      created = payload?.collection;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 409) throw error;
      created = resolveExistingCollection(await listCollections(context));
    }
    if (!created || created.collectionId !== COMPASS_COLLECTION.collectionId) {
      throw new Error("A API não confirmou a criação da coleção Compass™.");
    }
    return;
  }

  const { payload } = await apiRequest({
    ...context,
    pathname: `/v1/collections/${encodeURIComponent(operation.collectionId)}`,
    method: "PATCH",
    body: operation.changes,
  });
  if (payload?.collection?.collectionId !== COMPASS_COLLECTION.collectionId) {
    throw new Error("A API não confirmou a atualização da coleção Compass™.");
  }
}

async function inspectDocument(context, desired, requireEtag, plan) {
  const pathname = `/v1/documents/${encodeURIComponent(desired.documentId)}`;
  const { payload, response } = await apiRequest({ ...context, pathname });
  const document = payload?.document;
  if (!document || document.documentId !== desired.documentId) {
    throw new TypeError(`Resposta inválida para o documento ${desired.documentId}.`);
  }

  const changes = [];
  if (document.collectionId !== desired.collectionId) changes.push("collection_id");
  if (document.description !== desired.description) changes.push("description");
  if (changes.length === 0) {
    plan.documents.push({ documentId: desired.documentId, action: "none", changes: [] });
    return { action: "none", desired, pathname, etag: null };
  }

  plan.documents.push({ documentId: desired.documentId, action: "update", changes });
  const etag = response.headers.get("etag");
  if (requireEtag && !etag) {
    throw new Error(`A API não retornou ETag para ${desired.documentId}; PATCH recusado.`);
  }
  return { action: "update", desired, pathname, etag };
}

async function applyDocument(context, operation) {
  const { desired, pathname, etag } = operation;
  const { payload: updatedPayload } = await apiRequest({
    ...context,
    pathname,
    method: "PATCH",
    headers: { "If-Match": etag },
    body: {
      collection_id: desired.collectionId,
      description: desired.description,
    },
  });
  const updated = updatedPayload?.document;
  if (
    updated?.documentId !== desired.documentId ||
    updated.collectionId !== desired.collectionId ||
    updated.description !== desired.description
  ) {
    throw new Error(`A API não confirmou os metadados de ${desired.documentId}.`);
  }
}

export async function synchronizeCompassCentralCatalog({
  catalog,
  token,
  apply = false,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DOCUMENTS_API_BASE_URL,
}) {
  assertNonEmptyString(token, "CSV_DOCUMENTS_API_TOKEN");
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl inválido.");

  const context = { fetchImpl, apiBaseUrl, token };
  const plan = { mode: apply ? "apply" : "dry-run", collection: null, documents: [] };
  await inspectCollection(context, plan);

  const documentOperations = [];
  for (const desired of buildDesiredDocuments(catalog)) {
    documentOperations.push(await inspectDocument(context, desired, apply, plan));
  }

  if (apply) {
    await applyCollection(context, plan.collection);
    for (const operation of documentOperations) {
      if (operation.action === "update") await applyDocument(context, operation);
    }
  }

  return Object.freeze({
    ...plan,
    summary: Object.freeze({
      collectionsToChange: plan.collection?.action === "none" ? 0 : 1,
      documentsToChange: plan.documents.filter((item) => item.action === "update").length,
      documentsUnchanged: plan.documents.filter((item) => item.action === "none").length,
    }),
  });
}

export function parseCliArgs(argv) {
  const result = { apply: false, catalogPath: DEFAULT_CATALOG_PATH };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") {
      result.apply = true;
      continue;
    }
    if (argument === "--catalog" && argv[index + 1]) {
      result.catalogPath = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new TypeError(`Argumento não reconhecido: ${argument ?? ""}`);
  }
  return result;
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const token = process.env.CSV_DOCUMENTS_API_TOKEN;
  if (!token) {
    throw new Error("Defina CSV_DOCUMENTS_API_TOKEN no ambiente; credenciais não são aceitas por argumento.");
  }
  const catalog = JSON.parse(await readFile(options.catalogPath, "utf8"));
  const result = await synchronizeCompassCentralCatalog({
    catalog,
    token,
    apply: options.apply,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
