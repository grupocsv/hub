/**
 * Hub CSV - Portal Authentication System v2.6.0
 * Suporta autenticação individual (parceiros) e fixa (empresas)
 * Design system padronizado: fundo gradiente, card branco, logo, cadeado, botão teal
 *
 * Uso: Adicionar ao final do <body> de cada portal protegido:
 *   <script src="/scripts/hub-auth.js" data-portal="unimed"></script>
 *
 * Slot de montagem do widget de logout (v2.6.0):
 *   A página pode indicar ONDE o badge de usuário + botão "Sair" devem montar,
 *   evitando o fallback position:fixed (que pode sobrepor botões no canto
 *   superior direito). Basta incluir no header:
 *     <span id="hub-auth-slot"></span>
 *   ou qualquer elemento com [data-hub-auth-slot]. Para headers escuros,
 *   adicionar data-hub-auth-theme="dark" ao slot (cores claras no widget).
 *   O slot tem precedência sobre os seletores automáticos; páginas sem slot
 *   continuam com o comportamento anterior (retrocompatível).
 *
 * Portais com autenticação individual:
 *   - grupo-csv, unimed, unihealth, icds, 2im
 *
 * Portais de Empresas (senha fixa compartilhada):
 *   - axiacare, thera, medvalor
 */
(function () {
  'use strict';

  var AUTH_API = 'https://csv-auth.guilherme-thom.workers.dev';
  var STORAGE_PREFIX = 'hub_auth_';

  // Detectar portal a partir do atributo data-portal do script
  var scriptTag = document.currentScript || document.querySelector('script[data-portal]');
  var PORTAL_RAW = scriptTag ? scriptTag.getAttribute('data-portal') : null;
  var PORTAL_ALIASES = { 'axia': 'axiacare' };
  var PORTAL = PORTAL_ALIASES[PORTAL_RAW] || PORTAL_RAW;

  if (!PORTAL) {
    console.warn('[Hub Auth v2.1] Atributo data-portal não definido. Autenticação desativada.');
    return;
  }

  var TOKEN_KEY = STORAGE_PREFIX + PORTAL + '_token';
  var EMAIL_KEY = STORAGE_PREFIX + PORTAL + '_email';
  var EXPIRES_KEY = STORAGE_PREFIX + PORTAL + '_expires';
  var VERIFY_VALID = 'valid';
  var VERIFY_INVALID = 'invalid';
  var VERIFY_UNAVAILABLE = 'unavailable';
  var AUTH_REQUEST_TIMEOUT_MS = 10000;
  var readinessResolve = null;
  var authGeneration = 0;
  var activeAuthOperation = null;

  var PARTNER_TENANTS = ['grupo-csv', 'unimed', 'unihealth', 'icds', '2im'];
  var COMPANY_TENANTS = ['axiacare', 'thera', 'medvalor'];

  var IS_PARTNER = PARTNER_TENANTS.includes(PORTAL);
  var IS_COMPANY = COMPANY_TENANTS.includes(PORTAL);

  // Integração: após o load deste script, consumidores devem ler e aguardar a
  // Promise window.HUB_AUTH_READY. A referência é renovada em nova tentativa
  // de login e restauração por BFCache; leia a Promise atual em cada ciclo.
  // Somente o status público "valid" autoriza iniciar sessão ou workspace.
  function beginReadiness() {
    if (readinessResolve) {
      var previousResolve = readinessResolve;
      readinessResolve = null;
      previousResolve(Object.freeze({ status: VERIFY_UNAVAILABLE, portal: PORTAL }));
    }
    window.HUB_AUTH_READY = new Promise(function(resolve) {
      readinessResolve = resolve;
    });
  }

  function settleReadiness(status) {
    if (!readinessResolve) return;
    var resolve = readinessResolve;
    readinessResolve = null;
    resolve(Object.freeze({ status: status, portal: PORTAL }));
  }

  function invalidateAuthOperation() {
    authGeneration += 1;
    if (activeAuthOperation && activeAuthOperation.controller) {
      activeAuthOperation.controller.abort();
    }
    activeAuthOperation = null;
  }

  function beginAuthOperation() {
    invalidateAuthOperation();
    var operation = {
      generation: authGeneration,
      controller: typeof AbortController === 'function' ? new AbortController() : null,
    };
    activeAuthOperation = operation;
    return operation;
  }

  function isCurrentAuthOperation(operation) {
    return Boolean(
      operation &&
      activeAuthOperation === operation &&
      operation.generation === authGeneration &&
      !(operation.controller && operation.controller.signal.aborted)
    );
  }

  function operationSignal(operation) {
    return operation && operation.controller ? operation.controller.signal : undefined;
  }

  async function runAuthRequest(parentSignal, request) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var requestSignal = controller ? controller.signal : parentSignal;
    var rejectAbort = null;
    var settled = false;
    var timeoutId = null;
    var abortPromise = new Promise(function(_resolve, reject) {
      rejectAbort = reject;
    });
    var abortRequest = function(message) {
      if (settled) return;
      if (controller && !controller.signal.aborted) controller.abort();
      var error = new Error(message);
      error.name = 'AbortError';
      rejectAbort(error);
    };
    var abortFromParent = function() {
      abortRequest('Operação de autenticação cancelada.');
    };

    if (parentSignal) {
      if (parentSignal.aborted) {
        abortFromParent();
      } else if (typeof parentSignal.addEventListener === 'function') {
        parentSignal.addEventListener('abort', abortFromParent, { once: true });
      }
    }
    timeoutId = setTimeout(function() {
      abortRequest('Tempo limite da autenticação excedido.');
    }, AUTH_REQUEST_TIMEOUT_MS);

    try {
      return await Promise.race([
        Promise.resolve().then(function() { return request(requestSignal); }),
        abortPromise,
      ]);
    } finally {
      settled = true;
      clearTimeout(timeoutId);
      if (parentSignal && typeof parentSignal.removeEventListener === 'function') {
        parentSignal.removeEventListener('abort', abortFromParent);
      }
    }
  }

  beginReadiness();

  // ===== Session =====
  function clearStoredSession(storage) {
    try {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(EMAIL_KEY);
      storage.removeItem(EXPIRES_KEY);
    } catch (e) {}
  }

  function readStoredSession(storage, storageName) {
    try {
      var token = storage.getItem(TOKEN_KEY);
      var email = storage.getItem(EMAIL_KEY);
      var expires = storage.getItem(EXPIRES_KEY);
      if (!token || !expires) return null;
      var expiresAt = Date.parse(expires);
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        clearStoredSession(storage);
        return null;
      }
      return { token: token, email: email, expires: expires, storage: storageName };
    } catch (e) { return null; }
  }

  function getStoredSession() {
    return readStoredSession(localStorage, 'local')
      || readStoredSession(sessionStorage, 'session');
  }

  function saveSession(token, email, expiresAt, preferredStorage) {
    if (preferredStorage === 'session') {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(EMAIL_KEY, email);
      sessionStorage.setItem(EXPIRES_KEY, expiresAt);
      return;
    }
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(EMAIL_KEY, email);
      localStorage.setItem(EXPIRES_KEY, expiresAt);
    } catch (e) {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(EMAIL_KEY, email);
      sessionStorage.setItem(EXPIRES_KEY, expiresAt);
    }
  }

  function clearSession() {
    [localStorage, sessionStorage].forEach(clearStoredSession);
  }

  // ===== API =====
  async function verifyToken(token, signal) {
    try {
      return await runAuthRequest(signal, async function(requestSignal) {
        var resp = await fetch(AUTH_API + '/verify', {
          headers: { 'X-Auth-Token': token },
          signal: requestSignal,
        });
        if ([400, 401, 403, 404].includes(resp.status)) return VERIFY_INVALID;
        if (resp.status === 429 || resp.status >= 500) return VERIFY_UNAVAILABLE;
        if (!resp.ok) return VERIFY_UNAVAILABLE;
        var data = await resp.json();
        if (data && data.valid === true) {
          if (typeof data.portal !== 'string') return VERIFY_UNAVAILABLE;
          var verifiedPortal = PORTAL_ALIASES[data.portal] || data.portal;
          return verifiedPortal === PORTAL ? VERIFY_VALID : VERIFY_INVALID;
        }
        if (data && data.valid === false) return VERIFY_INVALID;
        return VERIFY_UNAVAILABLE;
      });
    } catch (e) {
      return VERIFY_UNAVAILABLE;
    }
  }

  async function doLogin(email, password, signal) {
    var normalizedEmail = String(email || '').trim().toLowerCase();
    var payload = { portal: PORTAL };
    if (IS_PARTNER) {
      payload.email = normalizedEmail;
      payload.password = password;
    } else if (IS_COMPANY) {
      payload.email = normalizedEmail || 'shared_' + PORTAL;
      payload.password = password;
    }

    return runAuthRequest(signal, async function(requestSignal) {
      var resp = await fetch(AUTH_API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: requestSignal,
      });
      var data = await resp.json();
      if (data.success && data.token) {
        return {
          success: true,
          token: data.token,
          email: data.email || normalizedEmail || 'shared_' + PORTAL,
          expiresAt: data.expires_at,
        };
      }
      return { success: false, error: data.error || 'Erro ao autenticar' };
    });
  }

  async function doRequestAccess(email, name, tenant_id, signal) {
    return runAuthRequest(signal, async function(requestSignal) {
      var resp = await fetch(AUTH_API + '/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, name: name, tenant_id: tenant_id }),
        signal: requestSignal,
      });
      var data = await resp.json();
      return data.success
        ? { success: true }
        : { success: false, error: data.error || 'Erro ao solicitar acesso' };
    });
  }

  function doLogout() {
    var session = getStoredSession();
    invalidateAuthOperation();
    beginReadiness();
    clearSession();
    var logout = document.getElementById('hub-auth-logout');
    if (logout) logout.remove();
    showAuthOverlay();
    settleReadiness('required');
    if (session && session.token) {
      fetch(AUTH_API + '/logout', {
        method: 'POST',
        headers: { 'X-Auth-Token': session.token },
      }).catch(function() {});
    }
  }

  // ===== Portal config =====
  var PORTAL_NAMES = {
    'grupo-csv': 'Grupo CSV',
    unimed: 'Unimed Governador Valadares',
    unihealth: 'Unihealth Governador Valadares',
    icds: 'ICDS',
    '2im': '2iM Intelig\u00eancia M\u00e9dica',
    axiacare: 'AxiaCare',
    thera: 'TheraTech',
    medvalor: 'MedValor',
  };

  // ===== SVG icons =====
  var ICON_LOCK = '<svg class="ha-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  var ICON_EYE_OPEN = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  var ICON_EYE_CLOSED = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

  var bodyLocked = false;
  var lockedBackground = [];

  function ensureStylesheet() {
    if (document.getElementById('hub-auth-styles')) return;
    var link = document.createElement('link');
    link.id = 'hub-auth-styles';
    link.rel = 'stylesheet';
    link.href = '/scripts/hub-auth.css';
    document.head.appendChild(link);
  }

  function setVisible(element, visible) {
    if (element) element.hidden = !visible;
  }

  function configureDialog(overlay, titleId, initialSelector) {
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', titleId);
    overlay.addEventListener('keydown', function(event) {
      if (event.key !== 'Tab') return;
      var focusable = Array.prototype.slice.call(
        overlay.querySelectorAll(
          'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(function(element) {
        if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
        var hiddenAncestor = element.closest && element.closest('[hidden]');
        if (hiddenAncestor) return false;
        var tabContent = element.closest && element.closest('.ha-tab-content');
        return !tabContent || tabContent.classList.contains('active');
      });
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    var initialFocus = overlay.querySelector(initialSelector);
    if (initialFocus && typeof initialFocus.focus === 'function') initialFocus.focus();
  }

  function lockBody() {
    if (bodyLocked) return;
    bodyLocked = true;
    lockedBackground = Array.prototype.slice.call(document.body.children || [])
      .filter(function(element) { return element.id !== 'hub-auth-overlay'; })
      .map(function(element) {
        var snapshot = {
          element: element,
          hidden: element.hidden === true,
          inert: element.inert === true,
          ariaHidden: element.getAttribute ? element.getAttribute('aria-hidden') : null,
        };
        element.hidden = true;
        element.inert = true;
        if (element.setAttribute) element.setAttribute('aria-hidden', 'true');
        return snapshot;
      });
    document.body.classList.add('ha-scroll-locked');
  }

  function unlockBody() {
    lockedBackground.forEach(function(snapshot) {
      var element = snapshot.element;
      element.hidden = snapshot.hidden;
      element.inert = snapshot.inert;
      if (element.setAttribute && snapshot.ariaHidden !== null) {
        element.setAttribute('aria-hidden', snapshot.ariaHidden);
      } else if (element.removeAttribute) {
        element.removeAttribute('aria-hidden');
      }
    });
    lockedBackground = [];
    bodyLocked = false;
    document.body.classList.remove('ha-scroll-locked');
  }

  // ===== Build HTML =====
  function buildPartnerHTML() {
    return '\
<div class="ha-tabs" role="tablist" aria-label="Opções de autenticação">\
  <button class="ha-tab active" id="ha-tab-login" data-tab="login" role="tab" aria-selected="true" aria-controls="ha-panel-login">Login</button>\
  <button class="ha-tab" id="ha-tab-request" data-tab="request" role="tab" aria-selected="false" aria-controls="ha-panel-request">Solicitar Acesso</button>\
</div>\
<div class="ha-tab-content active" id="ha-panel-login" data-tab="login" role="tabpanel" aria-labelledby="ha-tab-login">\
  <div class="ha-error" id="ha-error" role="alert" aria-live="assertive" hidden></div>\
  <div class="ha-field">\
    <label for="ha-email">E-mail</label>\
    <input type="email" id="ha-email" placeholder="seu@email.com" autocomplete="email">\
  </div>\
  <div class="ha-field">\
    <label for="ha-password">Senha</label>\
    <div class="ha-pw-wrap">\
      <input type="password" id="ha-password" placeholder="Digite sua senha" autocomplete="current-password">\
      <button class="ha-pw-toggle" id="ha-pw-toggle" type="button" aria-label="Mostrar senha" aria-pressed="false">\
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + ICON_EYE_OPEN + '</svg>\
      </button>\
    </div>\
  </div>\
  <button class="ha-btn" id="ha-login-btn"><span class="ha-spinner"></span><span>Entrar</span></button>\
  <div class="ha-link-row"><a href="#" id="ha-forgot-link" class="ha-inline-link">Esqueci minha senha</a></div>\
</div>\
<div class="ha-tab-content" data-tab="forgot">\
  <div class="ha-error" id="ha-error-forgot" role="alert" aria-live="assertive" hidden></div>\
  <div class="ha-success" id="ha-success-forgot" role="status" aria-live="polite" tabindex="-1" hidden></div>\
  <p class="ha-body-copy">Informe seu e-mail para receber o link de redefini\u00e7\u00e3o.</p>\
  <div class="ha-field">\
    <label for="ha-forgot-email">E-mail</label>\
    <input type="email" id="ha-forgot-email" placeholder="seu@email.com">\
  </div>\
  <button class="ha-btn" id="ha-forgot-btn"><span class="ha-spinner"></span><span>Enviar Link</span></button>\
  <div class="ha-link-row"><a href="#" id="ha-back-login" class="ha-inline-link">\u2190 Voltar ao Login</a></div>\
</div>\
<div class="ha-tab-content" id="ha-panel-request" data-tab="request" role="tabpanel" aria-labelledby="ha-tab-request">\
  <div class="ha-error" id="ha-error-request" role="alert" aria-live="assertive" hidden></div>\
  <div class="ha-success" id="ha-success-request" role="status" aria-live="polite" tabindex="-1" hidden></div>\
  <div class="ha-field">\
    <label for="ha-request-name">Nome Completo</label>\
    <input type="text" id="ha-request-name" placeholder="Seu nome completo">\
  </div>\
  <div class="ha-field">\
    <label for="ha-request-email">E-mail</label>\
    <input type="email" id="ha-request-email" placeholder="seu@email.com">\
  </div>\
  <button class="ha-btn" id="ha-request-btn"><span class="ha-spinner"></span><span>Solicitar Acesso</span></button>\
</div>';
  }

  function buildCompanyHTML() {
    return '\
<div class="ha-error" id="ha-error" role="alert" aria-live="assertive" hidden></div>\
<div class="ha-field">\
  <label for="ha-email">E-mail corporativo (opcional)</label>\
  <input type="email" id="ha-email" placeholder="nome@grupocsv.com" autocomplete="email">\
  <div class="ha-field-help">Colaboradores do Grupo CSV podem usar a credencial individual. Para o acesso compartilhado, deixe este campo em branco.</div>\
</div>\
<div class="ha-field">\
  <label for="ha-password">Senha</label>\
  <div class="ha-pw-wrap">\
    <input type="password" id="ha-password" placeholder="Digite a senha de acesso" autocomplete="current-password">\
    <button class="ha-pw-toggle" id="ha-pw-toggle" type="button" aria-label="Mostrar senha" aria-pressed="false">\
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + ICON_EYE_OPEN + '</svg>\
    </button>\
  </div>\
</div>\
<button class="ha-btn" id="ha-login-btn"><span class="ha-spinner"></span><span>Entrar</span></button>';
  }

  // ===== Show Auth Overlay =====
  function showSessionValidationOverlay() {
    var existing = document.getElementById('hub-auth-overlay');
    if (existing) existing.remove();

    ensureStylesheet();
    lockBody();

    var overlay = document.createElement('div');
    overlay.id = 'hub-auth-overlay';
    overlay.className = 'ha-portal-' + PORTAL;
    overlay.setAttribute('aria-busy', 'true');
    overlay.innerHTML = '\
<div class="ha-modal" tabindex="-1">\
  <img src="/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png" alt="Grupo CSV" class="ha-logo">\
  ' + ICON_LOCK + '\
  <h2 class="ha-title" id="ha-dialog-title"></h2>\
  <p class="ha-subtitle" role="status" aria-live="polite">Validando sua sessão...</p>\
  <div class="ha-footer">Hub Grupo CSV</div>\
</div>';
    var validationTitle = overlay.querySelector('#ha-dialog-title');
    if (validationTitle) validationTitle.textContent = PORTAL_NAMES[PORTAL] || PORTAL;

    document.body.appendChild(overlay);
    configureDialog(overlay, 'ha-dialog-title', '.ha-modal');
    return overlay;
  }

  function showAuthOverlay() {
    var existing = document.getElementById('hub-auth-overlay');
    if (existing) existing.remove();

    ensureStylesheet();
    lockBody();

    var overlay = document.createElement('div');
    overlay.id = 'hub-auth-overlay';
    overlay.className = 'ha-portal-' + PORTAL;

    var bodyHTML = IS_PARTNER ? buildPartnerHTML() : buildCompanyHTML();

    overlay.innerHTML = '\
<div class="ha-modal">\
  <img src="/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png" alt="Grupo CSV" class="ha-logo">\
  ' + ICON_LOCK + '\
  <h2 class="ha-title" id="ha-dialog-title"></h2>\
  <p class="ha-subtitle">' + (IS_PARTNER ? 'Acesso restrito a usuários autorizados' : 'Acesso restrito') + '</p>\
  ' + bodyHTML + '\
  <div class="ha-footer">Hub Grupo CSV</div>\
</div>';
    var dialogTitle = overlay.querySelector('#ha-dialog-title');
    if (dialogTitle) dialogTitle.textContent = PORTAL_NAMES[PORTAL] || PORTAL;

    document.body.appendChild(overlay);
    bindEvents(overlay);
    configureDialog(overlay, 'ha-dialog-title', '#ha-email');
  }

  // ===== Bind Events =====
  function bindEvents(overlay) {
    // Tabs (parceiros)
    if (IS_PARTNER) {
      var tabs = overlay.querySelectorAll('.ha-tab');
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          var tabName = this.getAttribute('data-tab');
          tabs.forEach(function(t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          overlay.querySelectorAll('.ha-tab-content').forEach(function(c) { c.classList.remove('active'); });
          this.classList.add('active');
          this.setAttribute('aria-selected', 'true');
          // Selecionar o tab-content correto (não o botão)
          var contents = overlay.querySelectorAll('.ha-tab-content[data-tab="' + tabName + '"]');
          if (contents.length > 0) contents[0].classList.add('active');
        });
      });
    }

    // Toggle senha
    var pwToggle = overlay.querySelector('#ha-pw-toggle');
    var pwInput = overlay.querySelector('#ha-password');
    if (pwToggle && pwInput) {
      pwToggle.addEventListener('click', function(e) {
        e.preventDefault();
        var svg = this.querySelector('svg');
        if (pwInput.type === 'password') {
          pwInput.type = 'text';
          svg.innerHTML = ICON_EYE_CLOSED;
          this.setAttribute('aria-label', 'Ocultar senha');
          this.setAttribute('aria-pressed', 'true');
        } else {
          pwInput.type = 'password';
          svg.innerHTML = ICON_EYE_OPEN;
          this.setAttribute('aria-label', 'Mostrar senha');
          this.setAttribute('aria-pressed', 'false');
        }
      });
    }

    // Login
    var loginBtn = overlay.querySelector('#ha-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', async function() {
        var errorEl = overlay.querySelector('#ha-error');
        setVisible(errorEl, false);

        var email = overlay.querySelector('#ha-email');
        var password = overlay.querySelector('#ha-password');

        if (IS_PARTNER && (!email || !email.value)) {
          errorEl.textContent = 'Por favor, preencha o e-mail';
          setVisible(errorEl, true);
          return;
        }
        if (!password || !password.value) {
          errorEl.textContent = 'Por favor, preencha a senha';
          setVisible(errorEl, true);
          return;
        }

        loginBtn.disabled = true;
        loginBtn.classList.add('loading');

        beginReadiness();
        var operation = beginAuthOperation();
        try {
          var result = await doLogin(
            email ? email.value : 'shared_' + PORTAL,
            password.value,
            operationSignal(operation),
          );
          if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
          if (!result.success) {
            settleReadiness(VERIFY_INVALID);
            errorEl.textContent = result.error;
            setVisible(errorEl, true);
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            return;
          }

          var verification = await verifyToken(result.token, operationSignal(operation));
          if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
          if (verification !== VERIFY_VALID) {
            clearSession();
            settleReadiness(verification);
            errorEl.textContent = verification === VERIFY_INVALID
              ? 'Não foi possível validar a sessão. Entre novamente.'
              : 'A validação da sessão está indisponível. Tente novamente.';
            setVisible(errorEl, true);
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            return;
          }

          saveSession(result.token, result.email, result.expiresAt);
          settleReadiness(VERIFY_VALID);
          overlay.remove();
          unlockBody();
          addLogoutButton();
          var logoutFocus = document.getElementById('ha-logout-btn');
          if (logoutFocus && typeof logoutFocus.focus === 'function') logoutFocus.focus();
          } catch (e) {
            if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
            clearSession();
            settleReadiness(VERIFY_UNAVAILABLE);
            errorEl.textContent = 'A validação da sessão está indisponível. Tente novamente.';
            setVisible(errorEl, true);
          } finally {
            if (overlay.isConnected !== false) {
              loginBtn.disabled = false;
              loginBtn.classList.remove('loading');
            }
          }
      });
    }

    // Request Access (parceiros)
    if (IS_PARTNER) {
      var requestBtn = overlay.querySelector('#ha-request-btn');
      if (requestBtn) {
        requestBtn.addEventListener('click', async function() {
          var errorEl = overlay.querySelector('#ha-error-request');
          var successEl = overlay.querySelector('#ha-success-request');
          setVisible(errorEl, false);
          setVisible(successEl, false);

          var name = overlay.querySelector('#ha-request-name');
          var email = overlay.querySelector('#ha-request-email');

          if (!name.value) { errorEl.textContent = 'Por favor, preencha o nome'; setVisible(errorEl, true); return; }
          if (!email.value) { errorEl.textContent = 'Por favor, preencha o e-mail'; setVisible(errorEl, true); return; }

          requestBtn.disabled = true;
          requestBtn.classList.add('loading');

          var operation = beginAuthOperation();
          settleReadiness('required');
          try {
            var result = await doRequestAccess(
              email.value,
              name.value,
              PORTAL,
              operationSignal(operation),
            );
            if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
            if (result.success) {
              successEl.replaceChildren();
              successEl.appendChild(document.createTextNode('Solicita\u00e7\u00e3o enviada com sucesso! Voc\u00ea receber\u00e1 um e-mail quando sua solicita\u00e7\u00e3o for aprovada.'));
              successEl.appendChild(document.createElement('br'));
              var successBackLink = document.createElement('a');
              successBackLink.href = '#';
              successBackLink.id = 'ha-back-to-login';
              successBackLink.className = 'ha-inline-link ha-back-link';
              successBackLink.textContent = '\u2190 Voltar ao Login';
              successEl.appendChild(successBackLink);
              setVisible(successEl, true);
              name.value = '';
              email.value = '';
              setVisible(requestBtn, false);
              overlay.querySelectorAll('#ha-request-name, #ha-request-email').forEach(function(el) { setVisible(el.closest('.ha-field'), false); });
              var backLink = overlay.querySelector('#ha-back-to-login');
              if (backLink) {
                backLink.addEventListener('click', function(e) {
                  e.preventDefault();
                  setVisible(successEl, false);
                  setVisible(requestBtn, true);
                  requestBtn.disabled = false;
                  requestBtn.classList.remove('loading');
                  overlay.querySelectorAll('#ha-request-name, #ha-request-email').forEach(function(el) { setVisible(el.closest('.ha-field'), true); });
                  var loginTab = overlay.querySelector('.ha-tab[data-tab="login"]');
                  if (loginTab) loginTab.click();
                  var loginEmail = overlay.querySelector('#ha-email');
                  if (loginEmail && typeof loginEmail.focus === 'function') loginEmail.focus();
                });
              }
              if (typeof successBackLink.focus === 'function') successBackLink.focus();
              setTimeout(function() { requestBtn.disabled = false; requestBtn.classList.remove('loading'); }, 2000);
            } else {
              errorEl.textContent = result.error;
              setVisible(errorEl, true);
              requestBtn.disabled = false;
              requestBtn.classList.remove('loading');
            }
          } catch (e) {
            if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
            errorEl.textContent = 'Erro de conexão. Tente novamente.';
            setVisible(errorEl, true);
          } finally {
            if (overlay.isConnected !== false) {
              requestBtn.disabled = false;
              requestBtn.classList.remove('loading');
            }
          }
        });
      }
    }

    // Forgot Password link
    if (IS_PARTNER) {
      var forgotLink = overlay.querySelector('#ha-forgot-link');
      if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
          e.preventDefault();
          overlay.querySelectorAll('.ha-tab-content').forEach(function(c) { c.classList.remove('active'); });
          overlay.querySelectorAll('.ha-tab').forEach(function(t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          var forgotTab = overlay.querySelector('.ha-tab-content[data-tab="forgot"]');
          if (forgotTab) forgotTab.classList.add('active');
          var forgotEmail = overlay.querySelector('#ha-forgot-email');
          if (forgotEmail && typeof forgotEmail.focus === 'function') forgotEmail.focus();
        });
      }

      var backLogin = overlay.querySelector('#ha-back-login');
      if (backLogin) {
        backLogin.addEventListener('click', function(e) {
          e.preventDefault();
          overlay.querySelectorAll('.ha-tab-content').forEach(function(c) { c.classList.remove('active'); });
          overlay.querySelectorAll('.ha-tab').forEach(function(t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          var loginContent = overlay.querySelector('.ha-tab-content[data-tab="login"]');
          var loginTab = overlay.querySelector('.ha-tab[data-tab="login"]');
          if (loginContent) loginContent.classList.add('active');
          if (loginTab) {
            loginTab.classList.add('active');
            loginTab.setAttribute('aria-selected', 'true');
          }
          var loginEmail = overlay.querySelector('#ha-email');
          if (loginEmail && typeof loginEmail.focus === 'function') loginEmail.focus();
        });
      }

      var forgotBtn = overlay.querySelector('#ha-forgot-btn');
      if (forgotBtn) {
        forgotBtn.addEventListener('click', async function() {
          var errorEl = overlay.querySelector('#ha-error-forgot');
          var successEl = overlay.querySelector('#ha-success-forgot');
          setVisible(errorEl, false);
          setVisible(successEl, false);

          var email = overlay.querySelector('#ha-forgot-email');
          if (!email || !email.value) {
            errorEl.textContent = 'Por favor, preencha o e-mail';
            setVisible(errorEl, true);
            return;
          }

          forgotBtn.disabled = true;
          forgotBtn.classList.add('loading');
          var operation = beginAuthOperation();
          settleReadiness('required');

          try {
            var data = await runAuthRequest(operationSignal(operation), async function(requestSignal) {
              var resp = await fetch(AUTH_API + '/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.value }),
                signal: requestSignal,
              });
              return resp.json();
            });
            if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
            if (data.success) {
              successEl.textContent = 'Se o e-mail estiver cadastrado, voc\u00ea receber\u00e1 um link para redefinir sua senha.';
              setVisible(successEl, true);
              email.value = '';
              if (typeof successEl.focus === 'function') successEl.focus();
            } else {
              errorEl.textContent = data.error || 'Erro ao processar';
              setVisible(errorEl, true);
            }
          } catch (e) {
            if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
            errorEl.textContent = 'Erro de conex\u00e3o';
            setVisible(errorEl, true);
          } finally {
            if (overlay.isConnected !== false) {
              forgotBtn.disabled = false;
              forgotBtn.classList.remove('loading');
            }
          }
        });
      }
    }

    // Enter key
    var passwordInput = overlay.querySelector('#ha-password');
    if (passwordInput && loginBtn) {
      passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loginBtn.click();
      });
    }
    var emailInput = overlay.querySelector('#ha-email');
    if (emailInput && loginBtn) {
      emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loginBtn.click();
      });
    }
  }

  // ===== Logout Button =====
  function addLogoutButton() {
    var session = getStoredSession();
    if (!session) return;
    ensureStylesheet();

    var existing = document.getElementById('hub-auth-logout');
    if (existing) return;

    // Truncar e-mail para exibição
    var emailDisplay = session.email || '';
    var emailShort = emailDisplay.length > 24 ? emailDisplay.substring(0, 22) + '...' : emailDisplay;

    var btn = document.createElement('div');
    btn.id = 'hub-auth-logout';
    var badge = document.createElement('span');
    badge.className = 'ha-user-badge';
    badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    var emailLabel = document.createElement('span');
    emailLabel.title = emailDisplay;
    emailLabel.textContent = emailShort;
    badge.appendChild(emailLabel);

    var logoutLink = document.createElement('a');
    logoutLink.className = 'ha-logout-btn';
    logoutLink.id = 'ha-logout-btn';
    logoutLink.href = '#';
    logoutLink.title = 'Encerrar sessão';
    logoutLink.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Sair</span>';
    btn.appendChild(badge);
    btn.appendChild(logoutLink);

    // Slot explícito da página (v2.5.0) — precedência sobre os seletores automáticos
    var slot = document.getElementById('hub-auth-slot')
      || document.querySelector('[data-hub-auth-slot]');

    // Tentar inserir inline no header existente (dentro do flex row)
    var headerFlex = document.querySelector('header .flex.items-center.justify-between')
      || document.querySelector('header > div > .flex')
      || null;

    // VitePress: inserir após os social links no container extra-content
    var vpExtraContent = document.querySelector('.VPNavBar .content .content-body .extra-content');
    var vpSocialLinks = document.querySelector('.VPNavBar .VPSocialLinks');

    if (slot) {
      btn.classList.add('ha-in-slot');
      if (slot.getAttribute('data-hub-auth-theme') === 'dark') btn.classList.add('ha-dark');
      slot.appendChild(btn);
    } else if (headerFlex) {
      // Inserir como item flex no final da row do header (ao lado do portal name)
      btn.classList.add('ha-in-header');
      headerFlex.appendChild(btn);
    } else if (vpSocialLinks && vpSocialLinks.parentElement) {
      // Inserir após os social links como irmão no flex container
      btn.classList.add('ha-in-nav');
      vpSocialLinks.parentElement.appendChild(btn);
    } else if (vpExtraContent) {
      // Fallback VitePress: inserir no extra-content
      btn.classList.add('ha-in-nav');
      vpExtraContent.appendChild(btn);
    } else {
      // Fallback: fixo no topo direito
      document.body.appendChild(btn);
    }

    document.getElementById('ha-logout-btn').addEventListener('click', function(e) {
      e.preventDefault();
      doLogout();
    });
  }

  // ===== Set Password Overlay =====
  function showSetPasswordOverlay(token, operation) {
    var existing = document.getElementById('hub-auth-overlay');
    if (existing) existing.remove();

    ensureStylesheet();
    lockBody();

    var overlay = document.createElement('div');
    overlay.id = 'hub-auth-overlay';
    overlay.className = 'ha-portal-' + PORTAL;

    overlay.innerHTML = '<div class="ha-modal">' +
      '<img src="/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png" alt="Grupo CSV" class="ha-logo">' +
      ICON_LOCK +
      '<h2 class="ha-title" id="ha-setpw-title">Definir Senha</h2>' +
      '<p class="ha-subtitle">Crie sua senha de acesso ao portal</p>' +
      '<div class="ha-error" id="ha-error-setpw" role="alert" aria-live="assertive" hidden></div>' +
      '<div class="ha-success" id="ha-success-setpw" role="status" aria-live="polite" tabindex="-1" hidden></div>' +
      '<div class="ha-field"><label for="ha-setpw-password">Nova Senha</label><div class="ha-pw-wrap"><input type="password" id="ha-setpw-password" placeholder="M\u00ednimo 6 caracteres" autocomplete="new-password"></div></div>' +
      '<div class="ha-field"><label for="ha-setpw-confirm">Confirmar Senha</label><div class="ha-pw-wrap"><input type="password" id="ha-setpw-confirm" placeholder="Repita a senha" autocomplete="new-password"></div></div>' +
      '<button class="ha-btn" id="ha-setpw-btn"><span class="ha-spinner"></span><span>Definir Senha</span></button>' +
      '<div class="ha-footer">Hub Grupo CSV</div>' +
      '</div>';

    document.body.appendChild(overlay);
    configureDialog(overlay, 'ha-setpw-title', '#ha-setpw-password');

    var btn = overlay.querySelector('#ha-setpw-btn');
    btn.addEventListener('click', async function() {
      var errorEl = overlay.querySelector('#ha-error-setpw');
      var successEl = overlay.querySelector('#ha-success-setpw');
      setVisible(errorEl, false);
      setVisible(successEl, false);

      var pw = overlay.querySelector('#ha-setpw-password').value;
      var confirmPw = overlay.querySelector('#ha-setpw-confirm').value;

      if (!pw || pw.length < 6) {
        errorEl.textContent = 'Senha deve ter no m\u00ednimo 6 caracteres';
        setVisible(errorEl, true);
        return;
      }
      if (pw !== confirmPw) {
        errorEl.textContent = 'As senhas n\u00e3o coincidem';
        setVisible(errorEl, true);
        return;
      }

      btn.disabled = true;
      btn.classList.add('loading');

      try {
        var data = await runAuthRequest(operationSignal(operation), async function(requestSignal) {
          var resp = await fetch(AUTH_API + '/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, password: pw }),
            signal: requestSignal,
          });
          return resp.json();
        });
        if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
        if (data.success) {
          successEl.textContent = 'Senha definida com sucesso! Redirecionando...';
          setVisible(successEl, true);
          setVisible(btn, false);
          overlay.querySelectorAll('.ha-field').forEach(function(f) { setVisible(f, false); });
          if (typeof successEl.focus === 'function') successEl.focus();
          setTimeout(function() {
            if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
            overlay.remove();
            unlockBody();
            showAuthOverlay();
          }, 2000);
        } else {
          errorEl.textContent = data.error || 'Erro ao definir senha';
          setVisible(errorEl, true);
          btn.disabled = false;
          btn.classList.remove('loading');
        }
      } catch (e) {
        if (!isCurrentAuthOperation(operation) || overlay.isConnected === false) return;
        errorEl.textContent = 'Erro de conex\u00e3o. Tente novamente.';
        setVisible(errorEl, true);
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });

    overlay.querySelector('#ha-setpw-confirm').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') btn.click();
    });
  }

  // ===== Init =====
  function consumeSetPasswordUrl(urlParams) {
    urlParams.delete('set-password');
    var query = urlParams.toString();
    var cleanUrl =
      (window.location.pathname || '/') +
      (query ? '?' + query : '') +
      (window.location.hash || '');
    window.history.replaceState({}, '', cleanUrl);
  }

  function scrubAuthDom() {
    var overlay = document.getElementById('hub-auth-overlay');
    if (overlay) {
      overlay.querySelectorAll('input, textarea').forEach(function(field) {
        field.value = '';
      });
      overlay.remove();
    }
    var logout = document.getElementById('hub-auth-logout');
    if (logout) logout.remove();
  }

  async function init() {
    var operation = beginAuthOperation();
    // Verificar se ha token de set-password na URL
    var urlParams = new URLSearchParams(window.location.search);
    var setPasswordToken = urlParams.get('set-password');
    if (setPasswordToken) {
      consumeSetPasswordUrl(urlParams);
      clearSession();
      showSetPasswordOverlay(setPasswordToken, operation);
      settleReadiness('set_password');
      return;
    }

    var session = getStoredSession();
    if (session && session.token) {
      var validationOverlay = showSessionValidationOverlay();
      clearSession();
      var verification = await verifyToken(session.token, operationSignal(operation));
      if (!isCurrentAuthOperation(operation)) return;
      if (verification === VERIFY_VALID) {
        saveSession(session.token, session.email, session.expires, session.storage);
        settleReadiness(VERIFY_VALID);
        if (validationOverlay.isConnected !== false) validationOverlay.remove();
        unlockBody();
        addLogoutButton();
        var logoutFocus = document.getElementById('ha-logout-btn');
        if (logoutFocus && typeof logoutFocus.focus === 'function') logoutFocus.focus();
        return;
      }
      settleReadiness(verification);
      showAuthOverlay();
      return;
    }
    showAuthOverlay();
    settleReadiness('required');
  }

  if (window && typeof window.addEventListener === 'function') {
    window.addEventListener('pagehide', function() {
      invalidateAuthOperation();
      settleReadiness(VERIFY_UNAVAILABLE);
      scrubAuthDom();
    });
    window.addEventListener('pageshow', function(event) {
      if (event && event.persisted === true) {
        beginReadiness();
        init();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
