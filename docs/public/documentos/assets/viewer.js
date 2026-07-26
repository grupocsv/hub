import { DocumentApiError, publicErrorState } from "./api-client.js";

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const MAX_IDENTIFIER_LENGTH = 256;
const DEFAULT_MAX_TEXT_BYTES = 2 * 1024 * 1024;
const DEFAULT_RANGE_CHUNK_SIZE = 64 * 1024;
const VIEWER_TICKET_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MARKDOWN_MIMES = new Set(["text/markdown"]);
const TEXT_MIMES = new Set(["text/plain"]);

function plainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function identifier(value, name = "Identificador") {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_IDENTIFIER_LENGTH ||
    value !== value.trim() ||
    value.includes("/") ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new TypeError(`${name} inválido.`);
  }
  return value;
}

function pageNumber(value) {
  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized < 1) {
    throw new TypeError("Página inválida.");
  }
  return normalized;
}

function fileName(value, fallback) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 255 ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    /[/\\]/u.test(value)
  ) {
    return fallback;
  }
  return value;
}

function publicTitle(value) {
  if (typeof value !== "string" || CONTROL_CHARACTER_PATTERN.test(value))
    return "Documento";
  const normalized = value.trim().slice(0, 500);
  return normalized || "Documento";
}

function mimeEssence(value) {
  if (typeof value !== "string") return "";
  return value.split(";", 1)[0].trim().toLowerCase();
}

function frozenState(value) {
  return Object.freeze({ ...value });
}

function viewerUnavailableError() {
  return new DocumentApiError({ code: "resource_unavailable" });
}

function viewerErrorState(error) {
  const state = publicErrorState(error);
  return Object.freeze({
    status: state.state,
    title: state.title,
    detail: state.detail,
    canRetry: state.canRetry,
  });
}

export function formatViewerFragment(documentId, page = 1) {
  const params = new URLSearchParams();
  params.set("document", identifier(documentId, "Documento"));
  params.set("page", String(pageNumber(page)));
  return `#${params.toString()}`;
}

export function parseViewerFragment(hash) {
  if (typeof hash !== "string" || hash === "" || hash === "#") return null;
  const source = hash.startsWith("#") ? hash.slice(1) : null;
  if (source === null || source.length === 0 || source.length > 2048)
    return null;

  let params;
  try {
    params = new URLSearchParams(source);
  } catch {
    return null;
  }
  const keys = [...params.keys()];
  if (
    keys.length !== 2 ||
    keys.filter((key) => key === "document").length !== 1 ||
    keys.filter((key) => key === "page").length !== 1
  ) {
    return null;
  }
  try {
    return Object.freeze({
      documentId: identifier(params.get("document"), "Documento"),
      page: pageNumber(params.get("page")),
    });
  } catch {
    return null;
  }
}

export function createViewerRouteController(options = {}) {
  const locationRef = options.locationRef ?? globalThis.location;
  const historyRef = options.historyRef ?? globalThis.history;
  const eventTarget = options.eventTarget ?? globalThis.window;
  const onOpen = options.onOpen;
  const onClose = options.onClose;
  if (
    !locationRef ||
    typeof historyRef?.pushState !== "function" ||
    typeof historyRef?.replaceState !== "function" ||
    typeof eventTarget?.addEventListener !== "function" ||
    typeof eventTarget?.removeEventListener !== "function" ||
    typeof onOpen !== "function" ||
    typeof onClose !== "function"
  ) {
    throw new TypeError("Dependências da rota do viewer estão ausentes.");
  }

  let started = false;
  let destroyed = false;
  let current = null;
  let ownsHistoryEntry = false;
  let navigationGeneration = 0;

  function baseUrl() {
    const pathname =
      typeof locationRef.pathname === "string" && locationRef.pathname
        ? locationRef.pathname
        : "/documentos/";
    const search =
      typeof locationRef.search === "string" ? locationRef.search : "";
    return `${pathname}${search}`;
  }

  function replace(fragment = "") {
    historyRef.replaceState(historyRef.state, "", `${baseUrl()}${fragment}`);
  }

  function push(fragment) {
    historyRef.pushState(historyRef.state, "", `${baseUrl()}${fragment}`);
  }

  async function synchronize() {
    if (destroyed) return null;
    navigationGeneration += 1;
    const parsed = parseViewerFragment(locationRef.hash);
    if (!parsed) {
      if (typeof locationRef.hash === "string" && locationRef.hash.length > 0) {
        replace();
      }
      if (current) {
        current = null;
        ownsHistoryEntry = false;
        await onClose();
      }
      return null;
    }
    current = parsed;
    await onOpen(parsed);
    return parsed;
  }

  const handleHashChange = () => synchronize();

  return Object.freeze({
    async start() {
      if (destroyed) throw new TypeError("Rota do viewer encerrada.");
      if (!started) {
        started = true;
        eventTarget.addEventListener("hashchange", handleHashChange);
      }
      return synchronize();
    },
    async open(documentId, page = 1) {
      if (destroyed) return null;
      navigationGeneration += 1;
      const parsed = Object.freeze({
        documentId: identifier(documentId, "Documento"),
        page: pageNumber(page),
      });
      const alreadyOpen = Boolean(current);
      current = parsed;
      const fragment = formatViewerFragment(parsed.documentId, parsed.page);
      if (alreadyOpen) replace(fragment);
      else {
        push(fragment);
        ownsHistoryEntry = true;
      }
      await onOpen(parsed);
      return parsed;
    },
    setPage(page) {
      if (destroyed || !current) return null;
      current = Object.freeze({ ...current, page: pageNumber(page) });
      replace(formatViewerFragment(current.documentId, current.page));
      return current;
    },
    async close() {
      if (destroyed) return;
      const closeGeneration = ++navigationGeneration;
      const hadCurrent = Boolean(current);
      const shouldReturnToPreviousEntry =
        ownsHistoryEntry && typeof historyRef.back === "function";
      current = null;
      ownsHistoryEntry = false;
      // Limpa o fragmento antes de fechar a apresentação. Assim, qualquer
      // observador que veja o viewer fechado já vê também uma URL sem o
      // identificador documental, mesmo quando history.back() é assíncrono.
      replace();
      if (hadCurrent) await onClose();
      if (
        shouldReturnToPreviousEntry &&
        closeGeneration === navigationGeneration &&
        current === null
      ) {
        historyRef.back();
      }
    },
    current: () => current,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      navigationGeneration += 1;
      current = null;
      ownsHistoryEntry = false;
      if (started)
        eventTarget.removeEventListener("hashchange", handleHashChange);
    },
  });
}

function readyVersion(value) {
  return (
    plainObject(value) &&
    typeof value.versionId === "string" &&
    value.uploadStatus === "uploaded" &&
    value.securityStatus === "clean" &&
    typeof value.mimeDetected === "string" &&
    value.mimeDetected.length > 0 &&
    Number.isSafeInteger(value.sizeBytes) &&
    value.sizeBytes >= 0
  );
}

function versionOrder(value) {
  return Number.isSafeInteger(value?.versionNumber) ? value.versionNumber : 0;
}

export function selectViewerVersion(document, versions) {
  if (!plainObject(document) || !Array.isArray(versions)) return null;
  const eligible = versions.filter(readyVersion);
  if (eligible.length === 0) return null;
  if (typeof document.currentVersionId === "string") {
    const current = eligible.find(
      (version) => version.versionId === document.currentVersionId,
    );
    return current ?? null;
  }
  return [...eligible].sort(
    (left, right) => versionOrder(right) - versionOrder(left),
  )[0];
}

export function classifyViewerMime(value) {
  const mime = mimeEssence(value);
  if (mime === "application/pdf") return "pdf";
  if (ALLOWED_IMAGE_MIMES.has(mime)) return "image";
  if (MARKDOWN_MIMES.has(mime)) return "markdown";
  if (TEXT_MIMES.has(mime)) return "text";
  return "unsupported";
}

function freezeMarkdownBlock(block) {
  if (Array.isArray(block.items)) {
    return Object.freeze({ ...block, items: Object.freeze([...block.items]) });
  }
  return Object.freeze({ ...block });
}

export function parseSafeMarkdown(source) {
  if (typeof source !== "string") throw new TypeError("Markdown inválido.");
  const lines = source.replace(/\r\n?/gu, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (/^```/u.test(line)) {
      index += 1;
      const code = [];
      while (index < lines.length && !/^```/u.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(freezeMarkdownBlock({ type: "code", text: code.join("\n") }));
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/u.exec(line);
    if (heading) {
      blocks.push(
        freezeMarkdownBlock({
          type: "heading",
          level: heading[1].length,
          text: heading[2],
        }),
      );
      index += 1;
      continue;
    }

    const listMatch = /^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/u.exec(line);
    if (listMatch) {
      const ordered = /^\d/u.test(line);
      const items = [];
      while (index < lines.length) {
        const current = /^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/u.exec(lines[index]);
        if (!current || /^\d/u.test(lines[index]) !== ordered) break;
        items.push(current[1]);
        index += 1;
      }
      blocks.push(freezeMarkdownBlock({ type: "list", ordered, items }));
      continue;
    }

    if (/^>\s?/u.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/u.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/u, ""));
        index += 1;
      }
      blocks.push(
        freezeMarkdownBlock({ type: "quote", text: quote.join("\n") }),
      );
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^```/u.test(lines[index]) &&
      !/^(#{1,6})\s+/u.test(lines[index]) &&
      !/^(?:[-*+]\s+|\d+[.)]\s+)/u.test(lines[index]) &&
      !/^>\s?/u.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(
      freezeMarkdownBlock({ type: "paragraph", text: paragraph.join("\n") }),
    );
  }

  return Object.freeze(blocks);
}

export function createAuthenticatedPdfRangeTransport(options = {}) {
  const BaseTransport = options.PDFDataRangeTransport;
  const length = options.length;
  const requestRange = options.requestRange;
  const onError = options.onError ?? (() => {});
  if (
    typeof BaseTransport !== "function" ||
    !Number.isSafeInteger(length) ||
    length <= 0 ||
    typeof requestRange !== "function" ||
    typeof onError !== "function"
  ) {
    throw new TypeError("Dependências do transporte PDF inválidas.");
  }

  class AuthenticatedRangeTransport extends BaseTransport {
    constructor() {
      super(length, null, true);
      this.closed = false;
    }

    requestDataRange(begin, end) {
      if (
        this.closed ||
        !Number.isSafeInteger(begin) ||
        !Number.isSafeInteger(end) ||
        begin < 0 ||
        end <= begin ||
        end > length
      ) {
        return;
      }
      Promise.resolve(requestRange(begin, end)).then(
        (value) => {
          if (this.closed) return;
          const bytes =
            value instanceof Uint8Array
              ? value
              : value instanceof ArrayBuffer
                ? new Uint8Array(value)
                : ArrayBuffer.isView(value)
                  ? new Uint8Array(
                      value.buffer,
                      value.byteOffset,
                      value.byteLength,
                    )
                  : null;
          if (!bytes || bytes.byteLength !== end - begin) {
            onError(new TypeError("Intervalo PDF inválido."));
            return;
          }
          this.onDataRange(begin, bytes);
        },
        (error) => {
          if (!this.closed) onError(error);
        },
      );
    }

    abort() {
      this.closed = true;
    }
  }

  return new AuthenticatedRangeTransport();
}

async function importPdfJs() {
  return import("../vendor/pdfjs/build/pdf.min.mjs");
}

async function defaultLoadPdf(options) {
  const pdfjs = await importPdfJs();
  if (
    typeof pdfjs?.getDocument !== "function" ||
    typeof pdfjs?.PDFDataRangeTransport !== "function"
  ) {
    throw new TypeError("PDF.js indisponível.");
  }
  if (typeof options.renderPdfPage !== "function") {
    throw new TypeError("Renderizador PDF indisponível.");
  }

  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "../vendor/pdfjs/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
  }
  const pdfjsAssets = new URL("../vendor/pdfjs/", import.meta.url);

  let transportError = null;
  let loadingTask = null;
  let documentProxy = null;
  let activeRender = null;
  const transport = createAuthenticatedPdfRangeTransport({
    PDFDataRangeTransport: pdfjs.PDFDataRangeTransport,
    length: options.length,
    requestRange: options.requestRange,
    onError(error) {
      transportError = error;
      loadingTask?.destroy?.();
    },
  });

  loadingTask = pdfjs.getDocument({
    range: transport,
    length: options.length,
    rangeChunkSize: options.rangeChunkSize,
    disableAutoFetch: true,
    disableStream: true,
    disableRange: false,
    enableXfa: false,
    isEvalSupported: false,
    stopAtErrors: true,
    cMapUrl: new URL("cmaps/", pdfjsAssets).href,
    cMapPacked: true,
    iccUrl: new URL("iccs/", pdfjsAssets).href,
    standardFontDataUrl: new URL("standard_fonts/", pdfjsAssets).href,
    wasmUrl: new URL("wasm/", pdfjsAssets).href,
  });
  try {
    documentProxy = await loadingTask.promise;
  } catch (error) {
    throw transportError ?? error;
  }

  return Object.freeze({
    pageCount: documentProxy.numPages,
    async renderPage(number) {
      activeRender?.cancel?.();
      const page = await documentProxy.getPage(number);
      activeRender = await options.renderPdfPage({
        page,
        pageNumber: number,
        pageCount: documentProxy.numPages,
        signal: options.signal,
      });
      return activeRender;
    },
    async destroy() {
      activeRender?.cancel?.();
      transport.abort();
      await loadingTask?.destroy?.();
      await documentProxy?.destroy?.();
    },
  });
}

function defaultTriggerDownload(url, name) {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
}

function defaultScheduleRevocation(callback) {
  return globalThis.setTimeout(callback, 0);
}

function normalizeTicket(payload, now) {
  const value = payload?.viewer_ticket;
  if (
    !plainObject(value) ||
    typeof value.token !== "string" ||
    !VIEWER_TICKET_PATTERN.test(value.token) ||
    typeof value.expires_at !== "string"
  ) {
    throw viewerUnavailableError();
  }
  const expiresAt = Date.parse(value.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= now())
    throw viewerUnavailableError();
  return Object.freeze({ token: value.token, expiresAt });
}

function byteLength(headers) {
  const raw = headers?.get?.("content-length");
  if (typeof raw !== "string" || !/^\d+$/u.test(raw))
    throw viewerUnavailableError();
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) throw viewerUnavailableError();
  return value;
}

function responseMetadata(response) {
  const mimeType = mimeEssence(response?.headers?.get?.("content-type"));
  const length = byteLength(response?.headers);
  const etag = response?.headers?.get?.("etag");
  const acceptRanges = response?.headers?.get?.("accept-ranges");
  if (
    !mimeType ||
    typeof etag !== "string" ||
    etag.length === 0 ||
    acceptRanges?.toLowerCase() !== "bytes"
  ) {
    throw viewerUnavailableError();
  }
  return Object.freeze({ mimeType, length, etag, acceptRanges });
}

function contentMetadata(response) {
  if (response?.status !== 200) throw viewerUnavailableError();
  return responseMetadata(response);
}

function validateRepresentation(response, expected, options = {}) {
  const status = options.status ?? 200;
  const length = options.length ?? expected.length;
  if (response?.status !== status) throw viewerUnavailableError();
  const actual = responseMetadata(response);
  if (
    actual.mimeType !== expected.mimeType ||
    actual.length !== length ||
    actual.etag !== expected.etag
  ) {
    throw viewerUnavailableError();
  }
  return actual;
}

function contextIsActive(context, active, generation) {
  return (
    active === context &&
    context.generation === generation &&
    !context.controller.signal.aborted
  );
}

export function createDocumentViewerController(options = {}) {
  const client = options.client;
  const onState = options.onState ?? (() => {});
  const loadPdf = options.loadPdf ?? defaultLoadPdf;
  const renderPdfPage = options.renderPdfPage;
  const now = options.now ?? Date.now;
  const createObjectURL =
    options.createObjectURL ??
    ((value) => {
      if (typeof URL?.createObjectURL !== "function")
        throw new TypeError("Object URL indisponível.");
      return URL.createObjectURL(value);
    });
  const revokeObjectURL =
    options.revokeObjectURL ??
    ((value) => {
      URL?.revokeObjectURL?.(value);
    });
  const triggerDownload = options.triggerDownload ?? defaultTriggerDownload;
  const scheduleRevocation =
    options.scheduleRevocation ?? defaultScheduleRevocation;
  const setTimer = options.setTimer ?? globalThis.setTimeout;
  const clearTimer = options.clearTimer ?? globalThis.clearTimeout;
  const maxTextBytes = options.maxTextBytes ?? DEFAULT_MAX_TEXT_BYTES;
  const rangeChunkSize = options.rangeChunkSize ?? DEFAULT_RANGE_CHUNK_SIZE;

  if (
    !client ||
    typeof client.request !== "function" ||
    typeof client.requestViewerBytes !== "function" ||
    typeof onState !== "function" ||
    typeof loadPdf !== "function" ||
    typeof now !== "function" ||
    typeof createObjectURL !== "function" ||
    typeof revokeObjectURL !== "function" ||
    typeof triggerDownload !== "function" ||
    typeof scheduleRevocation !== "function" ||
    typeof setTimer !== "function" ||
    typeof clearTimer !== "function" ||
    !Number.isSafeInteger(maxTextBytes) ||
    maxTextBytes <= 0 ||
    !Number.isSafeInteger(rangeChunkSize) ||
    rangeChunkSize <= 0
  ) {
    throw new TypeError("Dependências obrigatórias do viewer estão ausentes.");
  }

  let generation = 0;
  let active = null;
  let destroyed = false;
  const pendingReleases = new Set();

  function emit(state) {
    if (!destroyed) onState(frozenState(state));
  }

  function pathFor(context, resource) {
    return `/v1/documents/${encodeURIComponent(context.documentId)}/versions/${encodeURIComponent(context.versionId)}/${resource}`;
  }

  async function release(context) {
    if (!context) return;
    context.pageGeneration += 1;
    context.controller.abort();
    if (context.ticketExpiryTimer !== null) {
      clearTimer(context.ticketExpiryTimer);
      context.ticketExpiryTimer = null;
    }
    context.ticket = null;
    if (context.objectUrl) {
      revokeObjectURL(context.objectUrl);
      context.objectUrl = null;
    }
    for (const url of context.transientUrls) revokeObjectURL(url);
    context.transientUrls.clear();
    const pdf = context.pdf;
    context.pdf = null;
    try {
      await pdf?.destroy?.();
    } catch {
      // O contexto já foi invalidado; uma falha tardia de descarte não pode vazar.
    }
  }

  function beginRelease(context) {
    const pending = release(context);
    pendingReleases.add(pending);
    void pending.then(
      () => pendingReleases.delete(pending),
      () => pendingReleases.delete(pending),
    );
    return pending;
  }

  function replaceActive() {
    const previous = active;
    active = null;
    generation += 1;
    return beginRelease(previous);
  }

  async function issueTicket(context) {
    const response = await client.request(pathFor(context, "viewer-tickets"), {
      method: "POST",
      signal: context.controller.signal,
    });
    if (!contextIsActive(context, active, generation))
      throw viewerUnavailableError();
    const ticket = normalizeTicket(response?.data, now);
    if (context.ticketExpiryTimer !== null)
      clearTimer(context.ticketExpiryTimer);
    context.ticket = ticket;
    const delay = Math.max(0, ticket.expiresAt - now());
    context.ticketExpiryTimer = setTimer(() => {
      if (context.ticket === ticket) context.ticket = null;
      context.ticketExpiryTimer = null;
    }, delay);
    context.ticketExpiryTimer?.unref?.();
    return ticket;
  }

  async function requireTicket(context) {
    if (!contextIsActive(context, active, generation))
      throw viewerUnavailableError();
    if (context.ticket && context.ticket.expiresAt > now())
      return context.ticket.token;
    if (context.ticketExpiryTimer !== null) {
      clearTimer(context.ticketExpiryTimer);
      context.ticketExpiryTimer = null;
    }
    context.ticket = null;
    if (!context.ticketRefresh) {
      context.ticketRefresh = issueTicket(context).finally(() => {
        context.ticketRefresh = null;
      });
    }
    const ticket = await context.ticketRefresh;
    return ticket.token;
  }

  async function requestBytes(context, requestOptions = {}) {
    const token = await requireTicket(context);
    return client.requestViewerBytes(pathFor(context, "bytes"), {
      ...requestOptions,
      viewerTicket: token,
      signal: context.controller.signal,
    });
  }

  async function requestRange(context, begin, end) {
    if (
      !Number.isSafeInteger(begin) ||
      !Number.isSafeInteger(end) ||
      begin < 0 ||
      end <= begin ||
      end > context.metadata.length
    ) {
      throw new TypeError("Intervalo PDF inválido.");
    }
    const response = await requestBytes(context, {
      method: "GET",
      headers: {
        Range: `bytes=${begin}-${end - 1}`,
        "If-Range": context.metadata.etag,
      },
      responseType: "arrayBuffer",
    });
    if (response?.status !== 206 || !(response.data instanceof ArrayBuffer)) {
      throw viewerUnavailableError();
    }
    const expectedRange = `bytes ${begin}-${end - 1}/${context.metadata.length}`;
    validateRepresentation(response, context.metadata, {
      status: 206,
      length: end - begin,
    });
    if (
      response.headers?.get?.("content-range") !== expectedRange ||
      response.data.byteLength !== end - begin
    ) {
      throw viewerUnavailableError();
    }
    return new Uint8Array(response.data);
  }

  async function renderPdf(context, requestedPage) {
    const selected = Math.min(pageNumber(requestedPage), context.pdf.pageCount);
    const pageGeneration = ++context.pageGeneration;
    try {
      await context.pdf.renderPage(selected);
    } catch (error) {
      if (pageGeneration !== context.pageGeneration) return null;
      throw error;
    }
    if (
      !contextIsActive(context, active, generation) ||
      pageGeneration !== context.pageGeneration
    ) {
      return null;
    }
    context.page = selected;
    emit({
      status: "ready",
      kind: "pdf",
      title: context.title,
      page: selected,
      pageCount: context.pdf.pageCount,
      canDownload: true,
    });
    return selected;
  }

  async function open(input = {}) {
    if (destroyed) throw new TypeError("Viewer encerrado.");
    void replaceActive();
    const context = {
      generation,
      documentId: identifier(input.documentId, "Documento"),
      versionId: identifier(input.versionId, "Versão"),
      title: publicTitle(input.title),
      fileName: fileName(input.fileName, "documento"),
      requestedPage: pageNumber(input.page ?? 1),
      controller: new AbortController(),
      ticket: null,
      ticketRefresh: null,
      ticketExpiryTimer: null,
      metadata: null,
      objectUrl: null,
      transientUrls: new Set(),
      pdf: null,
      page: 1,
      pageGeneration: 0,
    };
    active = context;
    emit({
      status: "loading",
      title: "Carregando Conteúdo",
      detail: "Aguarde.",
    });

    try {
      await issueTicket(context);
      const head = await requestBytes(context, {
        method: "HEAD",
        responseType: "response",
      });
      if (!contextIsActive(context, active, generation)) return null;
      context.metadata = contentMetadata(head);
      const kind = classifyViewerMime(context.metadata.mimeType);

      if (kind === "pdf") {
        if (
          context.metadata.length <= 0 ||
          context.metadata.acceptRanges?.toLowerCase() !== "bytes"
        ) {
          throw viewerUnavailableError();
        }
        context.pdf = await loadPdf({
          length: context.metadata.length,
          rangeChunkSize,
          signal: context.controller.signal,
          renderPdfPage,
          requestRange: (begin, end) => requestRange(context, begin, end),
        });
        if (
          !contextIsActive(context, active, generation) ||
          !context.pdf ||
          !Number.isSafeInteger(context.pdf.pageCount) ||
          context.pdf.pageCount < 1 ||
          typeof context.pdf.renderPage !== "function"
        ) {
          throw viewerUnavailableError();
        }
        return renderPdf(context, context.requestedPage);
      }

      if (kind === "image") {
        const response = await requestBytes(context, {
          method: "GET",
          responseType: "blob",
        });
        if (
          !contextIsActive(context, active, generation) ||
          !(response?.data instanceof Blob)
        ) {
          return null;
        }
        validateRepresentation(response, context.metadata);
        if (
          response.data.size !== context.metadata.length ||
          mimeEssence(response.data.type) !== context.metadata.mimeType
        ) {
          throw viewerUnavailableError();
        }
        context.objectUrl = createObjectURL(response.data);
        emit({
          status: "ready",
          kind,
          title: context.title,
          objectUrl: context.objectUrl,
          page: 1,
          pageCount: 1,
          canDownload: true,
        });
        return frozenState({ kind, page: 1 });
      }

      if (kind === "text" || kind === "markdown") {
        if (context.metadata.length > maxTextBytes) {
          emit({
            status: "ready",
            kind: "unsupported",
            title: context.title,
            detail:
              "O conteúdo é grande demais para visualização segura no navegador.",
            canDownload: true,
          });
          return frozenState({ kind: "unsupported" });
        }
        const response = await requestBytes(context, {
          method: "GET",
          responseType: "arrayBuffer",
        });
        if (
          !contextIsActive(context, active, generation) ||
          !(response?.data instanceof ArrayBuffer)
        ) {
          return null;
        }
        validateRepresentation(response, context.metadata);
        if (
          response.data.byteLength !== context.metadata.length ||
          response.data.byteLength > maxTextBytes
        ) {
          throw viewerUnavailableError();
        }
        let text;
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(
            response.data,
          );
        } catch {
          throw viewerUnavailableError();
        }
        emit(
          kind === "markdown"
            ? {
                status: "ready",
                kind,
                title: context.title,
                blocks: parseSafeMarkdown(text),
                canDownload: true,
              }
            : {
                status: "ready",
                kind,
                title: context.title,
                text,
                canDownload: true,
              },
        );
        return frozenState({ kind });
      }

      emit({
        status: "ready",
        kind: "unsupported",
        title: context.title,
        detail:
          "Este tipo de arquivo não possui visualização segura no navegador.",
        canDownload: true,
      });
      return frozenState({ kind: "unsupported" });
    } catch (error) {
      if (!contextIsActive(context, active, generation)) return null;
      await release(context);
      active = null;
      emit(viewerErrorState(error));
      return null;
    }
  }

  async function goToPage(value) {
    const context = active;
    if (!context?.pdf || destroyed) return null;
    try {
      return await renderPdf(context, value);
    } catch (error) {
      if (!contextIsActive(context, active, generation)) return null;
      await release(context);
      active = null;
      emit(viewerErrorState(error));
      return null;
    }
  }

  async function download() {
    const context = active;
    if (!context || destroyed) return null;
    try {
      const response = await requestBytes(context, {
        method: "GET",
        responseType: "blob",
      });
      if (
        !contextIsActive(context, active, generation) ||
        !(response?.data instanceof Blob)
      ) {
        return null;
      }
      validateRepresentation(response, context.metadata);
      if (
        response.data.size !== context.metadata.length ||
        mimeEssence(response.data.type) !== context.metadata.mimeType
      ) {
        throw viewerUnavailableError();
      }
      const url = createObjectURL(response.data);
      context.transientUrls.add(url);
      try {
        triggerDownload(url, context.fileName);
      } finally {
        scheduleRevocation(() => {
          if (!context.transientUrls.delete(url)) return;
          revokeObjectURL(url);
        });
      }
      return true;
    } catch (error) {
      if (contextIsActive(context, active, generation))
        emit(viewerErrorState(error));
      return null;
    }
  }

  async function close() {
    if (destroyed) return;
    const released = replaceActive();
    emit({ status: "closed" });
    await released;
  }

  async function destroy() {
    if (destroyed) return;
    const released = replaceActive();
    destroyed = true;
    await released;
    await Promise.all([...pendingReleases]);
  }

  return Object.freeze({
    open,
    goToPage,
    download,
    close,
    destroy,
    hasActiveTicket: () => Boolean(active?.ticket),
  });
}
