import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  COMPASS_COLLECTION,
  buildDesiredDocuments,
  parseCliArgs,
  synchronizeCompassCentralCatalog,
} from "../../scripts/compass-v2/sync-central-catalog.mjs";

const TOKEN = "credencial-de-teste-que-nao-deve-aparecer-no-plano";

function catalogFixture() {
  return {
    schemaVersion: 2,
    editions: [
      {
        number: 2,
        year: 2026,
        title: "Segunda edição",
        summary: "Resumo editorial da segunda edição.",
      },
      {
        number: 1,
        year: 2026,
        title: "Primeira edição",
        summary: null,
        subtitle: null,
      },
    ],
  };
}

function jsonResponse(payload, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function statefulApi({ includeEtag = true } = {}) {
  const state = {
    collections: [],
    documents: new Map([
      [
        "compass-pdf-2026-001",
        {
          documentId: "compass-pdf-2026-001",
          collectionId: null,
          description: "",
          etag: 'W/"document-001-v1"',
        },
      ],
      [
        "compass-pdf-2026-002",
        {
          documentId: "compass-pdf-2026-002",
          collectionId: null,
          description: "",
          etag: 'W/"document-002-v1"',
        },
      ],
    ]),
    calls: [],
  };

  const fetchImpl = async (input, options = {}) => {
    const url = new URL(input);
    const method = options.method ?? "GET";
    const headers = new Headers(options.headers);
    const body = options.body ? JSON.parse(options.body) : null;
    state.calls.push({ pathname: url.pathname, method, headers, body });

    assert.equal(headers.get("authorization"), `Bearer ${TOKEN}`);
    assert.equal(headers.get("x-tenant-id"), "grupo-csv");

    if (url.pathname === "/v1/collections" && method === "GET") {
      return jsonResponse({ items: state.collections });
    }
    if (url.pathname === "/v1/collections" && method === "POST") {
      const collection = {
        collectionId: body.collection_id,
        parentId: body.parent_id,
        name: body.name,
        slug: body.slug,
        status: "active",
      };
      state.collections.push(collection);
      return jsonResponse({ collection }, { status: 201 });
    }

    const match = url.pathname.match(/^\/v1\/documents\/([^/]+)$/u);
    if (match) {
      const document = state.documents.get(decodeURIComponent(match[1]));
      if (!document) return jsonResponse({ error: "not found" }, { status: 404 });
      if (method === "GET") {
        return jsonResponse(
          { document },
          { headers: includeEtag ? { ETag: document.etag } : {} },
        );
      }
      if (method === "PATCH") {
        assert.equal(headers.get("if-match"), document.etag);
        document.collectionId = body.collection_id;
        document.description = body.description;
        document.etag = `${document.etag}-next`;
        return jsonResponse({ document }, { headers: { ETag: document.etag } });
      }
    }

    return jsonResponse({ error: "unexpected" }, { status: 500 });
  };

  return { state, fetchImpl };
}

test("deriva IDs e descrições determinísticas do catálogo, com fallback não vazio", () => {
  const documents = buildDesiredDocuments(catalogFixture());

  assert.deepEqual(
    documents.map((document) => document.documentId),
    ["compass-pdf-2026-001", "compass-pdf-2026-002"],
  );
  assert.equal(
    documents[0].description,
    "Edição 001/2026 do Compass™: Primeira edição.",
  );
  assert.equal(documents[1].description, "Resumo editorial da segunda edição.");
  assert.ok(documents.every((document) => document.collectionId === "compass"));
});

test("o catálogo canônico gera metadados para as oito edições existentes", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../../docs/compass/catalog.json", import.meta.url), "utf8"),
  );
  const documents = buildDesiredDocuments(catalog);

  assert.deepEqual(
    documents.map((document) => document.documentId),
    Array.from({ length: 8 }, (_, index) =>
      `compass-pdf-2026-${String(index + 1).padStart(3, "0")}`,
    ),
  );
  assert.ok(documents.every((document) => document.description.trim().length > 0));
});

test("dry-run é o padrão e não envia POST ou PATCH", async () => {
  const { state, fetchImpl } = statefulApi();
  const result = await synchronizeCompassCentralCatalog({
    catalog: catalogFixture(),
    token: TOKEN,
    fetchImpl,
  });

  assert.equal(result.mode, "dry-run");
  assert.equal(result.collection.action, "create");
  assert.equal(result.summary.collectionsToChange, 1);
  assert.equal(result.summary.documentsToChange, 2);
  assert.ok(state.calls.every((call) => call.method === "GET"));
  assert.doesNotMatch(JSON.stringify(result), new RegExp(TOKEN, "u"));
});

test("--apply cria a coleção e atualiza documentos com If-Match; segunda execução é no-op", async () => {
  const { state, fetchImpl } = statefulApi();
  const first = await synchronizeCompassCentralCatalog({
    catalog: catalogFixture(),
    token: TOKEN,
    apply: true,
    fetchImpl,
  });

  assert.equal(first.mode, "apply");
  assert.equal(first.summary.collectionsToChange, 1);
  assert.equal(first.summary.documentsToChange, 2);
  assert.deepEqual(state.collections, [{ ...COMPASS_COLLECTION, status: "active" }]);

  const patchCalls = state.calls.filter((call) => call.method === "PATCH");
  assert.equal(patchCalls.length, 2);
  assert.ok(patchCalls.every((call) => call.headers.has("if-match")));
  assert.ok(
    patchCalls.every(
      (call) =>
        call.body.collection_id === "compass" &&
        typeof call.body.description === "string" &&
        call.body.description.length > 0,
    ),
  );

  state.calls.length = 0;
  const second = await synchronizeCompassCentralCatalog({
    catalog: catalogFixture(),
    token: TOKEN,
    apply: true,
    fetchImpl,
  });

  assert.equal(second.summary.collectionsToChange, 0);
  assert.equal(second.summary.documentsToChange, 0);
  assert.equal(second.summary.documentsUnchanged, 2);
  assert.ok(state.calls.every((call) => call.method === "GET"));
});

test("falha fechado sem ETag antes de qualquer PATCH documental", async () => {
  const { state, fetchImpl } = statefulApi({ includeEtag: false });

  await assert.rejects(
    synchronizeCompassCentralCatalog({
      catalog: catalogFixture(),
      token: TOKEN,
      apply: true,
      fetchImpl,
    }),
    /não retornou ETag/u,
  );
  assert.ok(state.calls.every((call) => call.method === "GET"));
});

test("CLI não aceita credencial por argumento", () => {
  const defaults = parseCliArgs([]);
  assert.equal(defaults.apply, false);
  assert.equal(path.normalize(defaults.catalogPath).endsWith(path.normalize("docs/compass/catalog.json")), true);
  assert.equal(parseCliArgs(["--apply"]).apply, true);
  assert.throws(() => parseCliArgs(["--token", TOKEN]), /não reconhecido/u);
});
