import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HUB_ROOT = path.resolve(HERE, '../..');
const PUBLIC_ROOT = path.resolve(
  HUB_ROOT,
  process.env.DOCUMENTOS_E2E_PUBLIC_ROOT ?? path.join('docs', 'public'),
);
const PUBLIC_ROOT_RELATIVE = path.relative(HUB_ROOT, PUBLIC_ROOT);
if (
  PUBLIC_ROOT_RELATIVE.startsWith('..') ||
  path.isAbsolute(PUBLIC_ROOT_RELATIVE)
) {
  throw new Error('Raiz pública E2E deve permanecer dentro do repositório.');
}
const DEFAULT_PORT = 4178;
const VIEWER_TICKET = 'V'.repeat(43);

function makePdf() {
  const parts = [];
  const offsets = [0];
  let length = 0;
  const append = (value) => {
    const buffer = Buffer.from(value, 'latin1');
    parts.push(buffer);
    length += buffer.length;
  };
  const object = (number, body) => {
    offsets[number] = length;
    append(`${number} 0 obj\n${body}\nendobj\n`);
  };

  append('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(
    3,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
  );
  const stream = [
    'BT',
    '/F1 24 Tf',
    '72 720 Td',
    '(Hub Documentos - PDF seguro) Tj',
    '0 -36 Td',
    '/F1 14 Tf',
    '(Validacao local com Range autenticado.) Tj',
    'ET',
  ].join('\n');
  object(4, `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
  object(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  object(6, `<< /Length 145000 >>\nstream\n${'0'.repeat(145000)}\nendstream`);

  const xrefOffset = length;
  append('xref\n0 7\n');
  append('0000000000 65535 f \n');
  for (let number = 1; number <= 6; number += 1) {
    append(`${String(offsets[number]).padStart(10, '0')} 00000 n \n`);
  }
  append(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  return Buffer.concat(parts);
}

const PDF_BYTES = makePdf();
const RUNTIME_SOURCE = `globalThis.HUB_DOCUMENTOS_CONFIG = Object.freeze(${JSON.stringify({
  schemaVersion: 1,
  enabled: true,
  apiBaseUrl: 'https://documentos-api.grupocsv.com',
  enabledPortals: ['unimed'],
  features: {
    favorites: true,
    offline: false,
    search: true,
    upload: true,
    viewer: true,
  },
})});\n`;
const RUNTIME_INTEGRITY =
  `sha384-${createHash('sha384').update(RUNTIME_SOURCE).digest('base64')}`;

const BOOTSTRAP_SOURCE = `
(() => {
  const portal = 'unimed';
  const expires = '2099-01-01T00:00:00.000Z';
  localStorage.setItem('hub_auth_' + portal + '_token', 'sessao-local-sem-valor');
  localStorage.setItem('hub_auth_' + portal + '_email', 'teste.local@example.invalid');
  localStorage.setItem('hub_auth_' + portal + '_expires', expires);
  const originalFetch = globalThis.fetch.bind(globalThis);
  const pdfSize = ${PDF_BYTES.length};
  const ticket = '${VIEWER_TICKET}';
  const catalogDocuments = [
    {
      documentId: 'document-pdf',
      collectionId: 'collection-guides',
      tagIds: ['tag-security'],
      title: 'Manual Seguro em PDF',
      description: 'Documento sintético para validação local do viewer.',
      classification: 'internal',
      lifecycleStatus: 'active',
      updatedAt: '2026-07-25T20:00:00.000Z',
    },
    {
      documentId: 'document-privacy',
      collectionId: 'collection-policies',
      tagIds: ['tag-governance'],
      title: 'Política de Privacidade',
      description: 'Política institucional usada na busca e nos filtros.',
      classification: 'public',
      lifecycleStatus: 'active',
      updatedAt: '2026-07-24T12:00:00.000Z',
    },
    {
      documentId: 'document-archive',
      collectionId: 'collection-policies',
      tagIds: ['tag-governance'],
      title: 'Norma Arquivada',
      description: 'Documento usado para validar paginação e estados.',
      classification: 'confidential',
      lifecycleStatus: 'archived',
      updatedAt: '2026-07-20T10:00:00.000Z',
    },
  ];
  const favoriteDocumentIds = new Set(['document-privacy']);
  let uploadedDocumentId = null;
  let uploadedFile = null;
  let uploadBytesReceived = false;
  let uploadJobPoll = 0;
  globalThis.__DOCS_E2E_LOG = [];

  function json(payload, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'private, no-store',
        'x-request-id': '00000000-0000-4000-8000-000000000001',
        ...extraHeaders,
      },
    });
  }

  function byteHeaders(length, extra = {}) {
    return {
      'accept-ranges': 'bytes',
      'cache-control': 'private, no-store',
      'content-length': String(length),
      'content-type': 'application/pdf',
      etag: '"pdf-e2e-etag"',
      ...extra,
    };
  }

  function catalogItem(item) {
    return {
      ...item,
      favorite: favoriteDocumentIds.has(item.documentId),
    };
  }

  function documentById(documentId) {
    return catalogDocuments.find((item) => item.documentId === documentId) || null;
  }

  function requestBody(init) {
    if (typeof init.body !== 'string') return {};
    try {
      return JSON.parse(init.body);
    } catch {
      return {};
    }
  }

  function uploadedVersion(ready) {
    return {
      versionId: 'version-upload-e2e',
      documentId: uploadedDocumentId,
      uploadStatus: 'uploaded',
      securityStatus: ready ? 'clean' : 'scanning',
      previewStatus: ready ? 'ready' : 'pending',
      extractionStatus: ready ? 'ready' : 'pending',
      indexingStatus: ready ? 'indexed' : 'pending',
      publicationStatus: ready ? 'eligible' : 'draft',
      mimeDetected: uploadedFile.contentType,
      sizeBytes: uploadedFile.sizeBytes,
      originalName: uploadedFile.fileName,
    };
  }

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin !== 'https://documentos-api.grupocsv.com') {
      return originalFetch(input, init);
    }
    const headers = new Headers(init.headers || {});
    const method = (init.method || 'GET').toUpperCase();
    globalThis.__DOCS_E2E_LOG.push(Object.freeze({
      path: url.pathname,
      method,
      range: headers.get('range'),
      hasSession: headers.has('x-auth-token'),
      hasViewerTicket: headers.has('x-viewer-ticket'),
      hasContentSha256: headers.has('x-content-sha256'),
    }));
    document.documentElement.dataset.e2eRequests =
      JSON.stringify(globalThis.__DOCS_E2E_LOG);

    if (url.pathname === '/v1/collections') {
      return json({
        items: [
          { collectionId: 'collection-guides', name: 'Guias', slug: 'guias' },
          { collectionId: 'collection-policies', name: 'Políticas', slug: 'politicas' },
        ],
      });
    }
    if (url.pathname === '/v1/tags') {
      return json({
        items: [
          { tagId: 'tag-security', name: 'Segurança', slug: 'seguranca' },
          { tagId: 'tag-governance', name: 'Governança', slug: 'governanca' },
        ],
      });
    }
    if (url.pathname === '/v1/capabilities') {
      return json({ permissions: ['read', 'create'] });
    }
    if (url.pathname === '/v1/search' && method === 'POST') {
      const query = String(requestBody(init).query || '').toLocaleLowerCase('pt-BR');
      const results = catalogDocuments
        .filter((item) =>
          (item.title + ' ' + item.description).toLocaleLowerCase('pt-BR').includes(query)
        )
        .map((item) => ({
          document_id: item.documentId,
          version_id: item.documentId === 'document-pdf' ? 'version-pdf' : 'version-search',
          title: item.title,
          excerpt: item.description,
          score: 1,
        }));
      return json({ results });
    }
    if (url.pathname === '/v1/documents') {
      if (method === 'POST') {
        const body = requestBody(init);
        uploadedDocumentId = body.document_id;
        const created = {
          documentId: uploadedDocumentId,
          collectionId: body.collection_id,
          tagIds: [],
          title: body.title,
          description: body.description,
          classification: body.classification,
          lifecycleStatus: 'draft',
          indexingPolicy: body.indexing_policy,
          updatedAt: '2026-07-25T21:00:00.000Z',
        };
        catalogDocuments.unshift(created);
        return json({ document: catalogItem(created) }, 201);
      }

      let items = catalogDocuments.filter((item) => {
        if (
          url.searchParams.has('collection_id') &&
          item.collectionId !== url.searchParams.get('collection_id')
        ) return false;
        if (
          url.searchParams.has('classification') &&
          item.classification !== url.searchParams.get('classification')
        ) return false;
        if (
          url.searchParams.has('lifecycle_status') &&
          item.lifecycleStatus !== url.searchParams.get('lifecycle_status')
        ) return false;
        if (
          url.searchParams.has('tag_id') &&
          !item.tagIds.includes(url.searchParams.get('tag_id'))
        ) return false;
        if (
          url.searchParams.get('favorite') === 'true' &&
          !favoriteDocumentIds.has(item.documentId)
        ) return false;
        return true;
      });

      const hasFilters = [
        'collection_id',
        'classification',
        'lifecycle_status',
        'tag_id',
        'favorite',
      ].some((key) => url.searchParams.has(key));
      let nextCursor = null;
      if (!hasFilters && uploadedDocumentId === null) {
        if (url.searchParams.get('cursor') === 'cursor-e2e-2') {
          items = items.slice(2);
        } else {
          items = items.slice(0, 2);
          nextCursor = 'cursor-e2e-2';
        }
      }
      return json({
        items: items.map(catalogItem),
        next_cursor: nextCursor,
      });
    }

    const favoriteMatch =
      /^\\/v1\\/documents\\/([^/]+)\\/favorite$/u.exec(url.pathname);
    if (favoriteMatch && (method === 'POST' || method === 'DELETE')) {
      const documentId = decodeURIComponent(favoriteMatch[1]);
      if (method === 'POST') favoriteDocumentIds.add(documentId);
      else favoriteDocumentIds.delete(documentId);
      return new Response(null, {
        status: 204,
        headers: { 'cache-control': 'private, no-store' },
      });
    }

    const uploadSessionMatch =
      /^\\/v1\\/documents\\/([^/]+)\\/upload-sessions$/u.exec(url.pathname);
    if (uploadSessionMatch && method === 'POST') {
      const documentId = decodeURIComponent(uploadSessionMatch[1]);
      const body = requestBody(init);
      if (
        typeof body.file_name !== 'string' ||
        typeof body.content_type !== 'string' ||
        !Number.isSafeInteger(body.size_bytes) ||
        body.size_bytes < 1 ||
        !/^[a-f0-9]{64}$/u.test(body.sha256 || '')
      ) {
        return json(
          { error: { code: 'invalid_request', message: 'Envio inválido.' } },
          422,
        );
      }
      uploadedDocumentId = documentId;
      uploadedFile = {
        contentType: body.content_type,
        fileName: body.file_name,
        sha256: body.sha256,
        sizeBytes: body.size_bytes,
      };
      uploadBytesReceived = false;
      uploadJobPoll = 0;
      return json({
        upload_session: {
          upload_id: 'upload-e2e',
          document_id: documentId,
          version_id: 'version-upload-e2e',
          state: 'pending',
          maximum_size_bytes: 52428800,
          expires_at: '2099-01-01T00:00:00.000Z',
        },
      }, 201);
    }
    if (url.pathname === '/v1/upload-sessions/upload-e2e/bytes' && method === 'PUT') {
      if (
        !uploadedFile ||
        headers.get('content-type') !== uploadedFile.contentType ||
        headers.get('x-content-sha256') !== uploadedFile.sha256 ||
        init.body?.size !== uploadedFile.sizeBytes
      ) {
        return json(
          { error: { code: 'invalid_request', message: 'Integridade inválida.' } },
          422,
        );
      }
      uploadBytesReceived = true;
      return new Response(null, {
        status: 204,
        headers: { 'cache-control': 'private, no-store' },
      });
    }
    if (
      url.pathname === '/v1/upload-sessions/upload-e2e/complete' &&
      method === 'POST'
    ) {
      if (!uploadBytesReceived) {
        return json(
          { error: { code: 'conflict', message: 'Upload incompleto.' } },
          409,
        );
      }
      return json({
        upload_session: {
          upload_id: 'upload-e2e',
          version_id: 'version-upload-e2e',
          state: 'completed',
        },
        job: { job_id: 'job-upload-e2e', state: 'pending' },
      }, 202);
    }
    if (url.pathname === '/v1/upload-sessions/upload-e2e' && method === 'DELETE') {
      return new Response(null, {
        status: 204,
        headers: { 'cache-control': 'private, no-store' },
      });
    }
    if (url.pathname === '/v1/jobs/job-upload-e2e') {
      uploadJobPoll += 1;
      const ready = uploadJobPoll > 1;
      return json({
        job: {
          job_id: 'job-upload-e2e',
          type: 'process_version_v1',
          status: ready ? 'succeeded' : 'pending',
          attempt_count: ready ? 1 : 0,
          maximum_attempts: 5,
          last_error_code: null,
          created_at: '2026-07-25T21:00:00.000Z',
          updated_at: ready
            ? '2026-07-25T21:00:01.000Z'
            : '2026-07-25T21:00:00.000Z',
          completed_at: ready ? '2026-07-25T21:00:01.000Z' : null,
        },
      });
    }

    const versionsMatch =
      /^\\/v1\\/documents\\/([^/]+)\\/versions$/u.exec(url.pathname);
    if (versionsMatch && decodeURIComponent(versionsMatch[1]) === uploadedDocumentId) {
      return json({ items: [uploadedVersion(uploadJobPoll > 1)] });
    }

    const detailMatch = /^\\/v1\\/documents\\/([^/]+)$/u.exec(url.pathname);
    if (detailMatch) {
      const documentId = decodeURIComponent(detailMatch[1]);
      const documentItem = documentById(documentId);
      if (!documentItem) {
        return json(
          { error: { code: 'not_found', message: 'Recurso não encontrado.' } },
          404,
        );
      }
      return json(
        {
          document: {
            ...catalogItem(documentItem),
            indexingPolicy: documentItem.indexingPolicy || 'metadata_only',
            currentVersionId:
              documentId === 'document-pdf' ? 'version-pdf' : null,
          },
          permissions:
            documentId === 'document-pdf'
              ? ['read', 'create_version']
              : ['read'],
        },
        200,
        { etag: '"document-' + documentId + '-e2e-etag"' },
      );
    }
    if (url.pathname === '/v1/documents/document-pdf/versions') {
      return json({
        items: [{
          versionId: 'version-pdf',
          versionNumber: 1,
          publicationStatus: 'eligible',
          uploadStatus: 'uploaded',
          securityStatus: 'clean',
          mimeDetected: 'application/pdf',
          sizeBytes: pdfSize,
          originalName: 'manual-seguro.pdf',
        }],
      });
    }
    if (
      url.pathname ===
      '/v1/documents/document-pdf/versions/version-pdf/viewer-tickets'
    ) {
      return json({
        viewer_ticket: {
          token: ticket,
          expires_at: '2099-01-01T00:00:00.000Z',
        },
      }, 201);
    }
    if (
      url.pathname ===
      '/v1/documents/document-pdf/versions/version-pdf/bytes'
    ) {
      if (headers.get('x-viewer-ticket') !== ticket) {
        return json({ error: { code: 'not_found', message: 'Recurso não encontrado.' } }, 404);
      }
      if (method === 'HEAD') {
        return new Response(null, { status: 200, headers: byteHeaders(pdfSize) });
      }
      const range = /^bytes=(\\d+)-(\\d+)$/u.exec(headers.get('range') || '');
      if (!range) {
        const binary = Uint8Array.from(
          atob('${PDF_BYTES.toString('base64')}'),
          (character) => character.charCodeAt(0),
        );
        return new Response(binary, {
          status: 200,
          headers: byteHeaders(pdfSize),
        });
      }
      const begin = Number(range[1]);
      const end = Math.min(Number(range[2]), pdfSize - 1);
      const binary = Uint8Array.from(
        atob('${PDF_BYTES.toString('base64')}'),
        (character) => character.charCodeAt(0),
      );
      const body = binary.slice(begin, end + 1);
      return new Response(body, {
        status: 206,
        headers: byteHeaders(body.byteLength, {
          'content-range': 'bytes ' + begin + '-' + end + '/' + pdfSize,
        }),
      });
    }
    return json({ error: { code: 'not_found', message: 'Recurso não encontrado.' } }, 404);
  };
})();
`;

const AUTH_SOURCE = `
(() => {
  const script = document.currentScript;
  const portal = script?.dataset?.portal || 'unimed';
  globalThis.HUB_AUTH_READY = Promise.resolve({ status: 'valid', portal });
})();
`;

const PDF_SMOKE_HTML = `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="UTF-8"><title>PDF.js Smoke</title></head>
  <body data-result="loading"><p id="result">Carregando.</p><script type="module" src="/__e2e__/pdf-smoke.js"></script></body>
</html>`;
const PDF_SMOKE_SOURCE = `
import * as pdfjs from '/documentos/vendor/pdfjs/build/pdf.min.mjs';
try {
  pdfjs.GlobalWorkerOptions.workerSrc =
    '/documentos/vendor/pdfjs/build/pdf.worker.min.mjs';
  const bytes = Uint8Array.from(
    atob('${PDF_BYTES.toString('base64')}'),
    (character) => character.charCodeAt(0),
  );
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    enableXfa: false,
    isEvalSupported: false,
    stopAtErrors: true,
    cMapUrl: '/documentos/vendor/pdfjs/cmaps/',
    cMapPacked: true,
    iccUrl: '/documentos/vendor/pdfjs/iccs/',
    standardFontDataUrl: '/documentos/vendor/pdfjs/standard_fonts/',
    wasmUrl: '/documentos/vendor/pdfjs/wasm/',
  });
  const documentProxy = await loadingTask.promise;
  const page = await documentProxy.getPage(1);
  const text = await page.getTextContent();
  document.body.dataset.result = 'ready';
  document.querySelector('#result').textContent =
    documentProxy.numPages + ':' +
    text.items.map((item) => item.str || '').join(' ');
} catch (error) {
  document.body.dataset.result = 'error';
  document.querySelector('#result').textContent =
    (error?.name || 'Error') + ': ' + (error?.message || 'Falha sem detalhe.');
}
`;

const CONTENT_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.icc': 'application/vnd.iccprofile',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.otf': 'font/otf',
  '.pfb': 'application/octet-stream',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
});

async function documentosHtml() {
  const source = await readFile(
    path.join(PUBLIC_ROOT, 'documentos', 'index.html'),
    'utf8',
  );
  return source
    .replaceAll(/sha384-[A-Za-z0-9+/=]+/gu, RUNTIME_INTEGRITY)
    .replace(
      '    <script src="./assets/runtime-config.js"',
      '    <script src="./assets/e2e-bootstrap.js"></script>\n    <script src="./assets/runtime-config.js"',
    );
}

function safePublicPath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const relativePath = decoded.replace(/^\/+/u, '');
  const absolute = path.resolve(PUBLIC_ROOT, relativePath);
  if (
    absolute !== PUBLIC_ROOT &&
    !absolute.startsWith(`${PUBLIC_ROOT}${path.sep}`)
  ) {
    return null;
  }
  return absolute;
}

function send(response, status, body, contentType) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
    'content-type': contentType,
  });
  response.end(body);
}

export function createBrowserFixtureServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (url.pathname === '/__e2e__/health') {
        send(response, 200, 'ok\n', 'text/plain; charset=utf-8');
        return;
      }
      if (url.pathname === '/__e2e__/pdf-smoke.html') {
        send(response, 200, PDF_SMOKE_HTML, CONTENT_TYPES['.html']);
        return;
      }
      if (url.pathname === '/__e2e__/pdf-smoke.js') {
        send(response, 200, PDF_SMOKE_SOURCE, CONTENT_TYPES['.js']);
        return;
      }
      if (url.pathname === '/documentos/' || url.pathname === '/documentos/index.html') {
        send(response, 200, await documentosHtml(), CONTENT_TYPES['.html']);
        return;
      }
      if (url.pathname === '/documentos/assets/runtime-config.js') {
        send(response, 200, RUNTIME_SOURCE, CONTENT_TYPES['.js']);
        return;
      }
      if (url.pathname === '/documentos/assets/e2e-bootstrap.js') {
        send(response, 200, BOOTSTRAP_SOURCE, CONTENT_TYPES['.js']);
        return;
      }
      if (url.pathname === '/scripts/hub-auth.js') {
        send(response, 200, AUTH_SOURCE, CONTENT_TYPES['.js']);
        return;
      }
      if (url.pathname === '/scripts/hub-auth.css') {
        send(response, 200, '', CONTENT_TYPES['.css']);
        return;
      }

      const filePath = safePublicPath(url.pathname);
      if (!filePath || !(await stat(filePath)).isFile()) {
        send(response, 404, 'Não encontrado.\n', 'text/plain; charset=utf-8');
        return;
      }
      const body = await readFile(filePath);
      send(
        response,
        200,
        body,
        CONTENT_TYPES[path.extname(filePath).toLowerCase()] ||
          'application/octet-stream',
      );
    } catch {
      send(response, 404, 'Não encontrado.\n', 'text/plain; charset=utf-8');
    }
  });
}

function portFromArgs(argv) {
  if (argv.length === 0) return DEFAULT_PORT;
  if (argv.length === 2 && argv[0] === '--port' && /^\d+$/u.test(argv[1])) {
    const port = Number(argv[1]);
    if (Number.isSafeInteger(port) && port >= 1024 && port <= 65535) return port;
  }
  throw new Error('Uso: node tests/documentos/browser-fixture-server.mjs [--port <porta>].');
}

const executedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executedDirectly) {
  const port = portFromArgs(process.argv.slice(2));
  const server = createBrowserFixtureServer();
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`Fixture do Hub Documentos em http://127.0.0.1:${port}/documentos/?portal=unimed\n`);
  });
}
