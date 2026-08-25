import assert from "node:assert/strict";
import test from "node:test";

import {
  createDeletionAdminController,
  deriveDeletionAdminCapabilities,
  normalizeDeletionRequestsPage,
  normalizeDeletionRequestsPayload,
} from "../../docs/public/documentos/assets/deletion-admin.js";

test("normaliza solicitações de exclusão sem prometer eliminação física", () => {
  const items = normalizeDeletionRequestsPayload({
    items: [{
      request_id: "request-a",
      document_id: "document-a",
      document_title: "Norma institucional",
      reason: "Prazo encerrado",
      status: "executed",
      created_at: "2026-08-24T10:00:00.000Z",
      requested_by: { type: "user", id: "user-a" },
    }],
  });

  assert.deepEqual(items[0], {
    requestId: "request-a",
    documentId: "document-a",
    documentTitle: "Norma institucional",
    reason: "Prazo encerrado",
    status: "executed",
    requestedAt: "2026-08-24T10:00:00.000Z",
    requestedBy: "user-a",
  });

  const legacy = normalizeDeletionRequestsPayload({
    items: [{
      request_id: "request-legacy",
      document_id: "document-a",
      reason: "Compatibilidade",
      status: "requested",
      requested_at: "2026-08-23T10:00:00.000Z",
    }],
  });
  assert.equal(legacy[0].requestedAt, "2026-08-23T10:00:00.000Z");
});

test("pagina solicitações de exclusão por cursor até o fim", async () => {
  const page = normalizeDeletionRequestsPage({
    items: [{
      request_id: "request-a",
      document_id: "document-a",
      reason: "Prazo encerrado",
      status: "requested",
      created_at: "2026-08-24T10:00:00.000Z",
    }],
    next_cursor: "deletion-page-2",
  });
  assert.equal(page.nextCursor, "deletion-page-2");

  const calls = [];
  const controller = createDeletionAdminController({
    client: {
      async request(target) {
        calls.push(target);
        const secondPage = target.includes("cursor=");
        return {
          data: {
            items: [{
              request_id: secondPage ? "request-b" : "request-a",
              document_id: "document-a",
              reason: "Prazo encerrado",
              status: secondPage ? "executed" : "requested",
              created_at: "2026-08-24T10:00:00.000Z",
            }],
            next_cursor: secondPage ? null : "deletion page 2",
          },
        };
      },
    },
  });
  const items = await controller.list();
  assert.deepEqual(calls, [
    "/v1/deletion-requests",
    "/v1/deletion-requests?cursor=deletion+page+2",
  ]);
  assert.deepEqual(items.map(({ requestId }) => requestId), [
    "request-a",
    "request-b",
  ]);
});

test("permissões separam revisão administrativa e cancelamento", () => {
  assert.deepEqual(
    deriveDeletionAdminCapabilities(["review_deletion_requests"]),
    { read: true, review: true, cancel: false },
  );
  assert.deepEqual(
    deriveDeletionAdminCapabilities(["cancel_deletion_request"]),
    { read: true, review: false, cancel: true },
  );
  assert.deepEqual(
    deriveDeletionAdminCapabilities(["manage_deletion_requests"]),
    { read: true, review: true, cancel: true },
  );
});

test("lista e decide solicitações nos endpoints confirmados", async () => {
  const calls = [];
  const client = {
    async request(target, options = {}) {
      calls.push([target, options]);
      if (!options.method) return { data: { items: [] } };
      return {
        data: {
          request: {
            request_id: "request-a",
            document_id: "document-a",
            reason: "Prazo encerrado",
            status: target.endsWith("/approve")
              ? "executed"
              : target.endsWith("/reject")
                ? "rejected"
                : "cancelled",
            created_at: "2026-08-24T10:00:00.000Z",
          },
        },
      };
    },
  };
  let requestId = 0;
  const controller = createDeletionAdminController({
    client,
    createRequestId: () => `deletion-attempt-${++requestId}`,
  });
  await controller.list();
  await controller.decide("request-a", "approve");
  await controller.decide("request-a", "reject");
  await controller.decide("request-a", "cancel");

  assert.deepEqual(calls, [
    ["/v1/deletion-requests", {}],
    ["/v1/deletion-requests/request-a/approve", {
      method: "POST",
      body: {},
      headers: new Headers({ "Idempotency-Key": "deletion-attempt-1" }),
    }],
    ["/v1/deletion-requests/request-a/reject", {
      method: "POST",
      body: {},
      headers: new Headers({ "Idempotency-Key": "deletion-attempt-2" }),
    }],
    ["/v1/deletion-requests/request-a/cancel", {
      method: "POST",
      body: {},
      headers: new Headers({ "Idempotency-Key": "deletion-attempt-3" }),
    }],
  ]);
});

test("recusa ação fora do contrato antes da rede", async () => {
  let requests = 0;
  const controller = createDeletionAdminController({
    client: { request: async () => { requests += 1; } },
  });
  await assert.rejects(() => controller.decide("request-a", "delete"), /ação/i);
  assert.equal(requests, 0);
});
