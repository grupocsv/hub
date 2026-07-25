import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HUB_ROOT = path.resolve(HERE, '../..');

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    snapshot() {
      return Object.fromEntries(values);
    },
  };
}

async function executeHubAuth({
  search = '?portal=unimed',
  stored = {},
  sessionStored = {},
  fetchImpl = async () => {
    throw new Error('Rede não esperada no fixture.');
  },
  setTimeoutImpl = setTimeout,
  clearTimeoutImpl = clearTimeout,
} = {}) {
  const source = await readFile(path.join(HUB_ROOT, 'scripts', 'hub-auth.js'), 'utf8');
  const lifecycle = new Map();
  const history = [];
  const events = [];
  const localStorage = storage(stored);
  const sessionStorage = storage(sessionStored);
  let activeElement = null;

  function element(tagName = 'div') {
    const attributes = new Map();
    const descendants = new Map();
    const classes = new Set();
    const listeners = new Map();
    return {
      tagName: tagName.toUpperCase(),
      id: '',
      value: '',
      hidden: false,
      inert: false,
      isConnected: false,
      children: [],
      dataset: {},
      classList: {
        add(value) {
          classes.add(value);
        },
        remove(value) {
          classes.delete(value);
        },
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      hasAttribute(name) {
        return attributes.has(name);
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
      addEventListener(type, callback) {
        listeners.set(type, callback);
      },
      focus() {
        activeElement = this;
      },
      async dispatch(type, event = {}) {
        return listeners.get(type)?.call(this, event);
      },
      querySelector(selector) {
        if (!descendants.has(selector)) descendants.set(selector, element());
        return descendants.get(selector);
      },
      querySelectorAll() {
        return [];
      },
      appendChild(child) {
        child.parentElement = this;
        child.isConnected = true;
        this.children.push(child);
        return child;
      },
      append(...children) {
        for (const child of children) this.appendChild(child);
      },
      remove() {
        if (!this.parentElement) return;
        const index = this.parentElement.children.indexOf(this);
        if (index >= 0) this.parentElement.children.splice(index, 1);
        this.isConnected = false;
      },
    };
  }

  const body = element('body');
  body.isConnected = true;
  const protectedContent = element('main');
  protectedContent.id = 'protected-content';
  body.appendChild(protectedContent);
  const head = element('head');
  head.isConnected = true;
  const script = element('script');
  script.getAttribute = (name) => (name === 'data-portal' ? 'unimed' : null);
  const findById = (root, id) => {
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = findById(child, id);
      if (found) return found;
    }
    return null;
  };
  const document = {
    readyState: 'complete',
    currentScript: script,
    body,
    head,
    createElement: element,
    getElementById(id) {
      return findById(body, id) ?? findById(head, id);
    },
    querySelector(selector) {
      if (selector === 'script[data-portal]') return script;
      return null;
    },
    addEventListener() {},
    get activeElement() {
      return activeElement;
    },
  };
  const location = {
    search,
    href: `https://hub.grupocsv.com/documentos/${search}`,
    pathname: '/documentos/',
    hash: '',
  };
  const window = {
    location,
    history: {
      replaceState(_state, _title, value) {
        history.push(String(value));
        events.push('history');
        location.search = new URL(String(value), 'https://hub.grupocsv.com').search;
      },
    },
    addEventListener(type, callback) {
      lifecycle.set(type, callback);
    },
    removeEventListener(type, callback) {
      if (lifecycle.get(type) === callback) lifecycle.delete(type);
    },
  };
  const originalHeadAppend = head.appendChild.bind(head);
  head.appendChild = (child) => {
    events.push('head');
    return originalHeadAppend(child);
  };

  vm.runInNewContext(source, {
    document,
    window,
    localStorage,
    sessionStorage,
    URL,
    URLSearchParams,
    AbortController,
    console: { warn() {} },
    fetch: fetchImpl,
    setTimeout: setTimeoutImpl,
    clearTimeout: clearTimeoutImpl,
  });
  await Promise.resolve();

  return {
    body,
    document,
    events,
    head,
    history,
    lifecycle,
    localStorage,
    sessionStorage,
    protectedContent,
    window,
    async dispatch(type, event = {}) {
      await lifecycle.get(type)?.(event);
      await Promise.resolve();
    },
  };
}

function storedSession(token = 'sessao-existente') {
  return {
    hub_auth_unimed_token: token,
    hub_auth_unimed_email: 'pessoa@exemplo.com',
    hub_auth_unimed_expires: '2099-01-01T00:00:00.000Z',
  };
}

function storedSessionWithExpiry(token, expires) {
  return {
    hub_auth_unimed_token: token,
    hub_auth_unimed_email: 'pessoa@exemplo.com',
    hub_auth_unimed_expires: expires,
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function withTimeout(promise, message, timeoutMs = 250) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

test('Hub Auth usa CSS externo espelhado e não exige estilo inline', async () => {
  const [sourceScript, publicScript, sourceCss, publicCss] = await Promise.all([
    readFile(path.join(HUB_ROOT, 'scripts', 'hub-auth.js'), 'utf8'),
    readFile(path.join(HUB_ROOT, 'docs', 'public', 'scripts', 'hub-auth.js'), 'utf8'),
    readFile(path.join(HUB_ROOT, 'scripts', 'hub-auth.css'), 'utf8'),
    readFile(path.join(HUB_ROOT, 'docs', 'public', 'scripts', 'hub-auth.css'), 'utf8'),
  ]);

  assert.equal(publicScript, sourceScript);
  assert.equal(publicCss, sourceCss);
  assert.doesNotMatch(sourceScript, /\r/u);
  assert.doesNotMatch(publicScript, /\r/u);
  assert.match(sourceScript, /href\s*=\s*['"]\/scripts\/hub-auth\.css['"]/);
  assert.doesNotMatch(sourceScript, /<style\b/i);
  assert.doesNotMatch(sourceScript, /\sstyle\s*=/i);
  assert.doesNotMatch(sourceScript, /\.style\./);
  assert.doesNotMatch(sourceScript, /style\.cssText/);
  assert.match(sourceCss, /#hub-auth-overlay/);
  assert.match(sourceCss, /#hub-auth-logout/);
});

test('Hub Auth mantém rolagem útil e contraste mínimo nos estados interativos', async () => {
  const css = await readFile(path.join(HUB_ROOT, 'scripts', 'hub-auth.css'), 'utf8');
  const block = (selector, requiredProperty = null) => {
    const marker = `\n${selector} {`;
    const candidates = [];
    let start = css.indexOf(marker);
    while (start !== -1) {
      const end = css.indexOf('}', start + marker.length);
      assert.notEqual(end, -1, `Regra incompleta: ${selector}`);
      candidates.push(css.slice(start + marker.length, end));
      start = css.indexOf(marker, end + 1);
    }
    assert.ok(candidates.length > 0, `Regra ausente: ${selector}`);
    if (!requiredProperty) return candidates[0];
    const selected = candidates.find((candidate) =>
      new RegExp(`${requiredProperty}:`).test(candidate),
    );
    assert.ok(selected, `Propriedade ausente em ${selector}: ${requiredProperty}`);
    return selected;
  };
  const propertyHex = (declarations, property) => {
    const match = declarations.match(new RegExp(`${property}:\\s*(#[0-9a-f]{6})`, 'i'));
    assert.ok(match, `Cor ausente em ${property}`);
    return match[1];
  };
  const luminance = (hex) => {
    const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
    const linear = channels.map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const contrast = (foreground, background) => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };

  const overlay = block('#hub-auth-overlay');
  const modal = block('.ha-modal');
  assert.match(overlay, /overflow-y:\s*auto/);
  assert.match(overlay, /align-items:\s*flex-start/);
  assert.match(overlay, /overscroll-behavior:\s*contain/);
  assert.match(modal, /max-height:\s*calc\(100dvh\s*-\s*40px\)/);
  assert.match(modal, /overflow-y:\s*auto/);

  const gradients = [
    ...css.matchAll(
      /--ha-gradient:\s*linear-gradient\(135deg,\s*(#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi,
    ),
  ];
  assert.equal(gradients.length, 6);
  for (const [, start, end] of gradients) {
    assert.ok(contrast(start, '#ffffff') >= 4.5);
    assert.ok(contrast(end, '#ffffff') >= 4.5);
  }

  for (const selector of ['.ha-pw-toggle', '.ha-footer', '.ha-user-badge', '.ha-logout-btn']) {
    assert.ok(contrast(propertyHex(block(selector, 'color'), 'color'), '#ffffff') >= 4.5);
  }
  for (const selector of ['.ha-error', '.ha-success']) {
    const declarations = block(selector, 'color');
    assert.ok(
      contrast(
        propertyHex(declarations, 'color'),
        propertyHex(declarations, 'background'),
      ) >= 4.5,
    );
  }
  const input = block('.ha-field input');
  const border = input.match(/border:\s*[^;]*\s(#[0-9a-f]{6})/i);
  assert.ok(border);
  assert.ok(contrast(border[1], propertyHex(input, 'background')) >= 3);
  assert.doesNotMatch(block('.ha-btn:hover'), /opacity:/);
});

test('Hub Auth não interpola o e-mail da sessão em HTML', async () => {
  const source = await readFile(path.join(HUB_ROOT, 'scripts', 'hub-auth.js'), 'utf8');
  const logoutBlock = source.slice(
    source.indexOf('function addLogoutButton()'),
    source.indexOf('// ===== Set Password Overlay ====='),
  );
  assert.doesNotMatch(logoutBlock, /innerHTML\s*=[^\r\n]*(?:emailDisplay|emailShort)/);
  assert.match(source, /emailLabel\.textContent\s*=\s*emailShort/);
});

test('gate permanece fechado sem depender do carregamento do CSS e limpa o BFCache', async () => {
  const runtime = await executeHubAuth();
  const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  const field = { value: 'senha-digitada' };
  overlay.querySelectorAll = () => [field];

  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'required');
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
  assert.equal(overlay.hidden, false);

  await runtime.dispatch('pagehide', { persisted: true });
  assert.equal(field.value, '');
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-overlay'), false);
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);

  await runtime.dispatch('pageshow', { persisted: true });
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-overlay'), true);
  assert.equal(runtime.protectedContent.hidden, true);
});

test('consome set-password, invalida sessão antiga e limpa a URL antes de carregar CSS', async () => {
  const runtime = await executeHubAuth({
    search: '?portal=unimed&set-password=segredo-de-reset',
    stored: {
      hub_auth_unimed_token: 'sessao-antiga',
      hub_auth_unimed_email: 'pessoa@exemplo.com',
      hub_auth_unimed_expires: '2099-01-01T00:00:00.000Z',
    },
  });

  assert.deepEqual(runtime.localStorage.snapshot(), {});
  assert.equal(runtime.history.length, 1);
  assert.doesNotMatch(runtime.history[0], /set-password|segredo-de-reset/);
  assert.ok(runtime.events.indexOf('history') < runtime.events.indexOf('head'));
  const readiness = await runtime.window.HUB_AUTH_READY;
  assert.equal(readiness.status, 'set_password');
  assert.doesNotMatch(JSON.stringify(readiness), /segredo-de-reset|sessao-antiga/);
});

test('set-password anterior ao pagehide não altera o diálogo do ciclo retomado', async () => {
  const setPassword = deferred();
  const setPasswordStarted = deferred();
  const runtime = await executeHubAuth({
    search: '?portal=unimed&set-password=segredo-de-reset',
    fetchImpl: (url) => {
      if (String(url).endsWith('/set-password')) {
        setPasswordStarted.resolve();
        return setPassword.promise;
      }
      throw new Error(`URL inesperada: ${url}`);
    },
  });
  const oldOverlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  oldOverlay.querySelector('#ha-setpw-password').value = 'senha-nova';
  oldOverlay.querySelector('#ha-setpw-confirm').value = 'senha-nova';
  const submission = oldOverlay.querySelector('#ha-setpw-btn').dispatch('click');
  await withTimeout(
    setPasswordStarted.promise,
    'A definição de senha não iniciou a requisição esperada.',
  );

  await runtime.dispatch('pagehide', { persisted: true });
  await runtime.dispatch('pageshow', { persisted: true });
  const resumedOverlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  assert.notEqual(resumedOverlay, oldOverlay);
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'required');

  setPassword.resolve(Response.json({ success: true }));
  await submission;
  await Promise.resolve();

  assert.equal(
    runtime.body.children.find(({ id }) => id === 'hub-auth-overlay'),
    resumedOverlay,
  );
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
});

test('diálogo do Hub Auth publica nome acessível, rótulos e foco inicial', async () => {
  const runtime = await executeHubAuth();
  const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  const source = await readFile(path.join(HUB_ROOT, 'scripts', 'hub-auth.js'), 'utf8');

  assert.equal(overlay.getAttribute('role'), 'dialog');
  assert.equal(overlay.getAttribute('aria-modal'), 'true');
  assert.equal(overlay.getAttribute('aria-labelledby'), 'ha-dialog-title');
  assert.match(source, /<label for="ha-email">/);
  assert.match(source, /<label for="ha-password">/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /role="tab" aria-selected="true"/);
  assert.match(source, /aria-live="assertive"/);
  assert.match(source, /input:not\(:disabled\)/);
  assert.match(source, /initialFocus\.focus\(\)/);
});

for (const scenario of [
  {
    name: '200 valid=true',
    expected: 'valid',
    response: () => Response.json({ valid: true, portal: 'unimed' }),
  },
  {
    name: '200 valid=true sem portal',
    expected: 'unavailable',
    response: () => Response.json({ valid: true }),
  },
  {
    name: '200 valid=true para outro portal',
    expected: 'invalid',
    response: () => Response.json({ valid: true, portal: 'icds' }),
  },
  {
    name: '200 valid=false',
    expected: 'invalid',
    response: () => Response.json({ valid: false }),
  },
  {
    name: '400',
    expected: 'invalid',
    response: () => Response.json({ valid: true }, { status: 400 }),
  },
  {
    name: '401',
    expected: 'invalid',
    response: () => Response.json({ valid: true }, { status: 401 }),
  },
  {
    name: '403',
    expected: 'invalid',
    response: () => Response.json({ valid: true }, { status: 403 }),
  },
  {
    name: '404',
    expected: 'invalid',
    response: () => Response.json({ valid: true }, { status: 404 }),
  },
  {
    name: '429',
    expected: 'unavailable',
    response: () => Response.json({ valid: true }, { status: 429 }),
  },
  {
    name: '500',
    expected: 'unavailable',
    response: () => Response.json({ valid: true }, { status: 500 }),
  },
  {
    name: '503',
    expected: 'unavailable',
    response: () => Response.json({ valid: true }, { status: 503 }),
  },
  {
    name: 'JSON inválido',
    expected: 'unavailable',
    response: () =>
      new Response('{', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  },
  {
    name: 'payload sem valid booleano',
    expected: 'unavailable',
    response: () => Response.json({ valid: 'true' }),
  },
  {
    name: 'falha de rede',
    expected: 'unavailable',
    response: () => Promise.reject(new Error('offline')),
  },
]) {
  test(`verificação tri-state classifica ${scenario.name} como ${scenario.expected}`, async () => {
    const runtime = await executeHubAuth({
      stored: storedSession(),
      fetchImpl: scenario.response,
    });

    assert.equal(typeof runtime.window.HUB_AUTH_READY?.then, 'function');
    const readiness = await runtime.window.HUB_AUTH_READY;
    assert.equal(readiness.status, scenario.expected);
    assert.equal(readiness.portal, 'unimed');
    assert.deepEqual(Object.keys(readiness).sort(), ['portal', 'status']);
    assert.doesNotMatch(JSON.stringify(readiness), /sessao-existente|pessoa@exemplo\.com/);

    const logoutExists = runtime.body.children.some(({ id }) => id === 'hub-auth-logout');
    if (scenario.expected === 'valid') {
      assert.equal(runtime.protectedContent.hidden, false);
      assert.equal(runtime.protectedContent.inert, false);
      assert.equal(logoutExists, true);
      assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, 'sessao-existente');
      assert.equal(runtime.document.activeElement?.id, 'ha-logout-btn');
    } else {
      assert.equal(runtime.protectedContent.hidden, true);
      assert.equal(runtime.protectedContent.inert, true);
      assert.equal(logoutExists, false);
      assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, undefined);
    }
  });
}

test('sessão armazenada não desbloqueia conteúdo nem cria logout antes de verify válido', async () => {
  const verification = deferred();
  const runtime = await executeHubAuth({
    stored: storedSession(),
    fetchImpl: () => verification.promise,
  });

  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-logout'), false);

  verification.resolve(Response.json({ valid: true, portal: 'unimed' }));
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'valid');
  assert.equal(runtime.protectedContent.hidden, false);
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-logout'), true);
});

test('verificação de sessão pendente exibe progresso e expira com o gate fechado', async () => {
  let timeoutCallback;
  let timeoutDelay;
  let verificationSignal;
  const runtime = await executeHubAuth({
    stored: storedSession(),
    fetchImpl: (_url, options) => {
      verificationSignal = options?.signal;
      return new Promise(() => {});
    },
    setTimeoutImpl(callback, delay) {
      timeoutCallback = callback;
      timeoutDelay = delay;
      return 1;
    },
    clearTimeoutImpl() {},
  });

  const validationOverlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  assert.equal(validationOverlay.getAttribute('aria-busy'), 'true');
  assert.match(validationOverlay.innerHTML, /Validando sua sessão/);
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
  assert.equal(timeoutDelay, 10000);

  timeoutCallback();
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'unavailable');
  assert.equal(verificationSignal.aborted, true);
  const loginOverlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  assert.notEqual(loginOverlay, validationOverlay);
  assert.equal(loginOverlay.getAttribute('aria-busy'), null);
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
});

test('login pendente expira, mantém o gate fechado e reabilita o formulário', async () => {
  let timeoutCallback;
  let loginSignal;
  const runtime = await executeHubAuth({
    fetchImpl: (_url, options) => {
      loginSignal = options?.signal;
      return new Promise(() => {});
    },
    setTimeoutImpl(callback) {
      timeoutCallback = callback;
      return 1;
    },
    clearTimeoutImpl() {},
  });
  const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  overlay.querySelector('#ha-email').value = 'pessoa@exemplo.com';
  overlay.querySelector('#ha-password').value = 'senha-correta';
  const loginButton = overlay.querySelector('#ha-login-btn');

  const login = loginButton.dispatch('click');
  await Promise.resolve();
  assert.equal(loginButton.disabled, true);
  timeoutCallback();
  await login;

  assert.equal(loginSignal.aborted, true);
  assert.equal(loginButton.disabled, false);
  assert.equal(overlay.querySelector('#ha-error').hidden, false);
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'unavailable');
});

for (const scenario of [
  {
    name: 'solicitação de acesso',
    search: '?portal=unimed',
    prepare(overlay) {
      overlay.querySelector('#ha-request-name').value = 'Pessoa Exemplo';
      overlay.querySelector('#ha-request-email').value = 'pessoa@exemplo.com';
      return {
        button: overlay.querySelector('#ha-request-btn'),
        error: overlay.querySelector('#ha-error-request'),
      };
    },
  },
  {
    name: 'recuperação de senha',
    search: '?portal=unimed',
    prepare(overlay) {
      overlay.querySelector('#ha-forgot-email').value = 'pessoa@exemplo.com';
      return {
        button: overlay.querySelector('#ha-forgot-btn'),
        error: overlay.querySelector('#ha-error-forgot'),
      };
    },
  },
  {
    name: 'definição de senha',
    search: '?portal=unimed&set-password=token-reset',
    prepare(overlay) {
      overlay.querySelector('#ha-setpw-password').value = 'senha-nova';
      overlay.querySelector('#ha-setpw-confirm').value = 'senha-nova';
      return {
        button: overlay.querySelector('#ha-setpw-btn'),
        error: overlay.querySelector('#ha-error-setpw'),
      };
    },
  },
]) {
  test(`${scenario.name} pendente expira e reabilita a ação`, async () => {
    let timeoutCallback;
    let requestSignal;
    const runtime = await executeHubAuth({
      search: scenario.search,
      fetchImpl: (_url, options) => {
        requestSignal = options?.signal;
        return new Promise(() => {});
      },
      setTimeoutImpl(callback) {
        timeoutCallback = callback;
        return 1;
      },
      clearTimeoutImpl() {},
    });
    const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
    const { button, error } = scenario.prepare(overlay);

    const submission = button.dispatch('click');
    await Promise.resolve();
    assert.equal(button.disabled, true);
    timeoutCallback();
    await submission;

    assert.equal(requestSignal.aborted, true);
    assert.equal(button.disabled, false);
    assert.equal(error.hidden, false);
    assert.equal(runtime.protectedContent.hidden, true);
    assert.equal(runtime.protectedContent.inert, true);
  });
}

for (const scenario of [
  {
    name: 'solicitação de acesso',
    prepare(overlay) {
      overlay.querySelector('#ha-request-name').value = 'Pessoa Exemplo';
      overlay.querySelector('#ha-request-email').value = 'pessoa@exemplo.com';
      return overlay.querySelector('#ha-request-btn');
    },
  },
  {
    name: 'recuperação de senha',
    prepare(overlay) {
      overlay.querySelector('#ha-forgot-email').value = 'pessoa@exemplo.com';
      return overlay.querySelector('#ha-forgot-btn');
    },
  },
]) {
  test(`${scenario.name} anterior ao pagehide não altera o diálogo retomado`, async () => {
    const requestStarted = deferred();
    let requestSignal;
    const runtime = await executeHubAuth({
      fetchImpl: (_url, options) => {
        requestSignal = options?.signal;
        requestStarted.resolve();
        return new Promise(() => {});
      },
    });
    const oldOverlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
    const button = scenario.prepare(oldOverlay);
    const submission = button.dispatch('click');
    await withTimeout(requestStarted.promise, 'A requisição auxiliar não foi iniciada.');

    await runtime.dispatch('pagehide', { persisted: true });
    assert.equal(requestSignal.aborted, true);
    await submission;
    await runtime.dispatch('pageshow', { persisted: true });
    const resumedOverlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');

    assert.notEqual(resumedOverlay, oldOverlay);
    assert.equal(runtime.protectedContent.hidden, true);
    assert.equal(runtime.protectedContent.inert, true);
  });
}

test('alternar do login pendente para solicitação de acesso não deixa o login travado', async () => {
  const loginStarted = deferred();
  const requestStarted = deferred();
  const runtime = await executeHubAuth({
    fetchImpl: (url) => {
      if (String(url).endsWith('/login')) loginStarted.resolve();
      if (String(url).endsWith('/request-access')) requestStarted.resolve();
      return new Promise(() => {});
    },
  });
  const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  const loginButton = overlay.querySelector('#ha-login-btn');
  overlay.querySelector('#ha-email').value = 'pessoa@exemplo.com';
  overlay.querySelector('#ha-password').value = 'senha-correta';
  const login = loginButton.dispatch('click');
  await withTimeout(loginStarted.promise, 'O login pendente não iniciou.');

  overlay.querySelector('#ha-request-name').value = 'Pessoa Exemplo';
  overlay.querySelector('#ha-request-email').value = 'pessoa@exemplo.com';
  const request = overlay.querySelector('#ha-request-btn').dispatch('click');
  await withTimeout(requestStarted.promise, 'A solicitação de acesso não iniciou.');
  await withTimeout(login, 'O login cancelado não encerrou.');

  assert.equal(loginButton.disabled, false);
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'required');
  await runtime.dispatch('pagehide', { persisted: true });
  await request;
});

test('alternar da solicitação pendente para login não deixa a solicitação travada', async () => {
  const requestStarted = deferred();
  const loginStarted = deferred();
  const runtime = await executeHubAuth({
    fetchImpl: (url) => {
      if (String(url).endsWith('/request-access')) requestStarted.resolve();
      if (String(url).endsWith('/login')) loginStarted.resolve();
      return new Promise(() => {});
    },
  });
  const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  const requestButton = overlay.querySelector('#ha-request-btn');
  overlay.querySelector('#ha-request-name').value = 'Pessoa Exemplo';
  overlay.querySelector('#ha-request-email').value = 'pessoa@exemplo.com';
  const request = requestButton.dispatch('click');
  await withTimeout(requestStarted.promise, 'A solicitação pendente não iniciou.');

  overlay.querySelector('#ha-email').value = 'pessoa@exemplo.com';
  overlay.querySelector('#ha-password').value = 'senha-correta';
  const login = overlay.querySelector('#ha-login-btn').dispatch('click');
  await withTimeout(loginStarted.promise, 'O login não iniciou.');
  await withTimeout(request, 'A solicitação cancelada não encerrou.');

  assert.equal(requestButton.disabled, false);
  await runtime.dispatch('pagehide', { persisted: true });
  await login;
});

for (const invalidExpiry of ['2000-01-01T00:00:00.000Z', 'data-inválida']) {
  test(`sessão local com expiração ${invalidExpiry} não apaga fallback válido`, async () => {
    let verifiedToken;
    const runtime = await executeHubAuth({
      stored: storedSessionWithExpiry('sessao-local-invalida', invalidExpiry),
      sessionStored: storedSessionWithExpiry(
        'sessao-session-valida',
        '2099-01-01T00:00:00.000Z',
      ),
      fetchImpl: async (_url, options) => {
        verifiedToken = new Headers(options.headers).get('X-Auth-Token');
        return Response.json({ valid: true, portal: 'unimed' });
      },
    });

    assert.equal((await runtime.window.HUB_AUTH_READY).status, 'valid');
    assert.equal(verifiedToken, 'sessao-session-valida');
    assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, undefined);
    assert.equal(
      runtime.sessionStorage.snapshot().hub_auth_unimed_token,
      'sessao-session-valida',
    );
  });
}

test('logout fecha a sessão local antes de aguardar a revogação remota', async () => {
  const revocation = deferred();
  const revocationStarted = deferred();
  const runtime = await executeHubAuth({
    stored: storedSession('sessao-logout'),
    fetchImpl: (url) => {
      if (String(url).endsWith('/verify')) {
        return Response.json({ valid: true, portal: 'unimed' });
      }
      if (String(url).endsWith('/logout')) {
        revocationStarted.resolve();
        return revocation.promise;
      }
      throw new Error(`URL inesperada: ${url}`);
    },
  });
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'valid');
  const logoutContainer = runtime.body.children.find(
    ({ id }) => id === 'hub-auth-logout',
  );
  const logoutLink = logoutContainer.children.find(({ id }) => id === 'ha-logout-btn');

  await logoutLink.dispatch('click', { preventDefault() {} });
  await withTimeout(
    revocationStarted.promise,
    'A revogação remota não foi iniciada em segundo plano.',
  );

  assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, undefined);
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-logout'), false);
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-overlay'), true);
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'required');
});

test('login só persiste a nova sessão e desbloqueia após verify válido', async () => {
  const verification = deferred();
  const verificationStarted = deferred();
  const runtime = await executeHubAuth({
    fetchImpl: async (url) => {
      if (String(url).endsWith('/login')) {
        return Response.json({
          success: true,
          token: 'nova-sessao',
          email: 'pessoa@exemplo.com',
          expires_at: '2099-01-01T00:00:00.000Z',
        });
      }
      if (String(url).endsWith('/verify')) {
        verificationStarted.resolve();
        return verification.promise;
      }
      throw new Error(`URL inesperada: ${url}`);
    },
  });
  const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  overlay.querySelector('#ha-email').value = 'pessoa@exemplo.com';
  overlay.querySelector('#ha-password').value = 'senha-correta';

  const login = overlay.querySelector('#ha-login-btn').dispatch('click');
  await withTimeout(
    verificationStarted.promise,
    'O login não iniciou a verificação da sessão emitida.',
  );

  assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, undefined);
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-logout'), false);

  verification.resolve(Response.json({ valid: true, portal: 'unimed' }));
  await login;
  assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, 'nova-sessao');
  assert.equal(runtime.protectedContent.hidden, false);
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-logout'), true);
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'valid');
});

test('verificação anterior ao pagehide não restaura sessão no ciclo retomado', async () => {
  const verification = deferred();
  let verificationSignal;
  const runtime = await executeHubAuth({
    stored: storedSession('sessao-antiga'),
    fetchImpl: (_url, options) => {
      verificationSignal = options?.signal;
      return verification.promise;
    },
  });
  const initialReadiness = runtime.window.HUB_AUTH_READY;

  await runtime.dispatch('pagehide', { persisted: true });
  assert.equal((await initialReadiness).status, 'unavailable');
  assert.equal(verificationSignal?.aborted, true);

  await runtime.dispatch('pageshow', { persisted: true });
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'required');

  verification.resolve(Response.json({ valid: true, portal: 'unimed' }));
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, undefined);
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-logout'), false);
});

test('login anterior ao pagehide não persiste nem desbloqueia no ciclo retomado', async () => {
  const verification = deferred();
  const verificationStarted = deferred();
  const runtime = await executeHubAuth({
    fetchImpl: async (url) => {
      if (String(url).endsWith('/login')) {
        return Response.json({
          success: true,
          token: 'sessao-antiga',
          email: 'pessoa@exemplo.com',
          expires_at: '2099-01-01T00:00:00.000Z',
        });
      }
      if (String(url).endsWith('/verify')) {
        verificationStarted.resolve();
        return verification.promise;
      }
      throw new Error(`URL inesperada: ${url}`);
    },
  });
  const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
  overlay.querySelector('#ha-email').value = 'pessoa@exemplo.com';
  overlay.querySelector('#ha-password').value = 'senha-correta';

  const login = overlay.querySelector('#ha-login-btn').dispatch('click');
  await withTimeout(
    verificationStarted.promise,
    'O login não iniciou a verificação da sessão emitida.',
  );
  const loginReadiness = runtime.window.HUB_AUTH_READY;

  await runtime.dispatch('pagehide', { persisted: true });
  assert.equal((await loginReadiness).status, 'unavailable');
  await runtime.dispatch('pageshow', { persisted: true });
  assert.equal((await runtime.window.HUB_AUTH_READY).status, 'required');

  verification.resolve(Response.json({ valid: true, portal: 'unimed' }));
  await login;

  assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, undefined);
  assert.equal(runtime.protectedContent.hidden, true);
  assert.equal(runtime.protectedContent.inert, true);
  assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-logout'), false);
});

for (const scenario of [
  {
    name: 'inválida',
    expected: 'invalid',
    response: () => Response.json({ valid: false }),
  },
  {
    name: 'indisponível',
    expected: 'unavailable',
    response: () => Response.json({ valid: true }, { status: 503 }),
  },
]) {
  test(`login permanece fechado quando a verificação é ${scenario.name}`, async () => {
    const runtime = await executeHubAuth({
      fetchImpl: async (url) => {
        if (String(url).endsWith('/login')) {
          return Response.json({
            success: true,
            token: 'nova-sessao',
            email: 'pessoa@exemplo.com',
            expires_at: '2099-01-01T00:00:00.000Z',
          });
        }
        if (String(url).endsWith('/verify')) return scenario.response();
        throw new Error(`URL inesperada: ${url}`);
      },
    });
    const overlay = runtime.body.children.find(({ id }) => id === 'hub-auth-overlay');
    overlay.querySelector('#ha-email').value = 'pessoa@exemplo.com';
    overlay.querySelector('#ha-password').value = 'senha-correta';

    await overlay.querySelector('#ha-login-btn').dispatch('click');

    assert.equal((await runtime.window.HUB_AUTH_READY).status, scenario.expected);
    assert.equal(runtime.localStorage.snapshot().hub_auth_unimed_token, undefined);
    assert.equal(runtime.protectedContent.hidden, true);
    assert.equal(runtime.protectedContent.inert, true);
    assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-logout'), false);
    assert.equal(runtime.body.children.some(({ id }) => id === 'hub-auth-overlay'), true);
  });
}

test('shell impede Referer sensível e impressão mantém o conteúdo protegido oculto', async () => {
  const [template, css] = await Promise.all([
    readFile(path.join(HUB_ROOT, 'scripts', 'documentos-shell.template.html'), 'utf8'),
    readFile(path.join(HUB_ROOT, 'scripts', 'hub-auth.css'), 'utf8'),
  ]);

  assert.match(template, /<meta name="referrer" content="no-referrer">/);
  assert.match(template, /<link id="hub-auth-styles"[^>]*href="\/scripts\/hub-auth\.css">/);
  assert.match(css, /@media print[\s\S]*body\.ha-scroll-locked\s*>\s*:not\(#hub-auth-overlay\)/);
  assert.doesNotMatch(
    css,
    /@media print[\s\S]*#hub-auth-overlay\s*,\s*#hub-auth-logout[\s\S]*display:\s*none/,
  );
});

test('gate documental inclui o contrato corporativo compartilhado do Hub Auth', async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(HUB_ROOT, 'package.json'), 'utf8'),
  );
  assert.match(packageJson.scripts['documentos:test'], /tests\/hub-auth-corporate\.test\.mjs/);
});
