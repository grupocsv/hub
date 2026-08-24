const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const LINK_STATUSES = new Set(["active", "inactive"]);
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "docs",
  "health",
  "login",
  "openapi",
]);

function plainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function identifier(value, name) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 256 ||
    value !== value.trim() ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new TypeError(`${name} inválido.`);
  }
  return value;
}

function field(value, camelCase, snakeCase) {
  return Object.hasOwn(value, camelCase) ? value[camelCase] : value[snakeCase];
}

function httpsUrl(value) {
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.hash
    ) {
      throw new TypeError("URL inválida.");
    }
    return parsed.href;
  } catch {
    throw new TypeError("Link público inválido.");
  }
}

function nullableTimestamp(value, name) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${name} inválida.`);
  }
  return value;
}

function optionalIdentifier(value, name) {
  if (value === null || value === undefined) return null;
  return identifier(value, name);
}

function normalizePublicLink(value, expectedDocumentId = null) {
  if (!plainObject(value)) throw new TypeError("Link público inválido.");
  const linkId = identifier(field(value, "linkId", "link_id"), "Link");
  const documentId = identifier(
    field(value, "documentId", "document_id"),
    "Documento",
  );
  const slug = field(value, "slug", "slug");
  const status = field(value, "status", "status");
  const allowDownload = field(value, "allowDownload", "allow_download");
  const createdAt = field(value, "createdAt", "created_at");
  if (
    (expectedDocumentId !== null && documentId !== expectedDocumentId) ||
    typeof slug !== "string" ||
    slug.length < 3 ||
    slug.length > 48 ||
    !SLUG_PATTERN.test(slug) ||
    RESERVED_SLUGS.has(slug) ||
    !LINK_STATUSES.has(status) ||
    typeof allowDownload !== "boolean" ||
    typeof createdAt !== "string" ||
    !Number.isFinite(Date.parse(createdAt))
  ) {
    throw new TypeError("Link público inválido.");
  }
  return Object.freeze({
    linkId,
    documentId,
    versionId: optionalIdentifier(
      field(value, "versionId", "version_id"),
      "Versão",
    ),
    documentTitle:
      typeof field(value, "documentTitle", "document_title") === "string" &&
      field(value, "documentTitle", "document_title").length > 0
        ? field(value, "documentTitle", "document_title")
        : null,
    tenantId: optionalIdentifier(
      field(value, "tenantId", "tenant_id"),
      "Tenant",
    ),
    slug,
    publicUrl: httpsUrl(field(value, "publicUrl", "public_url")),
    status,
    expiresAt: nullableTimestamp(
      field(value, "expiresAt", "expires_at"),
      "Expiração",
    ),
    allowDownload,
    createdAt,
  });
}

export function normalizePublicLinksPayload(payload, expectedDocumentId) {
  if (!plainObject(payload) || !Array.isArray(payload.items)) {
    throw new TypeError("Resposta de links públicos inválida.");
  }
  const documentId = identifier(expectedDocumentId, "Documento");
  return Object.freeze(
    payload.items.map((item) => normalizePublicLink(item, documentId)),
  );
}

function normalizeCursor(value) {
  if (value === null || value === undefined || value === "") return null;
  if (
    typeof value !== "string" ||
    value.length > 512 ||
    value !== value.trim() ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new TypeError("Cursor de links públicos inválido.");
  }
  return value;
}

export function normalizeTenantPublicLinksPage(payload) {
  if (!plainObject(payload) || !Array.isArray(payload.items)) {
    throw new TypeError("Resposta do painel de links públicos inválida.");
  }
  const nextCursor = normalizeCursor(
    field(payload, "nextCursor", "next_cursor"),
  );
  return Object.freeze({
    items: Object.freeze(
      payload.items.map((item) => normalizePublicLink(item)),
    ),
    nextCursor,
  });
}

function normalizePublicLinkResponse(payload, expectedDocumentId) {
  if (!plainObject(payload)) throw new TypeError("Resposta de link público inválida.");
  const value = payload.public_link ?? payload.publicLink ?? payload.link;
  return normalizePublicLink(value, expectedDocumentId);
}

export function derivePublicLinkCapabilities(permissions) {
  const granted = new Set(
    Array.isArray(permissions)
      ? permissions.filter((permission) => typeof permission === "string")
      : [],
  );
  const manage = granted.has("manage_public_links");
  return Object.freeze({
    read: manage || granted.has("read_public_links"),
    create: manage || granted.has("create_public_link"),
    update: manage,
  });
}

function normalizeSlug(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    normalized.length < 3 ||
    normalized.length > 48 ||
    !SLUG_PATTERN.test(normalized)
  ) {
    throw new TypeError(
      "Slug inválido: use de 3 a 48 caracteres, com letras minúsculas, números e hífens simples entre termos.",
    );
  }
  if (RESERVED_SLUGS.has(normalized)) {
    throw new TypeError(
      `O endereço curto “${normalized}” é reservado. Escolha outro slug.`,
    );
  }
  return normalized;
}

function normalizeListFilters(value) {
  if (!plainObject(value)) {
    throw new TypeError("Filtros de links públicos inválidos.");
  }
  const allowed = new Set(["status", "slug", "documentId"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new TypeError("Filtros de links públicos inválidos.");
  }
  const filters = {};
  if (value.status !== undefined && value.status !== "") {
    if (!LINK_STATUSES.has(value.status)) {
      throw new TypeError("Estado do link público inválido.");
    }
    filters.status = value.status;
  }
  if (value.slug !== undefined && value.slug !== "") {
    filters.slug = normalizeSlug(value.slug);
  }
  if (value.documentId !== undefined && value.documentId !== "") {
    filters.document_id = identifier(value.documentId, "Documento");
  }
  return Object.freeze(filters);
}

function normalizeExpiration(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new TypeError("Expiração inválida.");
  }
  return new Date(value).toISOString();
}

function normalizeCreateInput(value) {
  if (!plainObject(value) || typeof value.allowDownload !== "boolean") {
    throw new TypeError("Configuração do link público inválida.");
  }
  return Object.freeze({
    version_id: identifier(value.versionId, "Versão"),
    slug: normalizeSlug(value.slug),
    expires_at: normalizeExpiration(value.expiresAt),
    allow_download: value.allowDownload,
  });
}

function normalizeUpdateInput(value) {
  if (!plainObject(value) || Object.keys(value).length === 0) {
    throw new TypeError("Alteração do link público inválida.");
  }
  const allowed = new Set(["status", "expiresAt", "allowDownload"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new TypeError("Alteração do link público inválida.");
  }
  const body = {};
  if (Object.hasOwn(value, "status")) {
    if (!LINK_STATUSES.has(value.status)) {
      throw new TypeError("Alteração do link público inválida.");
    }
    body.status = value.status;
  }
  if (Object.hasOwn(value, "expiresAt")) {
    body.expires_at = normalizeExpiration(value.expiresAt);
  }
  if (Object.hasOwn(value, "allowDownload")) {
    if (typeof value.allowDownload !== "boolean") {
      throw new TypeError("Alteração do link público inválida.");
    }
    body.allow_download = value.allowDownload;
  }
  return Object.freeze(body);
}

export function createPublicLinksController(options = {}) {
  const client = options.client;
  const createRequestId =
    options.createRequestId ?? (() => globalThis.crypto.randomUUID());
  if (
    !client ||
    typeof client.request !== "function" ||
    typeof createRequestId !== "function"
  ) {
    throw new TypeError("Dependências obrigatórias dos links públicos estão ausentes.");
  }

  function target(documentId, linkId = null) {
    const base = `/v1/documents/${encodeURIComponent(identifier(documentId, "Documento"))}/public-links`;
    return linkId === null
      ? base
      : `${base}/${encodeURIComponent(identifier(linkId, "Link"))}`;
  }

  function mutationOptions(method, body, requestOptions) {
    const { headers: suppliedHeaders, ...transportOptions } = requestOptions;
    const idempotencyKey = identifier(
      createRequestId(),
      "Chave de idempotência",
    );
    const headers = new Headers(suppliedHeaders);
    headers.set("Idempotency-Key", idempotencyKey);
    return { ...transportOptions, method, body, headers };
  }

  async function listPages(basePath, filters, expectedDocumentId, requestOptions) {
    const items = new Map();
    const seenCursors = new Set();
    let cursor = null;
    do {
      const targetUrl = new URL(basePath, "https://documentos.invalid");
      targetUrl.searchParams.set("limit", "100");
      for (const [name, value] of Object.entries(filters)) {
        targetUrl.searchParams.set(name, value);
      }
      if (cursor !== null) targetUrl.searchParams.set("cursor", cursor);
      const response = await client.request(
        `${targetUrl.pathname}${targetUrl.search}`,
        requestOptions,
      );
      const page = expectedDocumentId === null
        ? normalizeTenantPublicLinksPage(response.data)
        : Object.freeze({
            items: normalizePublicLinksPayload(
              response.data,
              expectedDocumentId,
            ),
            nextCursor: normalizeCursor(
              field(response.data, "nextCursor", "next_cursor"),
            ),
          });
      for (const item of page.items) items.set(item.linkId, item);
      cursor = page.nextCursor;
      if (cursor !== null) {
        if (seenCursors.has(cursor)) {
          throw new TypeError("Paginação de links públicos inválida.");
        }
        seenCursors.add(cursor);
      }
    } while (cursor !== null);
    return Object.freeze([...items.values()]);
  }

  return Object.freeze({
    async list(documentId, requestOptions = {}) {
      const normalizedDocumentId = identifier(documentId, "Documento");
      return listPages(
        target(normalizedDocumentId),
        Object.freeze({}),
        normalizedDocumentId,
        requestOptions,
      );
    },
    async listAll(filters = {}, requestOptions = {}) {
      return listPages(
        "/v1/public-links",
        normalizeListFilters(filters),
        null,
        requestOptions,
      );
    },
    async create(documentId, input, requestOptions = {}) {
      const normalizedDocumentId = identifier(documentId, "Documento");
      const response = await client.request(
        target(normalizedDocumentId),
        mutationOptions("POST", normalizeCreateInput(input), requestOptions),
      );
      return normalizePublicLinkResponse(response.data, normalizedDocumentId);
    },
    async update(documentId, linkId, patch, requestOptions = {}) {
      const normalizedDocumentId = identifier(documentId, "Documento");
      const response = await client.request(
        target(normalizedDocumentId, linkId),
        mutationOptions("PATCH", normalizeUpdateInput(patch), requestOptions),
      );
      return normalizePublicLinkResponse(response.data, normalizedDocumentId);
    },
  });
}
