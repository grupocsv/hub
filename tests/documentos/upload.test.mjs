import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  MAX_UPLOAD_BYTES,
  createDocumentUploadController,
  validateUploadFile,
} from "../../docs/public/documentos/assets/upload.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HUB_ROOT = path.resolve(HERE, "../..");
const SHA256_ABC =
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

function fileFixture({
  name = "relatorio.pdf",
  type = "application/pdf",
  bytes = new TextEncoder().encode("abc"),
  size = bytes.byteLength,
} = {}) {
  return Object.freeze({
    name,
    type,
    size,
    async arrayBuffer() {
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );
    },
  });
}

function response(data = null, status = 200) {
  return Object.freeze({
    status,
    data,
    headers: new Headers(),
    requestId: null,
  });
}

function successClient(options = {}) {
  const calls = [];
  let jobPoll = 0;
  const versionPending = {
    versionId: "version-a",
    documentId: "document-a",
    uploadStatus: "uploaded",
    securityStatus: "scanning",
    previewStatus: "pending",
    extractionStatus: "pending",
    indexingStatus: "pending",
    publicationStatus: "draft",
  };
  const versionReady = {
    ...versionPending,
    securityStatus: "clean",
    previewStatus: "ready",
    extractionStatus: "ready",
    indexingStatus: "indexed",
    publicationStatus: "eligible",
  };
  const client = {
    async request(target, requestOptions = {}) {
      calls.push([target, requestOptions]);
      if (options.request) {
        const overridden = await options.request(target, requestOptions, calls);
        if (overridden !== undefined) return overridden;
      }
      if (target === "/v1/documents") {
        return response({ document: { documentId: "document-a" } }, 201);
      }
      if (target === "/v1/documents/document-a/upload-sessions") {
        return response(
          {
            upload_session: {
              upload_id: "upload-a",
              document_id: "document-a",
              version_id: "version-a",
              state: "pending",
              maximum_size_bytes: MAX_UPLOAD_BYTES,
              expires_at: "2099-01-01T00:00:00.000Z",
            },
          },
          201,
        );
      }
      if (target === "/v1/upload-sessions/upload-a/bytes")
        return response(null, 204);
      if (target === "/v1/upload-sessions/upload-a/complete") {
        return response(
          {
            upload_session: {
              upload_id: "upload-a",
              version_id: "version-a",
              state: "completed",
            },
            job: { job_id: "job-a", state: "pending" },
          },
          202,
        );
      }
      if (target === "/v1/jobs/job-a") {
        jobPoll += 1;
        return response({
          job: {
            job_id: "job-a",
            type: "process_version_v1",
            status: jobPoll === 1 ? "pending" : "succeeded",
            attempt_count: jobPoll === 1 ? 0 : 1,
            maximum_attempts: 5,
            last_error_code: null,
            created_at: "2026-07-25T00:00:00.000Z",
            updated_at: "2026-07-25T00:00:01.000Z",
            completed_at: jobPoll === 1 ? null : "2026-07-25T00:00:01.000Z",
          },
        });
      }
      if (target === "/v1/documents/document-a/versions") {
        return response({
          items: [jobPoll <= 1 ? versionPending : versionReady],
        });
      }
      if (
        target === "/v1/upload-sessions/upload-a" &&
        requestOptions.method === "DELETE"
      ) {
        return response(null, 204);
      }
      throw new Error(
        `Rota inesperada: ${requestOptions.method ?? "GET"} ${target}`,
      );
    },
  };
  return { client, calls };
}

function controllerFixture(options = {}) {
  const states = [];
  let requestId = 0;
  const controller = createDocumentUploadController({
    client: options.client,
    onState(state) {
      states.push(state);
    },
    createRequestId:
      options.createRequestId ?? (() => `request-${++requestId}`),
    wait: options.wait ?? (async () => {}),
    now: options.now ?? (() => Date.parse("2026-07-25T00:00:00.000Z")),
    maximumPollingMs: options.maximumPollingMs ?? 60_000,
  });
  return { controller, states };
}

test("valida no cliente nome, extensão, MIME e limite canônico antes da rede", () => {
  assert.deepEqual(validateUploadFile(fileFixture()), {
    name: "relatorio.pdf",
    type: "application/pdf",
    size: 3,
  });
  for (const file of [
    fileFixture({ name: "../relatorio.pdf" }),
    fileFixture({
      name: "relatorio.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    fileFixture({ name: "relatorio.pdf", type: "text/plain" }),
    fileFixture({ size: 0 }),
    fileFixture({ size: MAX_UPLOAD_BYTES + 1 }),
  ]) {
    assert.throws(() => validateUploadFile(file), /arquivo|tipo|tamanho/i);
  }
});

test("cria documento, calcula SHA-256, transmite bytes, conclui e acompanha estados reais", async () => {
  const { client, calls } = successClient();
  const identifiers = ["document-a", "request-2", "request-3", "request-4"];
  const { controller, states } = controllerFixture({
    client,
    createRequestId: () => identifiers.shift(),
  });
  const result = await controller.start({
    file: fileFixture(),
    permissions: ["create"],
    title: "Relatório Assistencial",
    description: "Documento de teste.",
    collectionId: null,
    classification: "internal",
    indexingPolicy: "metadata_only",
  });

  assert.equal(result.status, "succeeded");
  assert.equal(result.documentId, "document-a");
  assert.equal(result.versionId, "version-a");
  assert.deepEqual(
    states.map(({ status }) => status),
    [
      "validating",
      "hashing",
      "creating_document",
      "creating_session",
      "uploading",
      "completing",
      "processing",
      "processing",
      "succeeded",
    ],
  );
  assert.deepEqual(
    calls.map(([target, options]) => [options.method ?? "GET", target]),
    [
      ["POST", "/v1/documents"],
      ["POST", "/v1/documents/document-a/upload-sessions"],
      ["PUT", "/v1/upload-sessions/upload-a/bytes"],
      ["POST", "/v1/upload-sessions/upload-a/complete"],
      ["GET", "/v1/jobs/job-a"],
      ["GET", "/v1/documents/document-a/versions"],
      ["GET", "/v1/jobs/job-a"],
      ["GET", "/v1/documents/document-a/versions"],
    ],
  );

  const createDocument = calls[0][1];
  assert.deepEqual(createDocument.body, {
    document_id: "document-a",
    collection_id: null,
    title: "Relatório Assistencial",
    description: "Documento de teste.",
    classification: "internal",
    indexing_policy: "metadata_only",
  });
  assert.equal(createDocument.headers["Idempotency-Key"], "request-2");

  const createSession = calls[1][1];
  assert.deepEqual(createSession.body, {
    file_name: "relatorio.pdf",
    content_type: "application/pdf",
    size_bytes: 3,
    sha256: SHA256_ABC,
  });
  assert.equal(createSession.headers["Idempotency-Key"], "request-3");

  const bytes = calls[2][1];
  assert.equal(bytes.headers["Content-Type"], "application/pdf");
  assert.equal(bytes.headers["X-Content-SHA256"], SHA256_ABC);
  assert.equal(Object.hasOwn(bytes.headers, "Content-Length"), false);
  assert.equal(bytes.timeoutMs, 14 * 60 * 1_000);
  assert.equal(bytes.body.name, "relatorio.pdf");
  assert.equal(calls[3][1].headers["Idempotency-Key"], "request-4");
  assert.equal(
    calls
      .filter(([, options]) => options.method !== "PUT")
      .every(([, options]) => options.timeoutMs === undefined),
    true,
  );

  assert.deepEqual(result.processing, {
    uploadStatus: "uploaded",
    securityStatus: "clean",
    previewStatus: "ready",
    extractionStatus: "ready",
    indexingStatus: "indexed",
    publicationStatus: "eligible",
    jobStatus: "succeeded",
  });
});

test("nova versão exige create_version e não cria outro documento", async () => {
  const { client, calls } = successClient();
  const { controller } = controllerFixture({ client });

  const denied = await controller.start({
    file: fileFixture(),
    documentId: "document-a",
    permissions: ["read"],
  });
  assert.equal(denied.status, "error");
  assert.equal(calls.length, 0);

  const result = await controller.retry({
    permissions: ["create_version"],
  });
  assert.equal(result.status, "succeeded");
  assert.equal(
    calls.some(([target]) => target === "/v1/documents"),
    false,
  );
});

test("reutiliza a mesma chave idempotente em retry transitório e não duplica sessão", async () => {
  let createSessionAttempts = 0;
  const { client, calls } = successClient({
    async request(target) {
      if (target === "/v1/documents/document-a/upload-sessions") {
        createSessionAttempts += 1;
        if (createSessionAttempts === 1) {
          throw Object.assign(new Error("indisponível"), {
            code: "service_unavailable",
            retriable: true,
          });
        }
      }
    },
  });
  const { controller } = controllerFixture({ client });
  const result = await controller.start({
    file: fileFixture(),
    documentId: "document-a",
    permissions: ["create_version"],
  });

  assert.equal(result.status, "succeeded");
  const sessions = calls.filter(([target]) =>
    target.endsWith("/upload-sessions"),
  );
  assert.equal(sessions.length, 2);
  assert.equal(
    sessions[0][1].headers["Idempotency-Key"],
    sessions[1][1].headers["Idempotency-Key"],
  );
});

test("retry após criar documento reutiliza o draft confirmado em vez de criar órfão", async () => {
  let rejectSession = true;
  const { client, calls } = successClient({
    async request(target) {
      if (
        target === "/v1/documents/document-a/upload-sessions" &&
        rejectSession
      ) {
        rejectSession = false;
        throw Object.assign(new Error("conflito"), {
          code: "conflict",
          retriable: false,
        });
      }
    },
  });
  const identifiers = [
    "document-a",
    "document-key",
    "session-key-fail",
    "session-key-retry",
    "complete-key",
  ];
  const { controller } = controllerFixture({
    client,
    createRequestId: () => identifiers.shift(),
  });

  const first = await controller.start({
    file: fileFixture(),
    permissions: ["create"],
    title: "Documento",
    description: "",
    collectionId: null,
    classification: "internal",
    indexingPolicy: "metadata_only",
  });
  assert.equal(first.status, "error");

  const retried = await controller.retry();
  assert.equal(retried.status, "succeeded");
  assert.equal(
    calls.filter(([target]) => target === "/v1/documents").length,
    1,
  );
  assert.equal(
    calls.filter(
      ([target]) => target === "/v1/documents/document-a/upload-sessions",
    ).length,
    2,
  );
});

test("nova submissão inválida elimina retry e retomada da intenção anterior", async () => {
  const { client, calls } = successClient({
    async request(target) {
      if (target === "/v1/documents/document-a/upload-sessions") {
        throw Object.assign(new Error("conflito"), {
          code: "conflict",
          retriable: false,
        });
      }
    },
  });
  const { controller } = controllerFixture({ client });

  const first = await controller.start({
    file: fileFixture(),
    documentId: "document-a",
    permissions: ["create_version"],
  });
  assert.equal(first.status, "error");
  assert.equal(calls.length > 0, true);

  const invalid = await controller.start({
    file: fileFixture({ name: "../privado.pdf" }),
    documentId: "document-b",
    permissions: ["create_version"],
  });
  assert.equal(invalid.status, "error");
  const callsAfterInvalidSubmission = calls.length;

  const retried = await controller.retry();
  assert.equal(retried.status, "error");
  assert.equal(calls.length, callsAfterInvalidSubmission);

  controller.cancel();
  assert.equal(await controller.retry(), retried);
  assert.equal(calls.length, callsAfterInvalidSubmission);
});

test("respostas perdidas preservam documento, sessão, versão e chaves entre retries manuais", async () => {
  const stageAttempts = {
    document: 0,
    session: 0,
    completion: 0,
  };
  const { client, calls } = successClient({
    async request(target) {
      const stage =
        target === "/v1/documents"
          ? "document"
          : target === "/v1/documents/document-a/upload-sessions"
            ? "session"
            : target === "/v1/upload-sessions/upload-a/complete"
              ? "completion"
              : null;
      if (stage) {
        stageAttempts[stage] += 1;
        if (stageAttempts[stage] <= 2) {
          throw Object.assign(new Error(`resposta perdida em ${stage}`), {
            code: "network_unavailable",
            retriable: true,
          });
        }
      }
    },
  });
  const identifiers = [
    "document-a",
    "document-key-a",
    "session-key-a",
    "completion-key-a",
  ];
  const { controller } = controllerFixture({
    client,
    createRequestId: () => identifiers.shift(),
  });
  const input = {
    file: fileFixture(),
    permissions: ["create"],
    title: "Documento",
    description: "",
    collectionId: null,
    classification: "internal",
    indexingPolicy: "metadata_only",
  };

  assert.equal((await controller.start(input)).status, "error");
  assert.equal((await controller.retry()).status, "error");
  const completionLost = await controller.retry();
  assert.equal(completionLost.status, "error");
  assert.equal(
    calls.some(
      ([target, options]) =>
        target === "/v1/upload-sessions/upload-a" &&
        options.method === "DELETE",
    ),
    false,
  );

  const result = await controller.retry();
  assert.equal(result.status, "succeeded");
  assert.deepEqual(stageAttempts, {
    document: 3,
    session: 3,
    completion: 3,
  });

  const documentCalls = calls.filter(([target]) => target === "/v1/documents");
  assert.equal(
    new Set(documentCalls.map(([, options]) => options.body.document_id)).size,
    1,
  );
  assert.equal(
    new Set(
      documentCalls.map(([, options]) => options.headers["Idempotency-Key"]),
    ).size,
    1,
  );
  const sessionCalls = calls.filter(
    ([target]) => target === "/v1/documents/document-a/upload-sessions",
  );
  assert.equal(
    new Set(
      sessionCalls.map(([, options]) => options.headers["Idempotency-Key"]),
    ).size,
    1,
  );
  const completionCalls = calls.filter(
    ([target]) => target === "/v1/upload-sessions/upload-a/complete",
  );
  assert.equal(
    new Set(
      completionCalls.map(([, options]) => options.headers["Idempotency-Key"]),
    ).size,
    1,
  );
  assert.equal(calls.filter(([target]) => target.endsWith("/bytes")).length, 1);
  assert.deepEqual(identifiers, []);
});

test("falha de SHA, expiração ou conflito aborta somente a sessão incompleta e permite retry", async () => {
  for (const errorCode of ["invalid_request", "conflict"]) {
    let failed = false;
    const { client, calls } = successClient({
      async request(target) {
        if (target.endsWith("/bytes") && !failed) {
          failed = true;
          throw Object.assign(new Error("falha pública"), {
            code: errorCode,
            retriable: false,
          });
        }
      },
    });
    const { controller } = controllerFixture({ client });
    const first = await controller.start({
      file: fileFixture(),
      documentId: "document-a",
      permissions: ["create_version"],
    });
    assert.equal(first.status, "error");
    assert.equal(first.errorCode, errorCode);
    assert.deepEqual(calls.at(-1).slice(0, 2), [
      "/v1/upload-sessions/upload-a",
      { method: "DELETE" },
    ]);

    const retried = await controller.retry({ permissions: ["create_version"] });
    assert.equal(retried.status, "succeeded");
  }
});

test("cancelamento durante polling interrompe o ciclo sem apagar upload concluído", async () => {
  let releaseWait;
  const waitStarted = new Promise((resolve) => {
    releaseWait = resolve;
  });
  let blockResolve;
  const blocked = new Promise((resolve) => {
    blockResolve = resolve;
  });
  const { client, calls } = successClient();
  const { controller, states } = controllerFixture({
    client,
    wait: async () => {
      releaseWait();
      await blocked;
    },
  });

  const pending = controller.start({
    file: fileFixture(),
    documentId: "document-a",
    permissions: ["create_version"],
  });
  await waitStarted;
  await controller.cancel();
  blockResolve();
  const result = await pending;

  assert.equal(result.status, "cancelled");
  assert.equal(states.at(-1).status, "cancelled");
  assert.equal(
    calls.some(
      ([target, options]) =>
        target === "/v1/upload-sessions/upload-a" &&
        options.method === "DELETE",
    ),
    false,
  );
  assert.equal(
    calls.filter(([target]) => target === "/v1/jobs/job-a").length,
    1,
  );
});

test("cancelamento fecha localmente sem aguardar o DELETE best-effort da sessão incompleta", async () => {
  let bytesStartedResolve;
  const bytesStarted = new Promise((resolve) => {
    bytesStartedResolve = resolve;
  });
  let deleteResolve;
  const deletePending = new Promise((resolve) => {
    deleteResolve = resolve;
  });
  const { client, calls } = successClient({
    async request(target, options) {
      if (target.endsWith("/bytes")) {
        bytesStartedResolve();
        return new Promise((resolve, reject) => {
          options.signal.addEventListener(
            "abort",
            () => reject(options.signal.reason),
            { once: true },
          );
        });
      }
      if (
        target === "/v1/upload-sessions/upload-a" &&
        options.method === "DELETE"
      ) {
        await deletePending;
        return response(null, 204);
      }
    },
  });
  const { controller, states } = controllerFixture({ client });

  const pending = controller.start({
    file: fileFixture(),
    documentId: "document-a",
    permissions: ["create_version"],
  });
  await bytesStarted;
  const cancelled = controller.cancel();

  assert.equal(cancelled.status, "cancelled");
  assert.equal(typeof cancelled?.then, "undefined");
  assert.equal(states.at(-1).status, "cancelled");
  assert.equal(
    calls.some(
      ([target, options]) =>
        target === "/v1/upload-sessions/upload-a" &&
        options.method === "DELETE",
    ),
    true,
  );
  deleteResolve();
  assert.equal((await pending).status, "cancelled");
});

test("timeout do processamento mantém apenas identificadores seguros e pode retomar polling", async () => {
  let timestamp = 0;
  let resumed = false;
  const { client, calls } = successClient({
    async request(target) {
      if (target === "/v1/jobs/job-a") {
        return response({
          job: {
            job_id: "job-a",
            type: "process_version_v1",
            status: resumed ? "succeeded" : "pending",
            attempt_count: resumed ? 1 : 0,
            maximum_attempts: 5,
            last_error_code: null,
            created_at: "2026-07-25T00:00:00.000Z",
            updated_at: "2026-07-25T00:00:00.000Z",
            completed_at: resumed ? "2026-07-25T00:00:01.000Z" : null,
          },
        });
      }
      if (target.endsWith("/versions")) {
        return response({
          items: [
            {
              versionId: "version-a",
              documentId: "document-a",
              uploadStatus: "uploaded",
              securityStatus: resumed ? "clean" : "scanning",
              previewStatus: resumed ? "ready" : "pending",
              extractionStatus: resumed ? "ready" : "pending",
              indexingStatus: resumed ? "indexed" : "pending",
              publicationStatus: resumed ? "eligible" : "draft",
            },
          ],
        });
      }
    },
  });
  const { controller } = controllerFixture({
    client,
    maximumPollingMs: 10,
    now: () => {
      timestamp += 6;
      return timestamp;
    },
  });

  const timedOut = await controller.start({
    file: fileFixture(),
    documentId: "document-a",
    permissions: ["create_version"],
  });
  assert.equal(timedOut.status, "timeout");
  assert.equal(timedOut.canRetry, true);
  assert.equal(JSON.stringify(timedOut).includes("relatorio.pdf"), false);

  const callsBeforeResume = calls.length;
  resumed = true;
  const result = await controller.retry();
  assert.equal(result.status, "succeeded");
  assert.deepEqual(
    calls.slice(callsBeforeResume).map(([target]) => target),
    ["/v1/jobs/job-a", "/v1/documents/document-a/versions"],
  );
});

test("diferencia falhas terminais sem oferecer retry inexistente no contrato", async () => {
  for (const failure of ["security", "processing"]) {
    const calls = [];
    const { client } = successClient({
      async request(target) {
        calls.push(target);
        if (target === "/v1/jobs/job-a") {
          return response({
            job: {
              job_id: "job-a",
              type: "process_version_v1",
              status: failure === "security" ? "succeeded" : "dead_lettered",
              attempt_count: 5,
              maximum_attempts: 5,
              last_error_code:
                failure === "processing" ? "processor_unavailable" : null,
              created_at: "2026-07-25T00:00:00.000Z",
              updated_at: "2026-07-25T00:00:01.000Z",
              completed_at: "2026-07-25T00:00:01.000Z",
            },
          });
        }
        if (target.endsWith("/versions")) {
          return response({
            items: [
              {
                versionId: "version-a",
                documentId: "document-a",
                uploadStatus: "uploaded",
                securityStatus:
                  failure === "security" ? "rejected" : "scanning",
                previewStatus: "pending",
                extractionStatus: "pending",
                indexingStatus: "pending",
                publicationStatus: "draft",
              },
            ],
          });
        }
      },
    });
    const { controller } = controllerFixture({ client });
    const result = await controller.start({
      file: fileFixture(),
      documentId: "document-a",
      permissions: ["create_version"],
    });
    assert.equal(
      result.status,
      failure === "security" ? "security_failed" : "processing_failed",
    );
    assert.equal(result.canRetry, false);
    const callsBeforeRetry = calls.length;
    assert.equal(await controller.retry(), result);
    assert.equal(calls.length, callsBeforeRetry);
  }
});

test("mantém polling quando o scanner falha de forma retentável", async () => {
  let poll = 0;
  const { client } = successClient({
    async request(target) {
      if (target === "/v1/jobs/job-a") {
        poll += 1;
        return response({
          job: {
            job_id: "job-a",
            type: "process_version_v1",
            status: poll === 1 ? "failed" : "succeeded",
            attempt_count: poll,
            maximum_attempts: 5,
            last_error_code: poll === 1 ? "security.scan.unavailable" : null,
            created_at: "2026-07-25T00:00:00.000Z",
            updated_at: "2026-07-25T00:00:01.000Z",
            completed_at: poll === 1 ? null : "2026-07-25T00:00:02.000Z",
          },
        });
      }
      if (target.endsWith("/versions")) {
        return response({
          items: [
            {
              versionId: "version-a",
              documentId: "document-a",
              uploadStatus: "uploaded",
              securityStatus: poll === 1 ? "error" : "clean",
              previewStatus: poll === 1 ? "pending" : "ready",
              extractionStatus: poll === 1 ? "pending" : "ready",
              indexingStatus: poll === 1 ? "pending" : "indexed",
              publicationStatus: poll === 1 ? "draft" : "eligible",
            },
          ],
        });
      }
    },
  });
  const { controller } = controllerFixture({ client });

  const result = await controller.start({
    file: fileFixture(),
    documentId: "document-a",
    permissions: ["create_version"],
  });

  assert.equal(poll, 2);
  assert.equal(result.status, "succeeded");
});

test("módulo não persiste arquivo, bytes, token, SHA ou progresso fictício", async () => {
  const source = await readFile(
    path.join(HUB_ROOT, "docs/public/documentos/assets/upload.js"),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /localStorage|sessionStorage|indexedDB|caches\.open|serviceWorker\.register/,
  );
  assert.doesNotMatch(source, /authorization|x-auth-token|tenant_id/i);
  assert.doesNotMatch(source, /percent|percentage|progress\s*:/i);
  assert.match(source, /cryptoImpl\.subtle\.digest\(['"]SHA-256['"]/);
  assert.match(source, /X-Content-SHA256/);
  assert.match(source, /Idempotency-Key/);
});
