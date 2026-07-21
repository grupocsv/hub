import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function renderAuthForPortal(portal, sourcePath) {
  const source = await readFile(new URL(sourcePath, import.meta.url), 'utf8');
  const appended = [];
  const storage = new Map();

  const makeElement = () => ({
    id: '',
    style: {},
    innerHTML: '',
    classList: { add() {}, remove() {} },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    appendChild() {},
    remove() {},
  });

  const document = {
    readyState: 'complete',
    currentScript: { getAttribute(name) { return name === 'data-portal' ? portal : null; } },
    body: {
      style: {},
      appendChild(element) { appended.push(element); },
    },
    createElement: makeElement,
    getElementById() { return null; },
    querySelector() { return null; },
    addEventListener() {},
  };

  const storageApi = {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, value); },
    removeItem(key) { storage.delete(key); },
  };

  const context = {
    document,
    window: {
      location: { search: '', href: 'https://hub.grupocsv.com/axia/' },
      history: { replaceState() {} },
    },
    localStorage: storageApi,
    sessionStorage: storageApi,
    URLSearchParams,
    fetch: async () => new Response('{}', { status: 200 }),
    Response,
    console,
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(source, context);
  return appended.map((element) => element.innerHTML).join('\n');
}

for (const sourcePath of ['../scripts/hub-auth.js', '../docs/public/scripts/hub-auth.js']) {
  test(`${sourcePath} exibe campo opcional de e-mail corporativo no portal de empresa`, async () => {
    const html = await renderAuthForPortal('axia', sourcePath);

    assert.match(html, /id="ha-email"/);
    assert.match(html, /E-mail corporativo/i);
  });
}
