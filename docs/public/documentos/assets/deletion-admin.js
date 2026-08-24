const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const ACTIONS = new Set(["approve", "reject", "cancel"]);
const STATUSES = new Set([
  "requested",
  "pending",
  "approved",
  "executed",
  "rejected",
  "cancelled",
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

function actorIdentifier(value) {
  if (typeof value === "string" && value.length > 0) {
    return identifier(value, "Solicitante");
  }
  if (plainObject(value)) {
    return identifier(field(value, "id", "id"), "Solicitante");
  }
  return null;
}

function normalizeDeletionRequest(value) {
  if (!plainObject(value)) throw new TypeError("Solicitação de exclusão inválida.");
  const status = field(value, "status", "status");
  const reason = field(value, "reason", "reason");
  const requestedAt =
    field(value, "requestedAt", "requested_at") ??
    field(value, "createdAt", "created_at");
  if (
    !STATUSES.has(status) ||
    typeof reason !== "string" ||
    reason.length === 0 ||
    typeof requestedAt !== "string" ||
    !Number.isFinite(Date.parse(requestedAt))
  ) {
    throw new TypeError("Solicitação de exclusão inválida.");
  }
  const documentTitle = field(value, "documentTitle", "document_title");
  const requestedBy = field(value, "requestedBy", "requested_by");
  return Object.freeze({
    requestId: identifier(field(value, "requestId", "request_id"), "Solicitação"),
    documentId: identifier(field(value, "documentId", "document_id"), "Documento"),
    documentTitle:
      typeof documentTitle === "string" && documentTitle.length > 0
        ? documentTitle
        : "Documento sem título disponível",
    reason,
    status,
    requestedAt,
    requestedBy: actorIdentifier(requestedBy),
  });
}

export function normalizeDeletionRequestsPayload(payload) {
  if (!plainObject(payload) || !Array.isArray(payload.items)) {
    throw new TypeError("Resposta de solicitações de exclusão inválida.");
  }
  return Object.freeze(payload.items.map(normalizeDeletionRequest));
}

function normalizeCursor(value) {
  if (value === null || value === undefined || value === "") return null;
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    value !== value.trim() ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new TypeError("Cursor de solicitações de exclusão inválido.");
  }
  return value;
}

export function normalizeDeletionRequestsPage(payload) {
  const items = normalizeDeletionRequestsPayload(payload);
  return Object.freeze({
    items,
    nextCursor: normalizeCursor(
      field(payload, "nextCursor", "next_cursor"),
    ),
  });
}

export function deriveDeletionAdminCapabilities(permissions) {
  const granted = new Set(
    Array.isArray(permissions)
      ? permissions.filter((permission) => typeof permission === "string")
      : [],
  );
  const manage = granted.has("manage_deletion_requests");
  const review = manage || granted.has("review_deletion_requests");
  const cancel = manage || granted.has("cancel_deletion_request");
  return Object.freeze({
    read: review || cancel || granted.has("read_deletion_requests"),
    review,
    cancel,
  });
}

export function createDeletionAdminController(options = {}) {
  const client = options.client;
  const createRequestId =
    options.createRequestId ?? (() => globalThis.crypto.randomUUID());
  if (
    !client ||
    typeof client.request !== "function" ||
    typeof createRequestId !== "function"
  ) {
    throw new TypeError("Dependências obrigatórias da administração de exclusões estão ausentes.");
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

  return Object.freeze({
    async list(requestOptions = {}) {
      const items = new Map();
      const seenCursors = new Set();
      let cursor = null;
      do {
        const targetUrl = new URL(
          "https://documentos.invalid/v1/deletion-requests",
        );
        if (cursor !== null) targetUrl.searchParams.set("cursor", cursor);
        const response = await client.request(
          `${targetUrl.pathname}${targetUrl.search}`,
          requestOptions,
        );
        const page = normalizeDeletionRequestsPage(response.data);
        for (const item of page.items) items.set(item.requestId, item);
        cursor = page.nextCursor;
        if (cursor !== null) {
          if (seenCursors.has(cursor)) {
            throw new TypeError("Paginação de solicitações de exclusão inválida.");
          }
          seenCursors.add(cursor);
        }
      } while (cursor !== null);
      return Object.freeze([...items.values()]);
    },
    async decide(requestId, action, requestOptions = {}) {
      const normalizedId = identifier(requestId, "Solicitação");
      if (!ACTIONS.has(action)) throw new TypeError("Ação de exclusão inválida.");
      const response = await client.request(
        `/v1/deletion-requests/${encodeURIComponent(normalizedId)}/${action}`,
        mutationOptions("POST", {}, requestOptions),
      );
      const value = response.data?.request ?? response.data?.deletion_request;
      return normalizeDeletionRequest(value);
    },
  });
}
