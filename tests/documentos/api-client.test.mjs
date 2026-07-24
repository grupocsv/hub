import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DocumentApiError,
  createDocumentApiClient,
  publicErrorState,
} from '../../docs/public/documentos/assets/api-client.js';

const API_BASE_URL = 'https://hub.grupocsv.com';
const SESSION = Object.freeze({
  portal: 'unimed',
  token: 'token-super-secreto',
  expires: '2026-07-24T13:00:00.000Z',
});

function jsonResponse(status, body, headers = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      ...(body === null ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
  });
}

function clientWith(fetchImpl, overrides = {}) {
  return createDocumentApiClient({
    baseUrl: API_BASE_URL,
    getSession: () => SESSION,
    fetchImpl,
    timeoutMs: 5_000,
    ...overrides,
  });
}

async function captureError(operation) {
  try {
    await operation();
    assert.fail('A operação deveria falhar.');
  } catch (error) {
    assert.ok(error instanceof DocumentApiError);
    return error;
  }
}

test('não realiza request sem sessão autenticada', async () => {
  let requests = 0;
  const client = createDocumentApiClient({
    baseUrl: API_BASE_URL,
    getSession: () => null,
    fetchImpl: async () => {
      requests += 1;
      return jsonResponse(200, { items: [] });
    },
  });

  const error = await captureError(() => client.request('/v1/documents'));
  assert.equal(error.code, 'session_required');
  assert.equal(error.category, 'authentication');
  assert.equal(requests, 0);
});

test('envia somente X-Auth-Token como credencial humana e não envia contexto de tenant', async () => {
  const calls = [];
  const client = clientWith(async (url, init) => {
    calls.push({ url, init });
    return jsonResponse(200, { items: [], next_cursor: null });
  });

  const result = await client.request('/v1/documents?limit=20');

  assert.deepEqual(result.data, { items: [], next_cursor: null });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://hub.grupocsv.com/v1/documents?limit=20');
  const headers = new Headers(calls[0].init.headers);
  assert.equal(headers.get('X-Auth-Token'), SESSION.token);
  assert.equal(headers.get('Authorization'), null);
  assert.equal(headers.get('X-Tenant-Id'), null);
  assert.equal(headers.get('X-Portal'), null);
  assert.doesNotMatch(calls[0].url, /token|tenant|portal/i);
});

test('rejeita origem, path e cabeçalhos capazes de contornar a fronteira humana', async () => {
  let requests = 0;
  const client = clientWith(async () => {
    requests += 1;
    return jsonResponse(200, {});
  });

  await assert.rejects(
    () => client.request('https://evil.example/v1/documents'),
    (error) => error instanceof DocumentApiError && error.code === 'invalid_request_target',
  );
  await assert.rejects(
    () => client.request('/v1/../admin'),
    (error) => error instanceof DocumentApiError && error.code === 'invalid_request_target',
  );
  await assert.rejects(
    () => client.request('/v1/documents?tenant_id=icds'),
    (error) => error instanceof DocumentApiError && error.code === 'forbidden_client_context',
  );
  await assert.rejects(
    () => client.request('/v1/documents', { headers: { Authorization: 'Bearer indevido' } }),
    (error) => error instanceof DocumentApiError && error.code === 'forbidden_client_header',
  );
  await assert.rejects(
    () => client.request('/v1/documents', { headers: { 'X-Tenant-Id': 'icds' } }),
    (error) => error instanceof DocumentApiError && error.code === 'forbidden_client_header',
  );
  await assert.rejects(
    () => client.request('/v1/documents', { headers: { 'X-Auth-Token': 'substituto' } }),
    (error) => error instanceof DocumentApiError && error.code === 'forbidden_client_header',
  );
  assert.equal(requests, 0);
});

test('serializa corpo JSON sem incorporar portal, tenant ou token', async () => {
  let call;
  const client = clientWith(async (url, init) => {
    call = { url, init };
    return jsonResponse(201, { document_id: 'doc_1' });
  });

  await client.request('/v1/documents', {
    method: 'POST',
    body: { title: 'Política Assistencial', classification: 'internal' },
  });

  assert.equal(call.init.method, 'POST');
  assert.equal(new Headers(call.init.headers).get('content-type'), 'application/json');
  assert.deepEqual(JSON.parse(call.init.body), {
    title: 'Política Assistencial',
    classification: 'internal',
  });
  assert.doesNotMatch(call.init.body, /token|tenant_id|portal/i);

  await assert.rejects(
    () =>
      client.request('/v1/documents', {
        method: 'POST',
        body: { title: 'Inválido', tenant_id: 'icds' },
      }),
    (error) => error instanceof DocumentApiError && error.code === 'forbidden_client_context',
  );
});

test('normaliza a matriz pública de erros sem incluir dados sensíveis', async (t) => {
  const cases = [
    [401, 'unauthenticated', 'session_expired', 'authentication', false],
    [403, 'forbidden', 'resource_unavailable', 'neutral', false],
    [404, 'not_found', 'resource_unavailable', 'neutral', false],
    [409, 'metadata_conflict', 'conflict', 'conflict', false],
    [413, 'payload_too_large', 'payload_too_large', 'validation', false],
    [422, 'invalid_request', 'invalid_request', 'validation', false],
    [429, 'rate_limited', 'rate_limited', 'transient', true],
    [503, 'control_plane_unavailable', 'service_unavailable', 'transient', true],
  ];

  for (const [status, serverCode, expectedCode, category, retriable] of cases) {
    await t.test(`${status} ${serverCode}`, async () => {
      const client = clientWith(async () =>
        jsonResponse(
          status,
          {
            error: {
              code: serverCode,
              message: `detalhe interno ${SESSION.token}`,
              request_id: `req-${status}`,
            },
          },
          status === 429 ? { 'retry-after': '7' } : {},
        ),
      );

      const error = await captureError(() => client.request('/v1/documents/doc_1'));
      assert.equal(error.status, status);
      assert.equal(error.code, expectedCode);
      assert.equal(error.category, category);
      assert.equal(error.retriable, retriable);
      assert.equal(error.requestId, `req-${status}`);
      assert.doesNotMatch(error.message, /token-super-secreto|detalhe interno/);
      assert.doesNotMatch(JSON.stringify(error), /token-super-secreto|detalhe interno/);
      if (status === 429) assert.equal(error.retryAfterSeconds, 7);
    });
  }
});

test('403 e 404 produzem estado público byte a byte idêntico', async () => {
  async function stateFor(status, code) {
    const client = clientWith(async () =>
      jsonResponse(status, { error: { code, message: `específico ${status}` } }),
    );
    const error = await captureError(() => client.request('/v1/documents/doc_oculto'));
    return publicErrorState(error);
  }

  const forbidden = await stateFor(403, 'forbidden');
  const missing = await stateFor(404, 'not_found');

  assert.equal(JSON.stringify(forbidden), JSON.stringify(missing));
  assert.deepEqual(forbidden, {
    state: 'error',
    title: 'Conteúdo Indisponível',
    detail: 'Não foi possível acessar este conteúdo.',
    canRetry: false,
  });
});

test('401 invalida a sessão uma única vez e nunca retém o token no erro', async () => {
  const invalidations = [];
  const client = clientWith(
    async () => jsonResponse(401, { error: { code: 'unauthenticated' } }),
    { onUnauthorized: () => invalidations.push('invalidada') },
  );

  const error = await captureError(() => client.request('/v1/documents'));
  assert.equal(error.code, 'session_expired');
  assert.deepEqual(invalidations, ['invalidada']);
  assert.equal(Object.hasOwn(error, 'token'), false);
  assert.doesNotMatch(JSON.stringify(error), /token-super-secreto/);
});

test('distingue timeout interno de cancelamento solicitado pelo chamador', async () => {
  const hangingFetch = async (_url, init) =>
    new Promise((resolve, reject) => {
      if (init.signal.aborted) {
        reject(init.signal.reason);
        return;
      }
      init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
    });

  const timeoutClient = clientWith(hangingFetch, {
    setTimer(callback) {
      callback();
      return 1;
    },
    clearTimer() {},
  });
  const timeoutError = await captureError(() => timeoutClient.request('/v1/documents'));
  assert.equal(timeoutError.code, 'request_timeout');
  assert.equal(timeoutError.category, 'timeout');
  assert.equal(timeoutError.retriable, true);

  const controller = new AbortController();
  controller.abort(new DOMException('Cancelado', 'AbortError'));
  const abortClient = clientWith(hangingFetch);
  const abortError = await captureError(() =>
    abortClient.request('/v1/documents', { signal: controller.signal }),
  );
  assert.equal(abortError.code, 'request_aborted');
  assert.equal(abortError.category, 'abort');
  assert.equal(abortError.retriable, false);
});

test('suporta resposta sem corpo e preserva apenas metadados públicos necessários', async () => {
  const client = clientWith(async () =>
    jsonResponse(204, null, { etag: '"versao-1"', 'x-request-id': 'req-204' }),
  );

  const result = await client.request('/v1/documents/doc_1/favorite', { method: 'DELETE' });
  assert.equal(result.status, 204);
  assert.equal(result.data, null);
  assert.equal(result.headers.get('etag'), '"versao-1"');
  assert.equal(result.requestId, 'req-204');
});
