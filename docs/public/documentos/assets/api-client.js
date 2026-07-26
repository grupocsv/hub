const FORBIDDEN_CLIENT_HEADERS = new Set([
  "authorization",
  "x-auth-token",
  "x-portal",
  "x-tenant-id",
  "x-viewer-ticket",
]);
const FORBIDDEN_CONTEXT_KEYS = new Set([
  "auth_token",
  "portal",
  "tenant",
  "tenant_id",
  "ticket",
  "token",
]);
const PATH_TRAVERSAL_PATTERN = /(?:^|\/)(?:\.{1,2}|%2e(?:%2e)?)(?:\/|$)/i;
const DEFAULT_TIMEOUT_MS = 15_000;
const MAXIMUM_TIMEOUT_MS = 14 * 60 * 1_000;
const VIEWER_BYTES_TARGET =
  /^\/v1\/documents\/[^/?#]+\/versions\/[^/?#]+\/bytes$/u;
const VIEWER_TICKET_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

const ERROR_DEFINITIONS = Object.freeze({
  invalid_request_target: Object.freeze({
    category: "client",
    retriable: false,
  }),
  forbidden_client_context: Object.freeze({
    category: "client",
    retriable: false,
  }),
  forbidden_client_header: Object.freeze({
    category: "client",
    retriable: false,
  }),
  session_required: Object.freeze({
    category: "authentication",
    retriable: false,
  }),
  session_expired: Object.freeze({
    category: "authentication",
    retriable: false,
  }),
  resource_unavailable: Object.freeze({
    category: "neutral",
    retriable: false,
  }),
  conflict: Object.freeze({ category: "conflict", retriable: false }),
  payload_too_large: Object.freeze({
    category: "validation",
    retriable: false,
  }),
  unsupported_media_type: Object.freeze({
    category: "validation",
    retriable: false,
  }),
  invalid_request: Object.freeze({ category: "validation", retriable: false }),
  rate_limited: Object.freeze({ category: "transient", retriable: true }),
  service_unavailable: Object.freeze({
    category: "transient",
    retriable: true,
  }),
  request_timeout: Object.freeze({ category: "timeout", retriable: true }),
  request_aborted: Object.freeze({ category: "abort", retriable: false }),
  network_unavailable: Object.freeze({
    category: "transient",
    retriable: true,
  }),
  unexpected_response: Object.freeze({ category: "server", retriable: false }),
});

const PUBLIC_MESSAGES = Object.freeze({
  invalid_request_target: "A solicitação local é inválida.",
  forbidden_client_context:
    "A solicitação local contém um contexto não permitido.",
  forbidden_client_header:
    "A solicitação local contém um cabeçalho não permitido.",
  session_required: "Entre novamente para acessar os documentos.",
  session_expired: "Sua sessão terminou. Entre novamente para continuar.",
  resource_unavailable: "Não foi possível acessar este conteúdo.",
  conflict: "O conteúdo foi alterado. Atualize os dados e tente novamente.",
  payload_too_large: "O arquivo excede o tamanho permitido.",
  unsupported_media_type: "Este tipo de arquivo não é permitido.",
  invalid_request: "Revise os dados informados e tente novamente.",
  rate_limited: "Há muitas solicitações no momento. Aguarde e tente novamente.",
  service_unavailable: "O serviço está temporariamente indisponível.",
  request_timeout: "A solicitação demorou mais do que o esperado.",
  request_aborted: "A solicitação foi cancelada.",
  network_unavailable: "Não foi possível conectar ao serviço.",
  unexpected_response: "Não foi possível concluir a solicitação.",
});

function definitionFor(code) {
  return ERROR_DEFINITIONS[code] || ERROR_DEFINITIONS.unexpected_response;
}

export class DocumentApiError extends Error {
  constructor({
    status = 0,
    code = "unexpected_response",
    requestId = null,
    retryAfterSeconds = null,
  } = {}) {
    const normalizedCode = Object.hasOwn(ERROR_DEFINITIONS, code)
      ? code
      : "unexpected_response";
    const definition = definitionFor(normalizedCode);
    super(PUBLIC_MESSAGES[normalizedCode]);
    this.name = "DocumentApiError";
    this.status = status;
    this.code = normalizedCode;
    this.category = definition.category;
    this.retriable = definition.retriable;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  toJSON() {
    return {
      name: this.name,
      status: this.status,
      code: this.code,
      category: this.category,
      retriable: this.retriable,
      requestId: this.requestId,
      retryAfterSeconds: this.retryAfterSeconds,
    };
  }
}

function clientError(code) {
  return new DocumentApiError({ code });
}

function normalizeTimeoutMs(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAXIMUM_TIMEOUT_MS) {
    throw clientError("invalid_request");
  }
  return value;
}

function normalizeBaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw clientError("invalid_request_target");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== "/" && parsed.pathname !== "")
  ) {
    throw clientError("invalid_request_target");
  }
  return parsed;
}

function hasForbiddenContext(value, seen = new Set()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value))
    return value.some((item) => hasForbiddenContext(item, seen));
  if (
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    value instanceof Blob
  )
    return false;
  if (typeof FormData !== "undefined" && value instanceof FormData)
    return false;

  return Object.entries(value).some(
    ([key, child]) =>
      FORBIDDEN_CONTEXT_KEYS.has(key.toLowerCase()) ||
      hasForbiddenContext(child, seen),
  );
}

function resolveTarget(baseUrl, target) {
  if (
    typeof target !== "string" ||
    !target.startsWith("/v1/") ||
    target.includes("#") ||
    PATH_TRAVERSAL_PATTERN.test(target)
  ) {
    throw clientError("invalid_request_target");
  }

  let resolved;
  try {
    resolved = new URL(target, baseUrl);
  } catch {
    throw clientError("invalid_request_target");
  }

  if (
    resolved.origin !== baseUrl.origin ||
    !resolved.pathname.startsWith("/v1/")
  ) {
    throw clientError("invalid_request_target");
  }
  for (const key of resolved.searchParams.keys()) {
    if (FORBIDDEN_CONTEXT_KEYS.has(key.toLowerCase())) {
      throw clientError("forbidden_client_context");
    }
  }
  return resolved;
}

function prepareHeaders(
  inputHeaders,
  token,
  hasJsonBody,
  accept = "application/json",
) {
  const headers = new Headers(inputHeaders || {});
  for (const key of headers.keys()) {
    if (FORBIDDEN_CLIENT_HEADERS.has(key.toLowerCase())) {
      throw clientError("forbidden_client_header");
    }
  }
  headers.set("X-Auth-Token", token);
  headers.set("Accept", accept);
  if (hasJsonBody) headers.set("Content-Type", "application/json");
  return headers;
}

function prepareBody(body) {
  if (body === undefined || body === null)
    return { body: undefined, hasJsonBody: false };
  if (hasForbiddenContext(body)) throw clientError("forbidden_client_context");

  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    (typeof FormData !== "undefined" && body instanceof FormData)
  ) {
    return { body, hasJsonBody: false };
  }
  return { body: JSON.stringify(body), hasJsonBody: true };
}

function publicRequestId(response, payload) {
  const bodyValue = payload?.error?.request_id;
  const headerValue = response.headers.get("x-request-id");
  const candidate = typeof bodyValue === "string" ? bodyValue : headerValue;
  return typeof candidate === "string" && candidate.length <= 128
    ? candidate
    : null;
}

function retryAfterSeconds(response) {
  const value = response.headers.get("retry-after");
  if (!value || !/^\d+$/.test(value)) return null;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) ? seconds : null;
}

function codeForStatus(status) {
  if (status === 401) return "session_expired";
  if (status === 403 || status === 404) return "resource_unavailable";
  if (status === 409 || status === 410) return "conflict";
  if (status === 413) return "payload_too_large";
  if (status === 415) return "unsupported_media_type";
  if (status === 400 || status === 411 || status === 422)
    return "invalid_request";
  if (status === 429) return "rate_limited";
  if (status === 503 || status >= 500) return "service_unavailable";
  return "unexpected_response";
}

async function readResponseData(response, responseType) {
  if (response.status === 204 || response.status === 205) return null;
  if (responseType === "response") return response;
  if (responseType === "arrayBuffer") return response.arrayBuffer();
  if (responseType === "blob") return response.blob();
  if (responseType === "text") return response.text();

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function waitForAbortable(operation, signal) {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(operation).then(
      (value) => {
        signal.removeEventListener("abort", abort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", abort);
        reject(error);
      },
    );
  });
}

function createAbortContext(callerSignal, timeoutMs, setTimer, clearTimer) {
  const controller = new AbortController();
  let timedOut = false;
  let callerAborted = false;

  const abortFromCaller = () => {
    callerAborted = true;
    controller.abort(
      callerSignal?.reason || new DOMException("Cancelado", "AbortError"),
    );
  };

  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  const timer = setTimer(() => {
    if (controller.signal.aborted) return;
    timedOut = true;
    controller.abort(new DOMException("Tempo limite", "TimeoutError"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    resultCode() {
      return timedOut
        ? "request_timeout"
        : callerAborted
          ? "request_aborted"
          : "request_aborted";
    },
    dispose() {
      clearTimer(timer);
      callerSignal?.removeEventListener?.("abort", abortFromCaller);
    },
  };
}

export function publicErrorState(error) {
  if (
    error instanceof DocumentApiError &&
    error.code === "resource_unavailable"
  ) {
    return Object.freeze({
      state: "error",
      title: "Conteúdo Indisponível",
      detail: "Não foi possível acessar este conteúdo.",
      canRetry: false,
    });
  }

  const canRetry =
    error instanceof DocumentApiError && error.retriable === true;
  return Object.freeze({
    state: "error",
    title: "Não Foi Possível Carregar",
    detail: canRetry
      ? "Tente novamente em alguns instantes."
      : "Retorne ao Hub e inicie uma nova tentativa.",
    canRetry,
  });
}

export function createDocumentApiClient(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const getSession = options.getSession;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const onUnauthorized = options.onUnauthorized ?? (() => {});
  const timeoutMs = normalizeTimeoutMs(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const setTimer = options.setTimer ?? globalThis.setTimeout;
  const clearTimer = options.clearTimer ?? globalThis.clearTimeout;

  if (typeof getSession !== "function" || typeof fetchImpl !== "function") {
    throw new TypeError(
      "Dependências obrigatórias do cliente documental estão ausentes.",
    );
  }

  async function performRequest(
    target,
    requestOptions = {},
    viewerTicket = null,
  ) {
    const session = getSession();
    if (!session?.token) throw clientError("session_required");

    const url = resolveTarget(baseUrl, target);
    const preparedBody = prepareBody(requestOptions.body);
    const headers = prepareHeaders(
      requestOptions.headers,
      session.token,
      preparedBody.hasJsonBody,
      viewerTicket === null ? "application/json" : "*/*",
    );
    if (viewerTicket !== null) headers.set("X-Viewer-Ticket", viewerTicket);
    const requestTimeoutMs = normalizeTimeoutMs(
      requestOptions.timeoutMs ?? timeoutMs,
    );
    const abortContext = createAbortContext(
      requestOptions.signal,
      requestTimeoutMs,
      setTimer,
      clearTimer,
    );

    try {
      const response = await fetchImpl(url.href, {
        method: requestOptions.method || "GET",
        headers,
        body: preparedBody.body,
        signal: abortContext.signal,
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        referrerPolicy: "strict-origin-when-cross-origin",
      });

      if (response.status === 401) {
        onUnauthorized();
        throw new DocumentApiError({
          status: response.status,
          code: "session_expired",
          requestId: publicRequestId(response, null),
          retryAfterSeconds: retryAfterSeconds(response),
        });
      }

      const data = await waitForAbortable(
        readResponseData(response, requestOptions.responseType || "json"),
        abortContext.signal,
      );
      const requestId = publicRequestId(response, data);

      if (!response.ok) {
        throw new DocumentApiError({
          status: response.status,
          code: codeForStatus(response.status),
          requestId,
          retryAfterSeconds: retryAfterSeconds(response),
        });
      }

      return Object.freeze({
        status: response.status,
        data,
        headers: response.headers,
        requestId,
      });
    } catch (error) {
      if (error instanceof DocumentApiError) throw error;
      const code = abortContext.signal.aborted
        ? abortContext.resultCode()
        : "network_unavailable";
      throw new DocumentApiError({ code });
    } finally {
      abortContext.dispose();
    }
  }

  function request(target, requestOptions = {}) {
    return performRequest(target, requestOptions);
  }

  async function requestViewerBytes(target, requestOptions = {}) {
    const method = requestOptions.method || "GET";
    if (
      typeof target !== "string" ||
      !VIEWER_BYTES_TARGET.test(target) ||
      (method !== "GET" && method !== "HEAD") ||
      requestOptions.body !== undefined ||
      !VIEWER_TICKET_PATTERN.test(requestOptions.viewerTicket ?? "")
    ) {
      throw clientError("invalid_request_target");
    }
    const { viewerTicket, ...safeOptions } = requestOptions;
    return performRequest(target, { ...safeOptions, method }, viewerTicket);
  }

  return Object.freeze({ request, requestViewerBytes });
}
