import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DocumentApiError } from "../../docs/public/documentos/assets/api-client.js";
import {
  classifyViewerMime,
  createAuthenticatedPdfRangeTransport,
  createDocumentViewerController,
  createViewerRouteController,
  formatViewerFragment,
  parseSafeMarkdown,
  parseViewerFragment,
  selectViewerVersion,
} from "../../docs/public/documentos/assets/viewer.js";

const TICKET_A = "A".repeat(43);
const TICKET_B = "B".repeat(43);
const TICKET_C = "C".repeat(43);

function headers(values = {}) {
  return new Headers(values);
}

function ticketResponse(
  token = TICKET_A,
  expiresAt = "2026-07-25T22:02:00.000Z",
) {
  return {
    status: 201,
    data: {
      viewer_ticket: {
        token,
        expires_at: expiresAt,
      },
    },
    headers: headers({ "content-type": "application/json" }),
  };
}

function headResponse(contentType, size = 32, etag = '"viewer-etag"') {
  return {
    status: 200,
    data: null,
    headers: headers({
      "accept-ranges": "bytes",
      "content-length": String(size),
      "content-type": contentType,
      etag,
    }),
  };
}

function fullBlobResponse(contentType, bytes, etag = '"viewer-etag"') {
  const data = new Blob([Uint8Array.from(bytes)], { type: contentType });
  return {
    status: 200,
    data,
    headers: headers({
      "accept-ranges": "bytes",
      "content-length": String(data.size),
      "content-type": contentType,
      etag,
    }),
  };
}

function fullBytesResponse(contentType, bytes, etag = '"viewer-etag"') {
  const data = Uint8Array.from(bytes).buffer;
  return {
    status: 200,
    data,
    headers: headers({
      "accept-ranges": "bytes",
      "content-length": String(data.byteLength),
      "content-type": contentType,
      etag,
    }),
  };
}

function rangeResponse({
  begin = 0,
  end = 4,
  total = 120,
  contentType = "application/pdf",
  etag = '"viewer-etag"',
} = {}) {
  const data = Uint8Array.from(
    { length: end - begin },
    (_, offset) => begin + offset,
  ).buffer;
  return {
    status: 206,
    data,
    headers: headers({
      "accept-ranges": "bytes",
      "content-length": String(end - begin),
      "content-range": `bytes ${begin}-${end - 1}/${total}`,
      "content-type": contentType,
      etag,
    }),
  };
}

function createSequencedClient(sequence) {
  const calls = [];
  const client = {
    calls,
    async request(target, options = {}) {
      calls.push({ target, options });
      if (sequence.length === 0) throw new Error("Request inesperado.");
      const next = sequence.shift();
      if (next instanceof Error) throw next;
      return typeof next === "function" ? next(target, options) : next;
    },
  };
  client.requestViewerBytes = (target, options = {}) =>
    client.request(target, options);
  return client;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("fragmento canônico guarda somente documento e página e rejeita contexto sensível", () => {
  assert.equal(
    formatViewerFragment("documento opaco:1", 7),
    "#document=documento+opaco%3A1&page=7",
  );
  assert.deepEqual(
    parseViewerFragment("#document=documento+opaco%3A1&page=7"),
    {
      documentId: "documento opaco:1",
      page: 7,
    },
  );
  assert.throws(() => formatViewerFragment("documento/indevido", 1), TypeError);
  assert.equal(
    parseViewerFragment("#document=documento%2Findevido&page=1"),
    null,
  );
  assert.equal(parseViewerFragment("#document=document-a&page=0"), null);
  assert.equal(
    parseViewerFragment("#document=document-a&page=1&ticket=segredo"),
    null,
  );
  assert.equal(
    parseViewerFragment("#document=document-a&document=document-b&page=1"),
    null,
  );
  assert.equal(
    parseViewerFragment("#token=segredo&document=document-a&page=1"),
    null,
  );
  assert.equal(parseViewerFragment("#document=%00&page=1"), null);
  assert.equal(
    parseViewerFragment(`#document=${"a".repeat(257)}&page=1`),
    null,
  );
});

test("controlador de rota restaura fragmento, navega sem recarregar e preserva a URL ao destruir", async () => {
  const listeners = new Map();
  const locationRef = {
    hash: "#document=document-a&page=2",
    pathname: "/documentos/",
    search: "?portal=unimed",
  };
  const replaced = [];
  const pushed = [];
  let wentBack = 0;
  const opened = [];
  let closed = 0;
  const closeObservations = [];
  const historyState = { source: "hub-documentos" };
  const route = createViewerRouteController({
    locationRef,
    historyRef: {
      state: historyState,
      replaceState(state, _title, url) {
        assert.equal(state, historyState);
        replaced.push(url);
        const hashIndex = url.indexOf("#");
        locationRef.hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
      },
      pushState(state, _title, url) {
        assert.equal(state, historyState);
        pushed.push(url);
        const hashIndex = url.indexOf("#");
        locationRef.hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
      },
      back() {
        wentBack += 1;
        locationRef.hash = "";
      },
    },
    eventTarget: {
      addEventListener(type, handler) {
        listeners.set(type, handler);
      },
      removeEventListener(type, handler) {
        if (listeners.get(type) === handler) listeners.delete(type);
      },
    },
    onOpen(value) {
      opened.push(value);
    },
    onClose() {
      closed += 1;
      closeObservations.push(locationRef.hash);
    },
  });

  await route.start();
  assert.deepEqual(opened, [{ documentId: "document-a", page: 2 }]);
  await route.close();
  assert.equal(replaced.at(-1), "/documentos/?portal=unimed");
  assert.equal(closed, 1);

  await route.open("document-b", 3);
  assert.equal(
    pushed.at(-1),
    "/documentos/?portal=unimed#document=document-b&page=3",
  );
  assert.deepEqual(opened.at(-1), { documentId: "document-b", page: 3 });

  route.setPage(4);
  assert.equal(
    replaced.at(-1),
    "/documentos/?portal=unimed#document=document-b&page=4",
  );
  await route.close();
  assert.equal(wentBack, 1);
  assert.equal(closed, 2);
  assert.equal(closeObservations.at(-1), "");

  locationRef.hash = "#ticket=segredo";
  await listeners.get("hashchange")();
  assert.equal(replaced.at(-1), "/documentos/?portal=unimed");
  assert.equal(
    opened.some(({ documentId }) => documentId === "segredo"),
    false,
  );

  await route.open("document-c", 5);
  assert.deepEqual(opened.at(-1), { documentId: "document-c", page: 5 });
  route.destroy();
  assert.equal(locationRef.hash, "#document=document-c&page=5");
  assert.equal(listeners.has("hashchange"), false);
});

test("fechamento tardio não remove uma abertura mais recente do viewer", async () => {
  const locationRef = {
    hash: "",
    pathname: "/documentos/",
    search: "?portal=unimed",
  };
  const closeGate = deferred();
  const opened = [];
  let wentBack = 0;
  const route = createViewerRouteController({
    locationRef,
    historyRef: {
      state: null,
      replaceState(_state, _title, url) {
        const hashIndex = url.indexOf("#");
        locationRef.hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
      },
      pushState(_state, _title, url) {
        const hashIndex = url.indexOf("#");
        locationRef.hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
      },
      back() {
        wentBack += 1;
        locationRef.hash = "";
      },
    },
    eventTarget: {
      addEventListener() {},
      removeEventListener() {},
    },
    onOpen(value) {
      opened.push(value);
    },
    onClose() {
      return closeGate.promise;
    },
  });

  await route.start();
  await route.open("document-a", 1);
  const closing = route.close();
  assert.equal(locationRef.hash, "");

  await route.open("document-b", 2);
  closeGate.resolve();
  await closing;

  assert.equal(wentBack, 0);
  assert.deepEqual(route.current(), { documentId: "document-b", page: 2 });
  assert.equal(locationRef.hash, "#document=document-b&page=2");
  assert.deepEqual(opened.at(-1), { documentId: "document-b", page: 2 });
});

test("seleciona somente versão pronta e prefere a versão vigente do documento", () => {
  const versions = [
    {
      versionId: "version-1",
      versionNumber: 1,
      uploadStatus: "uploaded",
      securityStatus: "clean",
      mimeDetected: "application/pdf",
      sizeBytes: 200,
    },
    {
      versionId: "version-2",
      versionNumber: 2,
      uploadStatus: "uploaded",
      securityStatus: "clean",
      mimeDetected: "text/plain",
      sizeBytes: 20,
    },
    {
      versionId: "version-3",
      versionNumber: 3,
      uploadStatus: "uploaded",
      securityStatus: "scanning",
      mimeDetected: "application/pdf",
      sizeBytes: 300,
    },
  ];

  assert.equal(
    selectViewerVersion({ currentVersionId: "version-1" }, versions).versionId,
    "version-1",
  );
  assert.equal(
    selectViewerVersion({ currentVersionId: null }, versions).versionId,
    "version-2",
  );
  assert.equal(
    selectViewerVersion({ currentVersionId: "version-3" }, versions),
    null,
  );
  assert.equal(
    selectViewerVersion(
      { currentVersionId: null },
      versions.map((version) => ({ ...version, securityStatus: "pending" })),
    ),
    null,
  );
  assert.equal(
    selectViewerVersion(
      { documentId: "document-a", currentVersionId: "version-1" },
      versions.map((version) => ({
        ...version,
        documentId: "document-b",
      })),
    ),
    null,
  );
});

test("classifica somente MIME permitido para renderização inline", () => {
  assert.equal(classifyViewerMime("application/pdf; charset=binary"), "pdf");
  assert.equal(classifyViewerMime("image/png"), "image");
  assert.equal(classifyViewerMime("image/jpeg"), "image");
  assert.equal(classifyViewerMime("text/plain; charset=utf-8"), "text");
  assert.equal(classifyViewerMime("text/markdown"), "markdown");
  assert.equal(classifyViewerMime("text/html"), "unsupported");
  assert.equal(classifyViewerMime("image/svg+xml"), "unsupported");
  assert.equal(classifyViewerMime("application/octet-stream"), "unsupported");
});

test("parser de Markdown preserva conteúdo malicioso como texto sem criar HTML ou links ativos", () => {
  const source = [
    "# Título",
    "",
    "<img src=x onerror=alert(1)>",
    "",
    "- [clique](javascript:alert(1))",
    "",
    "```html",
    "<script>alert(1)</script>",
    "```",
  ].join("\n");
  const blocks = parseSafeMarkdown(source);
  assert.deepEqual(
    blocks.map(({ type }) => type),
    ["heading", "paragraph", "list", "code"],
  );
  assert.equal(blocks[1].text, "<img src=x onerror=alert(1)>");
  assert.equal(blocks[2].items[0], "[clique](javascript:alert(1))");
  assert.equal(blocks[3].text, "<script>alert(1)</script>");
  assert.equal(JSON.stringify(blocks).includes('"html"'), false);
  assert.equal(JSON.stringify(blocks).includes('"href"'), false);
});

test("transport PDF converte intervalos em Range autenticado e aceita múltiplas leituras", async () => {
  class FakeRangeTransport {
    constructor(length, initialData) {
      this.length = length;
      this.initialData = initialData;
      this.received = [];
    }

    onDataRange(begin, bytes) {
      this.received.push({ begin, bytes: [...bytes] });
    }
  }

  const requests = [];
  const failures = [];
  const transport = createAuthenticatedPdfRangeTransport({
    PDFDataRangeTransport: FakeRangeTransport,
    length: 20,
    async requestRange(begin, end) {
      requests.push({ begin, end });
      return Uint8Array.from(
        { length: end - begin },
        (_, offset) => begin + offset,
      );
    },
    onError(error) {
      failures.push(error);
    },
  });

  transport.requestDataRange(0, 5);
  transport.requestDataRange(10, 20);
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(requests, [
    { begin: 0, end: 5 },
    { begin: 10, end: 20 },
  ]);
  assert.deepEqual(transport.received, [
    { begin: 0, bytes: [0, 1, 2, 3, 4] },
    { begin: 10, bytes: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] },
  ]);
  assert.deepEqual(failures, []);
});

test("viewer PDF emite ticket, usa HEAD e Range, navega páginas e elimina o ticket ao fechar", async () => {
  const calls = [];
  const states = [];
  const renderedPages = [];
  let destroyedPdf = 0;
  const client = {
    async request(target, options = {}) {
      calls.push({ target, options });
      if (calls.length === 1) return ticketResponse();
      if (calls.length === 2) return headResponse("application/pdf", 120);
      if (options.headers?.Range) {
        return rangeResponse();
      }
      throw new Error("Request inesperado.");
    },
  };
  client.requestViewerBytes = (target, options = {}) =>
    client.request(target, options);
  const viewer = createDocumentViewerController({
    client,
    now: () => Date.parse("2026-07-25T22:00:00.000Z"),
    onState: (state) => states.push(state),
    async loadPdf({ requestRange }) {
      await requestRange(0, 4);
      return {
        pageCount: 3,
        async renderPage(pageNumber) {
          renderedPages.push(pageNumber);
        },
        async destroy() {
          destroyedPdf += 1;
        },
      };
    },
  });

  await viewer.open({
    documentId: "document-a",
    versionId: "version-a",
    title: "Documento A",
    page: 2,
  });
  assert.equal(viewer.hasActiveTicket(), true);
  assert.deepEqual(renderedPages, [2]);
  assert.equal(states.at(-1).kind, "pdf");
  assert.equal(states.at(-1).page, 2);
  assert.equal(states.at(-1).pageCount, 3);
  assert.equal(
    calls[0].target,
    "/v1/documents/document-a/versions/version-a/viewer-tickets",
  );
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[1].options.method, "HEAD");
  assert.equal(calls[2].options.viewerTicket, TICKET_A);
  assert.equal(calls[2].options.headers.Range, "bytes=0-3");
  assert.equal(calls[2].options.headers["If-Range"], '"viewer-etag"');

  await viewer.goToPage(3);
  assert.deepEqual(renderedPages, [2, 3]);
  assert.equal(states.at(-1).page, 3);

  await viewer.close("user");
  assert.equal(viewer.hasActiveTicket(), false);
  assert.equal(destroyedPdf, 1);
  assert.equal(states.at(-1).status, "closed");
});

test("renova ticket expirado em single-flight antes de múltiplos Range", async () => {
  let clock = Date.parse("2026-07-25T22:00:00.000Z");
  let ticketRequests = 0;
  let requestRange;
  const rangeTickets = [];
  const client = {
    async request(target, options = {}) {
      assert.match(target, /viewer-tickets$/u);
      assert.equal(options.method, "POST");
      ticketRequests += 1;
      return ticketResponse(
        ticketRequests === 1 ? TICKET_A : TICKET_B,
        ticketRequests === 1
          ? "2026-07-25T22:00:01.000Z"
          : "2026-07-25T22:10:00.000Z",
      );
    },
    async requestViewerBytes(_target, options = {}) {
      if (options.method === "HEAD")
        return headResponse("application/pdf", 120);
      rangeTickets.push(options.viewerTicket);
      return rangeResponse();
    },
  };
  const viewer = createDocumentViewerController({
    client,
    now: () => clock,
    setTimer: () => ({ unref() {} }),
    clearTimer() {},
    async loadPdf(options) {
      requestRange = options.requestRange;
      return {
        pageCount: 1,
        async renderPage() {},
        async destroy() {},
      };
    },
  });

  await viewer.open({
    documentId: "document-a",
    versionId: "version-a",
    title: "Documento A",
  });
  clock = Date.parse("2026-07-25T22:00:02.000Z");
  await Promise.all([requestRange(0, 4), requestRange(0, 4)]);

  assert.equal(ticketRequests, 2);
  assert.deepEqual(rangeTickets, [TICKET_B, TICKET_B]);
  await viewer.destroy();
});

test("cancelamento de página supersedida não encerra o viewer", async () => {
  const states = [];
  const secondPage = deferred();
  const renderedPages = [];
  const client = createSequencedClient([
    ticketResponse(),
    headResponse("application/pdf", 120),
  ]);
  const viewer = createDocumentViewerController({
    client,
    now: () => Date.parse("2026-07-25T22:00:00.000Z"),
    onState: (state) => states.push(state),
    async loadPdf() {
      return {
        pageCount: 3,
        async renderPage(page) {
          renderedPages.push(page);
          if (page === 2) return secondPage.promise;
        },
        async destroy() {},
      };
    },
  });

  await viewer.open({
    documentId: "document-a",
    versionId: "version-a",
    title: "Documento A",
  });
  const staleNavigation = viewer.goToPage(2);
  while (!renderedPages.includes(2)) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  const currentNavigation = viewer.goToPage(3);
  secondPage.reject(new DOMException("Renderização cancelada.", "AbortError"));
  await Promise.all([staleNavigation, currentNavigation]);

  assert.deepEqual(renderedPages, [1, 2, 3]);
  assert.equal(states.at(-1).status, "ready");
  assert.equal(states.at(-1).page, 3);
  assert.equal(viewer.hasActiveTicket(), true);
  await viewer.destroy();
});

test("rejeita Range cuja representação diverge do HEAD canônico", async () => {
  const states = [];
  const client = createSequencedClient([
    ticketResponse(),
    headResponse("application/pdf", 120),
    rangeResponse({ etag: '"etag-divergente"' }),
  ]);
  const viewer = createDocumentViewerController({
    client,
    now: () => Date.parse("2026-07-25T22:00:00.000Z"),
    onState: (state) => states.push(state),
    async loadPdf({ requestRange }) {
      await requestRange(0, 4);
      return {
        pageCount: 1,
        async renderPage() {},
        async destroy() {},
      };
    },
  });

  await viewer.open({
    documentId: "document-a",
    versionId: "version-a",
    title: "Documento A",
  });

  assert.equal(states.at(-1).status, "error");
  assert.equal(states.at(-1).title, "Conteúdo Indisponível");
  assert.equal(viewer.hasActiveTicket(), false);
});

test("troca de documento cancela leitura anterior e revoga Object URL", async () => {
  const states = [];
  const revoked = [];
  const client = createSequencedClient([
    ticketResponse(TICKET_A),
    headResponse("image/png", 4),
    fullBlobResponse("image/png", [1, 2, 3, 4]),
    ticketResponse(TICKET_B),
    headResponse("text/plain; charset=utf-8", 5),
    fullBytesResponse(
      "text/plain; charset=utf-8",
      new TextEncoder().encode("texto"),
    ),
  ]);
  const viewer = createDocumentViewerController({
    client,
    now: () => Date.parse("2026-07-25T22:00:00.000Z"),
    onState: (state) => states.push(state),
    createObjectURL: () => "blob:viewer-image-a",
    revokeObjectURL: (url) => revoked.push(url),
  });

  await viewer.open({
    documentId: "document-a",
    versionId: "version-a",
    title: "Imagem A",
  });
  assert.equal(states.at(-1).kind, "image");
  assert.equal(states.at(-1).objectUrl, "blob:viewer-image-a");

  await viewer.open({
    documentId: "document-b",
    versionId: "version-b",
    title: "Texto B",
  });
  assert.deepEqual(revoked, ["blob:viewer-image-a"]);
  assert.equal(states.at(-1).kind, "text");
  assert.equal(states.at(-1).text, "texto");
  assert.equal(viewer.hasActiveTicket(), true);

  await viewer.destroy("session_lost");
  assert.equal(viewer.hasActiveTicket(), false);
});

test("troca A para B neutraliza A e não aguarda destruição assíncrona do PDF anterior", async () => {
  const destroyPending = deferred();
  const states = [];
  const client = {
    async request(target) {
      if (target.includes("document-a")) return ticketResponse(TICKET_A);
      throw new DocumentApiError({ status: 404, code: "resource_unavailable" });
    },
    async requestViewerBytes(target, options) {
      if (target.includes("document-a") && options.method === "HEAD") {
        return headResponse("application/pdf", 120);
      }
      throw new Error("Bytes inesperados.");
    },
  };
  const viewer = createDocumentViewerController({
    client,
    onState: (state) => states.push(state),
    now: () => Date.parse("2026-07-25T22:00:00.000Z"),
    async loadPdf() {
      return {
        pageCount: 1,
        async renderPage() {},
        async destroy() {
          await destroyPending.promise;
        },
      };
    },
  });

  await viewer.open({
    documentId: "document-a",
    versionId: "version-a",
    title: "Documento A",
  });
  assert.equal(viewer.hasActiveTicket(), true);

  const switched = viewer.open({
    documentId: "document-b",
    versionId: "version-b",
    title: "Documento B",
  });
  const outcome = await Promise.race([
    switched.then(() => "resolved"),
    new Promise((resolve) => setImmediate(() => resolve("pending"))),
  ]);

  assert.equal(outcome, "resolved");
  assert.equal(viewer.hasActiveTicket(), false);
  assert.deepEqual(states.at(-1), {
    status: "error",
    title: "Conteúdo Indisponível",
    detail: "Não foi possível acessar este conteúdo.",
    canRetry: false,
  });
  destroyPending.resolve();
  await viewer.destroy();
});

test("403 e 404 do viewer resultam no mesmo estado neutro byte a byte", async () => {
  async function stateFor(status) {
    const states = [];
    const client = createSequencedClient([
      new DocumentApiError({ status, code: "resource_unavailable" }),
    ]);
    const viewer = createDocumentViewerController({
      client,
      onState: (state) => states.push(state),
    });
    await viewer.open({
      documentId: "document-neutral",
      versionId: "version-neutral",
      title: "Documento Neutro",
    });
    return states.at(-1);
  }

  assert.equal(
    JSON.stringify(await stateFor(403)),
    JSON.stringify(await stateFor(404)),
  );
  assert.deepEqual(await stateFor(403), {
    status: "error",
    title: "Conteúdo Indisponível",
    detail: "Não foi possível acessar este conteúdo.",
    canRetry: false,
  });
});

test("tipo não suportado oferece download autorizado sem manter Object URL", async () => {
  const clicked = [];
  const revoked = [];
  const scheduled = [];
  const mime =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const client = createSequencedClient([
    ticketResponse(TICKET_C),
    headResponse(mime, 3),
    fullBlobResponse(mime, [1, 2, 3]),
  ]);
  const viewer = createDocumentViewerController({
    client,
    now: () => Date.parse("2026-07-25T22:00:00.000Z"),
    createObjectURL: () => "blob:download-temporario",
    revokeObjectURL: (url) => revoked.push(url),
    triggerDownload: (url, fileName) => clicked.push({ url, fileName }),
    scheduleRevocation(callback) {
      scheduled.push(callback);
    },
  });

  await viewer.open({
    documentId: "document-docx",
    versionId: "version-docx",
    title: "Arquivo DOCX",
    fileName: "arquivo.docx",
  });
  await viewer.download();

  assert.deepEqual(clicked, [
    { url: "blob:download-temporario", fileName: "arquivo.docx" },
  ]);
  assert.deepEqual(revoked, []);
  assert.equal(scheduled.length, 1);
  scheduled[0]();
  assert.deepEqual(revoked, ["blob:download-temporario"]);
});

test("bundle do viewer não registra service worker nem usa Cache Storage", async () => {
  const source = await readFile(
    new URL("../../docs/public/documentos/assets/viewer.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /\bcaches\s*\.\s*open\s*\(/u);
  assert.doesNotMatch(source, /\bserviceWorker\s*\.\s*register\s*\(/u);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/u);
});
