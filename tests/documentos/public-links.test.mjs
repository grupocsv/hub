import assert from "node:assert/strict";
import test from "node:test";

import {
  createPublicLinksController,
  derivePublicLinkCapabilities,
  normalizePublicLinksPayload,
  normalizeTenantPublicLinksPage,
} from "../../docs/public/documentos/assets/public-links.js";

test("normaliza links públicos e não confunde classificação pública com URL pública", () => {
  const normalized = normalizePublicLinksPayload({
    items: [
      {
        link_id: "link-a",
        document_id: "document-a",
        slug: "manual-seguro",
        public_url: "https://documentos-api.grupocsv.com/s/manual-seguro",
        status: "active",
        expires_at: null,
        allow_download: false,
        created_at: "2026-08-24T10:00:00.000Z",
      },
    ],
  }, "document-a");

  assert.deepEqual(normalized[0], {
    linkId: "link-a",
    documentId: "document-a",
    versionId: null,
    documentTitle: null,
    tenantId: null,
    slug: "manual-seguro",
    publicUrl: "https://documentos-api.grupocsv.com/s/manual-seguro",
    status: "active",
    expiresAt: null,
    allowDownload: false,
    createdAt: "2026-08-24T10:00:00.000Z",
  });
  assert.throws(
    () => normalizePublicLinksPayload({ items: [{ ...normalized[0], publicUrl: "javascript:alert(1)" }] }, "document-a"),
    /link público/i,
  );
});

test("normaliza e pagina o painel tenant-wide até o cursor final", async () => {
  const page = normalizeTenantPublicLinksPage({
    items: [{
      link_id: "link-a",
      document_id: "document-a",
      version_id: "version-a",
      document_title: "Manual Institucional",
      tenant_id: "unimed",
      slug: "manual-seguro",
      public_url: "https://documentos-api.grupocsv.com/s/manual-seguro",
      status: "active",
      expires_at: null,
      allow_download: true,
      created_at: "2026-08-24T10:00:00.000Z",
    }],
    next_cursor: "cursor-seguro",
  });
  assert.equal(page.items[0].documentTitle, "Manual Institucional");
  assert.equal(page.items[0].tenantId, "unimed");
  assert.equal(page.items[0].versionId, "version-a");
  assert.equal(page.nextCursor, "cursor-seguro");

  const calls = [];
  const controller = createPublicLinksController({
    client: {
      async request(target) {
        calls.push(target);
        const link = {
          link_id: target.includes("cursor=") ? "link-b" : "link-a",
          document_id: "document-a",
          slug: target.includes("cursor=") ? "segundo-link" : "primeiro-link",
          public_url: `https://documentos-api.grupocsv.com/s/${target.includes("cursor=") ? "segundo-link" : "primeiro-link"}`,
          status: "active",
          expires_at: null,
          allow_download: false,
          created_at: "2026-08-24T10:00:00.000Z",
        };
        return {
          data: {
            items: [link],
            next_cursor: target.includes("cursor=") ? null : "cursor com espaço",
          },
        };
      },
    },
  });
  const items = await controller.listAll();
  assert.deepEqual(calls, [
    "/v1/public-links?limit=100",
    "/v1/public-links?limit=100&cursor=cursor+com+espa%C3%A7o",
  ]);
  assert.deepEqual(items.map(({ linkId }) => linkId), ["link-a", "link-b"]);
});

test("deriva capacidades somente de permissões explícitas", () => {
  assert.deepEqual(
    derivePublicLinkCapabilities(["read_public_links", "create_public_link"]),
    { read: true, create: true, update: false },
  );
  assert.deepEqual(derivePublicLinkCapabilities(["manage_public_links"]), {
    read: true,
    create: true,
    update: true,
  });
  assert.deepEqual(derivePublicLinkCapabilities(["read"]), {
    read: false,
    create: false,
    update: false,
  });
});

test("usa os paths e payloads snake_case definidos pelo backend", async () => {
  const calls = [];
  const client = {
    async request(target, options = {}) {
      calls.push([target, options]);
      if (!options.method) return { data: { items: [] } };
      if (options.method === "POST") {
        return {
          data: {
            public_link: {
              link_id: "link-a",
              document_id: "document-a",
              slug: options.body.slug,
              public_url: `https://documentos-api.grupocsv.com/s/${options.body.slug}`,
              status: "active",
              expires_at: options.body.expires_at,
              allow_download: options.body.allow_download,
              created_at: "2026-08-24T10:00:00.000Z",
            },
          },
        };
      }
      return {
        data: {
          public_link: {
            link_id: "link-a",
            document_id: "document-a",
            slug: "manual-seguro",
            public_url: "https://documentos-api.grupocsv.com/s/manual-seguro",
            status: options.body.status,
            expires_at: null,
            allow_download: false,
            created_at: "2026-08-24T10:00:00.000Z",
          },
        },
      };
    },
  };
  let requestId = 0;
  const controller = createPublicLinksController({
    client,
    createRequestId: () => `public-link-attempt-${++requestId}`,
  });

  assert.deepEqual(await controller.list("document-a"), []);
  const created = await controller.create("document-a", {
    versionId: "version-a",
    slug: "manual-seguro",
    expiresAt: null,
    allowDownload: false,
  });
  assert.equal(created.publicUrl, "https://documentos-api.grupocsv.com/s/manual-seguro");
  const updated = await controller.update("document-a", "link-a", {
    status: "inactive",
  });
  assert.equal(updated.status, "inactive");

  assert.deepEqual(calls, [
    ["/v1/documents/document-a/public-links?limit=100", {}],
    [
      "/v1/documents/document-a/public-links",
      {
        method: "POST",
        body: {
          version_id: "version-a",
          slug: "manual-seguro",
          expires_at: null,
          allow_download: false,
        },
        headers: new Headers({ "Idempotency-Key": "public-link-attempt-1" }),
      },
    ],
    [
      "/v1/documents/document-a/public-links/link-a",
      {
        method: "PATCH",
        body: { status: "inactive" },
        headers: new Headers({ "Idempotency-Key": "public-link-attempt-2" }),
      },
    ],
  ]);
});

test("rejeita slug, URL, expiração e patch fora do contrato antes da rede", async () => {
  let requests = 0;
  const controller = createPublicLinksController({
    client: { request: async () => { requests += 1; } },
  });

  await assert.rejects(
    () => controller.create("document-a", { versionId: "version-a", slug: "../../segredo", allowDownload: false }),
    /slug/i,
  );
  for (const slug of ["ab", "a".repeat(49), "com--duplo", "-inicio", "fim-"]) {
    await assert.rejects(
      () => controller.create("document-a", { versionId: "version-a", slug, allowDownload: false }),
      /3 a 48 caracteres/i,
    );
  }
  for (const slug of ["admin", "api", "docs", "health", "login", "openapi"]) {
    await assert.rejects(
      () => controller.create("document-a", { versionId: "version-a", slug, allowDownload: false }),
      /reservado/i,
    );
  }
  await assert.rejects(
    () => controller.create("document-a", { versionId: "version-a", slug: "arquivo", expiresAt: "ontem", allowDownload: false }),
    /expiração/i,
  );
  await assert.rejects(
    () => controller.update("document-a", "link-a", { status: "revoked" }),
    /alteração/i,
  );
  assert.equal(requests, 0);
});

test("envia somente filtros confirmados e pagina links do documento", async () => {
  const calls = [];
  const item = (slug, linkId) => ({
    link_id: linkId,
    document_id: "document-a",
    version_id: "version-a",
    slug,
    public_url: `https://documentos-api.grupocsv.com/s/${slug}`,
    status: "active",
    expires_at: null,
    allow_download: false,
    created_at: "2026-08-24T10:00:00.000Z",
  });
  const controller = createPublicLinksController({
    client: {
      async request(target) {
        calls.push(target);
        const second = target.includes("cursor=");
        return {
          data: {
            items: [item(second ? "manual-dois" : "manual-um", second ? "link-b" : "link-a")],
            next_cursor: second ? null : "doc-page-2",
          },
        };
      },
    },
  });
  const documentItems = await controller.list("document-a");
  assert.equal(documentItems.length, 2);
  assert.deepEqual(calls, [
    "/v1/documents/document-a/public-links?limit=100",
    "/v1/documents/document-a/public-links?limit=100&cursor=doc-page-2",
  ]);

  calls.length = 0;
  await controller.listAll({
    status: "inactive",
    slug: "manual-dois",
    documentId: "document-a",
  });
  assert.equal(
    calls[0],
    "/v1/public-links?limit=100&status=inactive&slug=manual-dois&document_id=document-a",
  );
  await assert.rejects(
    () => controller.listAll({ tenantId: "tenant-a" }),
    /filtros/i,
  );
});

test("repassa o mesmo AbortSignal em todas as páginas tenant-wide", async () => {
  const controller = new AbortController();
  const signals = [];
  const links = createPublicLinksController({
    client: {
      async request(target, options) {
        signals.push(options.signal);
        return {
          data: {
            items: [],
            next_cursor: target.includes("cursor=") ? null : "page-2",
          },
        };
      },
    },
  });
  await links.listAll({ status: "active" }, { signal: controller.signal });
  assert.deepEqual(signals, [controller.signal, controller.signal]);
});
