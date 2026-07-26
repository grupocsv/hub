export const MAX_UPLOAD_BYTES = 52_428_800;

const ALLOWED_MEDIA_TYPES = Object.freeze(
  new Map([
    ["pdf", "application/pdf"],
    ["png", "image/png"],
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
    ["webp", "image/webp"],
    ["txt", "text/plain"],
    ["md", "text/markdown"],
  ]),
);
const SAFE_FILE_NAME = /^[\p{L}\p{N}][\p{L}\p{N} _().-]{0,254}$/u;
const SAFE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,255}$/u;
const CLASSIFICATIONS = new Set([
  "public",
  "internal",
  "confidential",
  "restricted",
]);
const INDEXING_POLICIES = new Set(["disabled", "metadata_only", "full_text"]);
const JOB_STATUSES = new Set([
  "pending",
  "running",
  "succeeded",
  "failed",
  "dead_lettered",
  "cancelled",
]);
const POLL_DELAYS_MS = Object.freeze([750, 1_500, 3_000, 5_000, 8_000, 10_000]);
const DEFAULT_MAXIMUM_POLLING_MS = 120_000;
const UPLOAD_BYTES_TIMEOUT_MS = 14 * 60 * 1_000;
const AMBIGUOUS_REQUEST_ERRORS = new Set([
  "network_unavailable",
  "request_timeout",
  "request_aborted",
  "rate_limited",
  "service_unavailable",
]);

function plainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function identifier(value, name) {
  if (typeof value !== "string" || !SAFE_IDENTIFIER.test(value)) {
    throw new TypeError(`${name} inválido.`);
  }
  return value;
}

function publicFailure(code = "unexpected_response") {
  const messages = Object.freeze({
    invalid_upload: "Revise o arquivo e os dados informados.",
    permission_required: "Você não tem permissão para enviar este documento.",
    invalid_request: "O arquivo não passou pela verificação de integridade.",
    conflict: "A sessão de envio não está mais disponível.",
    payload_too_large: "O arquivo excede o tamanho permitido.",
    unsupported_media_type: "Este tipo de arquivo não é permitido.",
    service_unavailable: "O processamento está temporariamente indisponível.",
    network_unavailable: "Não foi possível conectar ao serviço.",
    request_timeout: "A solicitação demorou mais do que o esperado.",
    unexpected_response: "Não foi possível concluir o envio.",
  });
  return messages[code] ?? messages.unexpected_response;
}

function uploadError(code, message) {
  return Object.assign(new TypeError(message), { code, retriable: false });
}

export function validateUploadFile(file) {
  if (
    !file ||
    typeof file.name !== "string" ||
    file.name !== file.name.trim() ||
    !SAFE_FILE_NAME.test(file.name) ||
    file.name.includes("..") ||
    file.name.includes("/") ||
    file.name.includes("\\") ||
    typeof file.arrayBuffer !== "function"
  ) {
    throw uploadError("invalid_upload", "Nome de arquivo inválido.");
  }
  const separator = file.name.lastIndexOf(".");
  const extension =
    separator > 0 && separator < file.name.length - 1
      ? file.name.slice(separator + 1).toLowerCase()
      : "";
  const expectedType = ALLOWED_MEDIA_TYPES.get(extension);
  if (
    expectedType === undefined ||
    typeof file.type !== "string" ||
    file.type !== expectedType
  ) {
    throw uploadError(
      "unsupported_media_type",
      "Tipo de arquivo não permitido.",
    );
  }
  if (
    !Number.isSafeInteger(file.size) ||
    file.size <= 0 ||
    file.size > MAX_UPLOAD_BYTES
  ) {
    throw uploadError("payload_too_large", "Tamanho de arquivo inválido.");
  }
  return Object.freeze({
    name: file.name,
    type: expectedType,
    size: file.size,
  });
}

function normalizePermissions(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw uploadError("permission_required", "Permissão de upload ausente.");
  }
  return new Set(value);
}

function optionalText(value, name, maximum, allowEmpty = false) {
  if (value === undefined || value === null) return value;
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    value.length > maximum ||
    (!allowEmpty && value.length === 0)
  ) {
    throw uploadError("invalid_upload", `${name} inválido.`);
  }
  return value;
}

function normalizeInput(input) {
  if (!plainObject(input))
    throw uploadError("invalid_upload", "Envio inválido.");
  const file = input.file;
  const fileMetadata = validateUploadFile(file);
  const permissions = normalizePermissions(input.permissions);
  const existingDocument =
    input.documentId !== undefined && input.documentId !== null;

  if (existingDocument) {
    if (!permissions.has("create_version")) {
      throw uploadError("permission_required", "Permissão de upload ausente.");
    }
    return Object.freeze({
      file,
      fileMetadata,
      permissions: Object.freeze([...permissions]),
      documentId: identifier(input.documentId, "Documento"),
      createDocument: false,
    });
  }

  if (!permissions.has("create")) {
    throw uploadError("permission_required", "Permissão de upload ausente.");
  }
  const title = optionalText(input.title, "Título", 500);
  const description = optionalText(
    input.description ?? "",
    "Descrição",
    4_000,
    true,
  );
  const collectionId =
    input.collectionId === null || input.collectionId === undefined
      ? null
      : identifier(input.collectionId, "Coleção");
  if (!CLASSIFICATIONS.has(input.classification)) {
    throw uploadError("invalid_upload", "Classificação inválida.");
  }
  if (!INDEXING_POLICIES.has(input.indexingPolicy)) {
    throw uploadError("invalid_upload", "Política de indexação inválida.");
  }
  return Object.freeze({
    file,
    fileMetadata,
    permissions: Object.freeze([...permissions]),
    documentId: null,
    createDocument: true,
    title,
    description,
    collectionId,
    classification: input.classification,
    indexingPolicy: input.indexingPolicy,
  });
}

function normalizeSession(payload, expectedDocumentId, expectedSize, now) {
  const session = payload?.upload_session;
  if (
    !plainObject(session) ||
    session.state !== "pending" ||
    session.document_id !== expectedDocumentId ||
    !Number.isSafeInteger(session.maximum_size_bytes) ||
    session.maximum_size_bytes < expectedSize ||
    session.maximum_size_bytes > MAX_UPLOAD_BYTES ||
    typeof session.expires_at !== "string" ||
    !Number.isFinite(Date.parse(session.expires_at)) ||
    Date.parse(session.expires_at) <= now
  ) {
    throw uploadError("unexpected_response", "Sessão de upload inválida.");
  }
  return Object.freeze({
    uploadId: identifier(session.upload_id, "Sessão"),
    versionId: identifier(session.version_id, "Versão"),
    expiresAt: session.expires_at,
  });
}

function normalizeCompletion(payload, uploadId, versionId) {
  const session = payload?.upload_session;
  const job = payload?.job;
  if (
    !plainObject(session) ||
    !plainObject(job) ||
    session.upload_id !== uploadId ||
    session.version_id !== versionId ||
    session.state !== "completed" ||
    job.state !== "pending"
  ) {
    throw uploadError("unexpected_response", "Conclusão de upload inválida.");
  }
  return Object.freeze({ jobId: identifier(job.job_id, "Job") });
}

function normalizeJob(payload, expectedJobId) {
  const job = payload?.job;
  if (
    !plainObject(job) ||
    job.job_id !== expectedJobId ||
    !JOB_STATUSES.has(job.status) ||
    !Number.isSafeInteger(job.attempt_count) ||
    !Number.isSafeInteger(job.maximum_attempts)
  ) {
    throw uploadError(
      "unexpected_response",
      "Estado de processamento inválido.",
    );
  }
  return Object.freeze({
    jobId: job.job_id,
    status: job.status,
    attemptCount: job.attempt_count,
    maximumAttempts: job.maximum_attempts,
    lastErrorCode:
      typeof job.last_error_code === "string" ? job.last_error_code : null,
  });
}

function normalizeVersion(payload, expectedDocumentId, expectedVersionId) {
  if (!Array.isArray(payload?.items)) {
    throw uploadError("unexpected_response", "Estado da versão inválido.");
  }
  const version = payload.items.find(
    (item) =>
      item?.documentId === expectedDocumentId &&
      item?.versionId === expectedVersionId,
  );
  const statusKeys = [
    "uploadStatus",
    "securityStatus",
    "previewStatus",
    "extractionStatus",
    "indexingStatus",
    "publicationStatus",
  ];
  if (
    !plainObject(version) ||
    statusKeys.some((key) => typeof version[key] !== "string")
  ) {
    throw uploadError("unexpected_response", "Estado da versão inválido.");
  }
  return Object.freeze(
    Object.fromEntries(statusKeys.map((key) => [key, version[key]])),
  );
}

function processingSnapshot(job, version) {
  return Object.freeze({
    ...version,
    jobStatus: job.status,
  });
}

function processingOutcome(job, version) {
  if (version.securityStatus === "rejected") {
    return "security_failed";
  }
  if (job.status === "dead_lettered" || job.status === "cancelled") {
    return "processing_failed";
  }
  if (job.status !== "succeeded") return null;
  if (
    version.uploadStatus !== "uploaded" ||
    version.previewStatus === "failed" ||
    version.extractionStatus === "failed" ||
    version.indexingStatus === "failed"
  ) {
    return "processing_failed";
  }
  if (version.securityStatus !== "clean") return "processing_failed";
  return "succeeded";
}

function defaultWait(milliseconds, signal) {
  if (signal?.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener?.("abort", abort);
      resolve();
    };
    const timer = globalThis.setTimeout(finish, milliseconds);
    const abort = () => {
      globalThis.clearTimeout(timer);
      signal?.removeEventListener?.("abort", abort);
      reject(signal.reason);
    };
    signal?.addEventListener?.("abort", abort, { once: true });
  });
}

async function sha256Hex(file, cryptoImpl, signal) {
  if (signal.aborted) throw signal.reason;
  const bytes = await file.arrayBuffer();
  try {
    if (signal.aborted) throw signal.reason;
    const digest = await cryptoImpl.subtle.digest("SHA-256", bytes);
    if (signal.aborted) throw signal.reason;
    return [...new Uint8Array(digest)]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  } finally {
    new Uint8Array(bytes).fill(0);
  }
}

export function createDocumentUploadController(options = {}) {
  const client = options.client;
  const onState = options.onState ?? (() => {});
  const cryptoImpl = options.cryptoImpl ?? globalThis.crypto;
  const createRequestId =
    options.createRequestId ?? (() => cryptoImpl.randomUUID());
  const wait = options.wait ?? defaultWait;
  const now = options.now ?? (() => Date.now());
  const maximumPollingMs =
    options.maximumPollingMs ?? DEFAULT_MAXIMUM_POLLING_MS;

  if (
    !client ||
    typeof client.request !== "function" ||
    typeof onState !== "function" ||
    !cryptoImpl?.subtle?.digest ||
    typeof createRequestId !== "function" ||
    typeof wait !== "function" ||
    typeof now !== "function" ||
    !Number.isSafeInteger(maximumPollingMs) ||
    maximumPollingMs < 1
  ) {
    throw new TypeError("Dependências obrigatórias do upload estão ausentes.");
  }

  let destroyed = false;
  let generation = 0;
  let active = null;
  let currentState = Object.freeze({ status: "idle" });
  let lastInput = null;
  let lastResume = null;
  let lastAttempt = null;

  function setState(value) {
    currentState = Object.freeze(value);
    onState(currentState);
    return currentState;
  }

  function isActive(context) {
    return (
      !destroyed &&
      active === context &&
      generation === context.generation &&
      !context.controller.signal.aborted
    );
  }

  function emit(context, status, extra = {}) {
    if (!isActive(context)) return currentState;
    return setState({
      status,
      ...(context.documentId ? { documentId: context.documentId } : {}),
      ...(context.versionId ? { versionId: context.versionId } : {}),
      ...(context.jobId ? { jobId: context.jobId } : {}),
      ...extra,
    });
  }

  async function requestWithRetry(target, requestOptions, context) {
    let attempt = 0;
    while (true) {
      try {
        return await client.request(target, {
          ...requestOptions,
          signal: context.controller.signal,
        });
      } catch (error) {
        if (attempt >= 1 || error?.retriable !== true || !isActive(context)) {
          throw error;
        }
        attempt += 1;
        await wait(250, context.controller.signal);
      }
    }
  }

  async function abortIncomplete(context) {
    if (!context.uploadId || context.completed || context.completionStarted) {
      return;
    }
    try {
      await client.request(
        `/v1/upload-sessions/${encodeURIComponent(context.uploadId)}`,
        {
          method: "DELETE",
        },
      );
    } catch {
      // O reconciliador do Worker permanece responsável por sessões órfãs.
    }
  }

  async function poll(context) {
    const startedAt = now();
    let attempt = 0;
    emit(context, "processing", {
      canCancel: true,
      processing: null,
    });

    while (isActive(context)) {
      if (now() - startedAt > maximumPollingMs) {
        lastInput = null;
        lastAttempt = null;
        lastResume = Object.freeze({
          documentId: context.documentId,
          versionId: context.versionId,
          jobId: context.jobId,
        });
        active = null;
        return setState({
          status: "timeout",
          documentId: context.documentId,
          versionId: context.versionId,
          jobId: context.jobId,
          canRetry: true,
          message: "O processamento continua em segundo plano.",
        });
      }

      const [jobResponse, versionsResponse] = await Promise.all([
        client.request(`/v1/jobs/${encodeURIComponent(context.jobId)}`, {
          signal: context.controller.signal,
        }),
        client.request(
          `/v1/documents/${encodeURIComponent(context.documentId)}/versions`,
          { signal: context.controller.signal },
        ),
      ]);
      if (!isActive(context)) return currentState;
      const job = normalizeJob(jobResponse.data, context.jobId);
      const version = normalizeVersion(
        versionsResponse.data,
        context.documentId,
        context.versionId,
      );
      const snapshot = processingSnapshot(job, version);
      const outcome = processingOutcome(job, version);
      if (outcome !== null) {
        lastInput = null;
        lastAttempt = null;
        lastResume = null;
        active = null;
        return setState({
          status: outcome,
          documentId: context.documentId,
          versionId: context.versionId,
          jobId: context.jobId,
          processing: snapshot,
          canRetry: false,
          ...(outcome === "security_failed"
            ? {
                message:
                  "O arquivo foi rejeitado pela verificação de segurança.",
              }
            : outcome === "processing_failed"
              ? {
                  message:
                    "Não foi possível concluir o processamento do arquivo.",
                }
              : {}),
        });
      }

      emit(context, "processing", {
        canCancel: true,
        processing: snapshot,
      });
      const delay =
        POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)];
      attempt += 1;
      await wait(delay, context.controller.signal);
    }
    return currentState;
  }

  function createAttempt(input, normalized) {
    const documentId = normalized.createDocument
      ? identifier(createRequestId(), "Documento")
      : normalized.documentId;
    return {
      input: Object.freeze({ ...input }),
      sha256: null,
      documentId,
      documentConfirmed: !normalized.createDocument,
      documentIdempotencyKey: normalized.createDocument
        ? identifier(createRequestId(), "Idempotência")
        : null,
      sessionIdempotencyKey: identifier(createRequestId(), "Idempotência"),
      uploadId: null,
      versionId: null,
      bytesUploaded: false,
      completionIdempotencyKey: identifier(createRequestId(), "Idempotência"),
      completionStarted: false,
      jobId: null,
    };
  }

  function resetRejectedSession(attempt) {
    attempt.sessionIdempotencyKey = identifier(
      createRequestId(),
      "Idempotência",
    );
    attempt.uploadId = null;
    attempt.versionId = null;
    attempt.bytesUploaded = false;
    attempt.completionIdempotencyKey = identifier(
      createRequestId(),
      "Idempotência",
    );
    attempt.completionStarted = false;
    attempt.jobId = null;
  }

  async function run(input, preservedAttempt = null) {
    if (destroyed) throw new TypeError("Upload encerrado.");
    if (active) cancel();
    generation += 1;
    lastInput = Object.freeze({ ...input });
    if (preservedAttempt === null) {
      // Uma nova submissão substitui integralmente a intenção anterior,
      // inclusive quando falha na validação local antes de criar contexto.
      lastAttempt = null;
      lastResume = null;
    }
    let normalized;
    try {
      normalized = normalizeInput(input);
    } catch (error) {
      const errorCode =
        typeof error?.code === "string" ? error.code : "unexpected_response";
      return setState({
        status: "error",
        errorCode,
        canRetry: errorCode !== "permission_required",
        message: publicFailure(errorCode),
      });
    }
    const attempt = preservedAttempt ?? createAttempt(input, normalized);
    lastAttempt = attempt;
    const context = {
      generation,
      controller: new AbortController(),
      documentId: attempt.documentId,
      uploadId: attempt.uploadId,
      versionId: attempt.versionId,
      jobId: attempt.jobId,
      completed: Boolean(attempt.jobId),
      completionStarted: attempt.completionStarted,
      attempt,
    };
    active = context;
    lastResume = null;

    try {
      emit(context, "validating");
      emit(context, "hashing");
      const sha256 =
        attempt.sha256 ??
        (await sha256Hex(
          normalized.file,
          cryptoImpl,
          context.controller.signal,
        ));
      attempt.sha256 = sha256;
      if (!isActive(context)) return currentState;

      if (!attempt.documentConfirmed) {
        emit(context, "creating_document");
        const created = await requestWithRetry(
          "/v1/documents",
          {
            method: "POST",
            headers: {
              "Idempotency-Key": attempt.documentIdempotencyKey,
            },
            body: {
              document_id: attempt.documentId,
              collection_id: normalized.collectionId,
              title: normalized.title,
              description: normalized.description,
              classification: normalized.classification,
              indexing_policy: normalized.indexingPolicy,
            },
          },
          context,
        );
        if (
          created.data?.document?.documentId !== attempt.documentId ||
          !isActive(context)
        ) {
          throw uploadError(
            "unexpected_response",
            "Documento criado inválido.",
          );
        }
        attempt.documentConfirmed = true;
      }

      if (!attempt.uploadId) {
        emit(context, "creating_session");
        const sessionResponse = await requestWithRetry(
          `/v1/documents/${encodeURIComponent(context.documentId)}/upload-sessions`,
          {
            method: "POST",
            headers: {
              "Idempotency-Key": attempt.sessionIdempotencyKey,
            },
            body: {
              file_name: normalized.fileMetadata.name,
              content_type: normalized.fileMetadata.type,
              size_bytes: normalized.fileMetadata.size,
              sha256,
            },
          },
          context,
        );
        const session = normalizeSession(
          sessionResponse.data,
          context.documentId,
          normalized.fileMetadata.size,
          now(),
        );
        attempt.uploadId = session.uploadId;
        attempt.versionId = session.versionId;
        context.uploadId = session.uploadId;
        context.versionId = session.versionId;
      }

      if (!attempt.bytesUploaded) {
        emit(context, "uploading", { canCancel: true });
        await requestWithRetry(
          `/v1/upload-sessions/${encodeURIComponent(context.uploadId)}/bytes`,
          {
            method: "PUT",
            headers: {
              "Content-Type": normalized.fileMetadata.type,
              "X-Content-SHA256": sha256,
            },
            body: normalized.file,
            timeoutMs: UPLOAD_BYTES_TIMEOUT_MS,
          },
          context,
        );
        attempt.bytesUploaded = true;
      }

      if (!attempt.jobId) {
        emit(context, "completing", { canCancel: true });
        attempt.completionStarted = true;
        context.completionStarted = true;
        const completionResponse = await requestWithRetry(
          `/v1/upload-sessions/${encodeURIComponent(context.uploadId)}/complete`,
          {
            method: "POST",
            headers: {
              "Idempotency-Key": attempt.completionIdempotencyKey,
            },
          },
          context,
        );
        const completion = normalizeCompletion(
          completionResponse.data,
          context.uploadId,
          context.versionId,
        );
        attempt.jobId = completion.jobId;
        context.jobId = completion.jobId;
        context.completed = true;
      }
      lastResume = Object.freeze({
        documentId: context.documentId,
        versionId: context.versionId,
        jobId: context.jobId,
      });
      return await poll(context);
    } catch (error) {
      if (!isActive(context)) return currentState;
      const errorCode =
        typeof error?.code === "string" ? error.code : "unexpected_response";
      const ambiguous =
        AMBIGUOUS_REQUEST_ERRORS.has(errorCode) || context.completionStarted;
      if (!ambiguous) {
        await abortIncomplete(context);
        if (
          context.uploadId &&
          !context.completed &&
          !context.completionStarted
        ) {
          resetRejectedSession(attempt);
        }
      }
      if (!isActive(context)) return currentState;
      active = null;
      return setState({
        status: "error",
        ...(context.documentId ? { documentId: context.documentId } : {}),
        ...(context.versionId ? { versionId: context.versionId } : {}),
        errorCode,
        canRetry: true,
        message: publicFailure(errorCode),
      });
    }
  }

  async function resume(resumeInput = lastResume) {
    if (destroyed) throw new TypeError("Upload encerrado.");
    if (!plainObject(resumeInput)) {
      return setState({
        status: "error",
        errorCode: "invalid_upload",
        canRetry: false,
        message: publicFailure("invalid_upload"),
      });
    }
    if (active) cancel();
    generation += 1;
    const context = {
      generation,
      controller: new AbortController(),
      documentId: identifier(resumeInput.documentId, "Documento"),
      uploadId: null,
      versionId: identifier(resumeInput.versionId, "Versão"),
      jobId: identifier(resumeInput.jobId, "Job"),
      completed: true,
      completionStarted: true,
    };
    active = context;
    lastResume = Object.freeze({
      documentId: context.documentId,
      versionId: context.versionId,
      jobId: context.jobId,
    });
    try {
      return await poll(context);
    } catch (error) {
      if (!isActive(context)) return currentState;
      active = null;
      const errorCode =
        typeof error?.code === "string" ? error.code : "unexpected_response";
      return setState({
        status: "processing_failed",
        documentId: context.documentId,
        versionId: context.versionId,
        jobId: context.jobId,
        errorCode,
        canRetry: true,
        message: publicFailure(errorCode),
      });
    }
  }

  function cancel() {
    if (!active) {
      lastInput = null;
      lastAttempt = null;
      lastResume = null;
      return currentState;
    }
    const context = active;
    generation += 1;
    active = null;
    context.controller.abort(new DOMException("Cancelado", "AbortError"));
    void abortIncomplete(context);
    lastInput = null;
    lastAttempt = null;
    lastResume = context.completed ? lastResume : null;
    return setState({
      status: "cancelled",
      ...(context.documentId ? { documentId: context.documentId } : {}),
      ...(context.versionId ? { versionId: context.versionId } : {}),
    });
  }

  return Object.freeze({
    start: run,
    resume,
    async retry(overrides = {}) {
      if (lastResume) return resume(lastResume);
      if (lastAttempt) return run(lastAttempt.input, lastAttempt);
      if (!lastInput) return currentState;
      return run({ ...lastInput, ...overrides });
    },
    cancel,
    getState: () => currentState,
    destroy() {
      if (destroyed) return;
      cancel();
      destroyed = true;
      lastInput = null;
      lastAttempt = null;
      lastResume = null;
    },
  });
}
