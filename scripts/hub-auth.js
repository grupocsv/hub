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
 * Portais de Parceiros (autenticação individual):
 *   - unimed, unihealth, icds
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

  var PARTNER_TENANTS = ['unimed', 'unihealth', 'icds'];
  var COMPANY_TENANTS = ['axiacare', 'thera', 'medvalor'];

  var IS_PARTNER = PARTNER_TENANTS.includes(PORTAL);
  var IS_COMPANY = COMPANY_TENANTS.includes(PORTAL);

  // ===== Session =====
  function getStoredSession() {
    try {
      var token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      var email = localStorage.getItem(EMAIL_KEY) || sessionStorage.getItem(EMAIL_KEY);
      var expires = localStorage.getItem(EXPIRES_KEY) || sessionStorage.getItem(EXPIRES_KEY);
      if (!token || !expires) return null;
      if (new Date() > new Date(expires)) { clearSession(); return null; }
      return { token: token, email: email, expires: expires };
    } catch (e) { return null; }
  }

  function saveSession(token, email, expiresAt) {
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
    [localStorage, sessionStorage].forEach(function(s) {
      s.removeItem(TOKEN_KEY); s.removeItem(EMAIL_KEY); s.removeItem(EXPIRES_KEY);
    });
  }

  // ===== API =====
  async function verifyToken(token) {
    try {
      var resp = await fetch(AUTH_API + '/verify', { headers: { 'X-Auth-Token': token } });
      // Servidor rejeitou explicitamente a sessão (revogada/expirada): derrubar,
      // mesmo que o corpo não traga o flag esperado.
      if (resp.status === 401 || resp.status === 403) return false;
      // Erro transitório do servidor (5xx): não derrubar a sessão local já
      // não-expirada — será reavaliada na próxima visita.
      if (!resp.ok) return true;
      var data = await resp.json();
      return data.valid === true;
    } catch (e) {
      // Erro de rede: manter a sessão local (não-expirada) em vez de deslogar
      // em falha transitória — evita logout em blip de rede e negação de serviço
      // por bloqueio do /verify. Reavaliado na próxima navegação.
      return true;
    }
  }

  async function doLogin(email, password) {
    var normalizedEmail = String(email || '').trim().toLowerCase();
    var payload = { portal: PORTAL };
    if (IS_PARTNER) {
      payload.email = normalizedEmail;
      payload.password = password;
    } else if (IS_COMPANY) {
      payload.email = normalizedEmail || 'shared_' + PORTAL;
      payload.password = password;
    }

    var resp = await fetch(AUTH_API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    var data = await resp.json();
    if (data.success && data.token) {
      saveSession(data.token, data.email || normalizedEmail || 'shared_' + PORTAL, data.expires_at);
      return { success: true };
    }
    return { success: false, error: data.error || 'Erro ao autenticar' };
  }

  async function doRequestAccess(email, name, tenant_id) {
    var resp = await fetch(AUTH_API + '/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, name: name, tenant_id: tenant_id }),
    });
    var data = await resp.json();
    return data.success ? { success: true } : { success: false, error: data.error || 'Erro ao solicitar acesso' };
  }

  async function doLogout() {
    var session = getStoredSession();
    if (session && session.token) {
      try { await fetch(AUTH_API + '/logout', { method: 'POST', headers: { 'X-Auth-Token': session.token } }); } catch (e) {}
    }
    clearSession();
    showAuthOverlay();
  }

  // ===== Portal config =====
  var PORTAL_NAMES = {
    unimed: 'Unimed Governador Valadares',
    unihealth: 'Unihealth Governador Valadares',
    icds: 'ICDS',
    axiacare: 'AxiaCare',
    thera: 'TheraTech',
    medvalor: 'MedValor',
  };

  var PORTAL_COLORS = {
    unimed:    { accent: '#00995d', gradient: 'linear-gradient(135deg, #00995d, #8baf1f)' },
    unihealth: { accent: '#013d19', gradient: 'linear-gradient(135deg, #013d19, #ec7106)' },
    icds:      { accent: '#1B3A5C', gradient: 'linear-gradient(135deg, #1B3A5C, #2a6496)' },
    axiacare:  { accent: '#196396', gradient: 'linear-gradient(135deg, #196396, #2DBF7F)' },
    thera:     { accent: '#6B5B95', gradient: 'linear-gradient(135deg, #6B5B95, #7c3aed)' },
    medvalor:  { accent: '#ea580c', gradient: 'linear-gradient(135deg, #ea580c, #f97316)' },
  };

  var colors = PORTAL_COLORS[PORTAL] || PORTAL_COLORS.axiacare;

  // ===== SVG icons =====
  var ICON_LOCK = '<svg class="ha-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  var ICON_EYE_OPEN = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  var ICON_EYE_CLOSED = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

  // ===== Build CSS =====
  function buildCSS() {
    return '\
#hub-auth-overlay {\
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;\
  display: flex; align-items: center; justify-content: center;\
  background: linear-gradient(135deg, #0f2b46 0%, #196396 50%, #1a7a6d 100%);\
  animation: haFadeIn 0.3s ease;\
}\
@keyframes haFadeIn { from { opacity: 0; } to { opacity: 1; } }\
.ha-modal {\
  background: white; border-radius: 20px;\
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);\
  width: 100%; max-width: 400px; margin: 20px;\
  padding: 48px 40px 40px; text-align: center;\
  animation: haSlideUp 0.4s ease;\
}\
@keyframes haSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }\
.ha-logo { height: 52px; margin-bottom: 20px; object-fit: contain; }\
.ha-lock-icon { width: 44px; height: 44px; margin: 0 auto 16px; color: ' + colors.accent + '; display: block; }\
.ha-title { font-size: 20px; font-weight: 700; color: #0f2b46; margin: 0 0 6px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }\
.ha-subtitle { font-size: 13px; color: #6b7280; margin: 0 0 28px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }\
.ha-field { margin-bottom: 16px; text-align: left; }\
.ha-field label {\
  display: block; font-size: 12px; font-weight: 600; color: #6b7280;\
  margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;\
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\
}\
.ha-field input {\
  width: 100%; padding: 12px 14px; border: 1.5px solid #e5e7eb;\
  border-radius: 10px; font-size: 15px; outline: none;\
  background: #f8f9fa; transition: all 0.2s; box-sizing: border-box;\
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\
}\
.ha-field input:focus { border-color: ' + colors.accent + '; box-shadow: 0 0 0 3px ' + colors.accent + '1a; background: white; }\
.ha-pw-wrap { position: relative; }\
.ha-pw-wrap input { padding-right: 44px; }\
.ha-pw-toggle {\
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);\
  background: none; border: none; cursor: pointer; padding: 4px;\
  display: flex; align-items: center; color: #9ca3af; transition: color 0.2s;\
}\
.ha-pw-toggle:hover { color: #374151; }\
.ha-pw-toggle svg { width: 18px; height: 18px; }\
.ha-error {\
  display: none; color: #dc2626; font-size: 13px; margin-bottom: 12px;\
  padding: 10px 14px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;\
  text-align: left; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\
}\
.ha-success {\
  display: none; color: #059669; font-size: 13px; margin-bottom: 12px;\
  padding: 10px 14px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;\
  text-align: left; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\
}\
.ha-btn {\
  width: 100%; padding: 13px; color: white;\
  background: ' + colors.gradient + ';\
  border: none; border-radius: 10px; font-size: 15px; font-weight: 600;\
  cursor: pointer; transition: all 0.2s; margin-top: 4px;\
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\
}\
.ha-btn:hover { opacity: 0.9; transform: translateY(-1px); }\
.ha-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }\
.ha-btn.loading { display: flex; align-items: center; justify-content: center; }\
.ha-spinner {\
  display: none; width: 18px; height: 18px;\
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;\
  border-radius: 50%; animation: haSpin 0.8s linear infinite; margin-right: 8px;\
}\
@keyframes haSpin { to { transform: rotate(360deg); } }\
.ha-btn.loading .ha-spinner { display: inline-block; }\
.ha-tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1.5px solid #e5e7eb; }\
.ha-tab {\
  flex: 1; padding: 12px; background: none; border: none;\
  border-bottom: 2px solid transparent; color: #6b7280; font-weight: 600;\
  cursor: pointer; font-size: 14px; transition: all 0.2s;\
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\
}\
.ha-tab.active { color: ' + colors.accent + '; border-bottom-color: ' + colors.accent + '; }\
.ha-tab-content { display: none; }\
.ha-tab-content.active { display: block; }\
.ha-footer {\
  margin-top: 20px; font-size: 12px; color: #9ca3af;\
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\
}\
.ha-footer a { color: ' + colors.accent + '; text-decoration: none; cursor: pointer; }\
.ha-footer a:hover { text-decoration: underline; }\
@media (max-width: 480px) { .ha-modal { padding: 32px 24px 28px; margin: 12px; } }\
@media print { #hub-auth-overlay { display: none !important; } }\
';
  }

  // ===== Build HTML =====
  function buildPartnerHTML() {
    return '\
<div class="ha-tabs">\
  <button class="ha-tab active" data-tab="login">Login</button>\
  <button class="ha-tab" data-tab="request">Solicitar Acesso</button>\
</div>\
<div class="ha-tab-content active" data-tab="login">\
  <div class="ha-error" id="ha-error"></div>\
  <div class="ha-field">\
    <label>E-mail</label>\
    <input type="email" id="ha-email" placeholder="seu@email.com" autocomplete="email">\
  </div>\
  <div class="ha-field">\
    <label>Senha</label>\
    <div class="ha-pw-wrap">\
      <input type="password" id="ha-password" placeholder="Digite sua senha" autocomplete="current-password">\
      <button class="ha-pw-toggle" id="ha-pw-toggle" type="button">\
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + ICON_EYE_OPEN + '</svg>\
      </button>\
    </div>\
  </div>\
  <button class="ha-btn" id="ha-login-btn"><span class="ha-spinner"></span><span>Entrar</span></button>\
  <div style="margin-top:12px;text-align:center;"><a href="#" id="ha-forgot-link" style="font-size:13px;color:' + colors.accent + ';text-decoration:none;">Esqueci minha senha</a></div>\
</div>\
<div class="ha-tab-content" data-tab="forgot">\
  <div class="ha-error" id="ha-error-forgot"></div>\
  <div class="ha-success" id="ha-success-forgot"></div>\
  <p style="font-size:14px;color:#555;margin-bottom:16px;">Informe seu e-mail para receber o link de redefini\u00e7\u00e3o.</p>\
  <div class="ha-field">\
    <label>E-mail</label>\
    <input type="email" id="ha-forgot-email" placeholder="seu@email.com">\
  </div>\
  <button class="ha-btn" id="ha-forgot-btn"><span class="ha-spinner"></span><span>Enviar Link</span></button>\
  <div style="margin-top:12px;text-align:center;"><a href="#" id="ha-back-login" style="font-size:13px;color:' + colors.accent + ';text-decoration:none;">\u2190 Voltar ao Login</a></div>\
</div>\
<div class="ha-tab-content" data-tab="request">\
  <div class="ha-error" id="ha-error-request"></div>\
  <div class="ha-success" id="ha-success-request"></div>\
  <div class="ha-field">\
    <label>Nome Completo</label>\
    <input type="text" id="ha-request-name" placeholder="Seu nome completo">\
  </div>\
  <div class="ha-field">\
    <label>E-mail</label>\
    <input type="email" id="ha-request-email" placeholder="seu@email.com">\
  </div>\
  <button class="ha-btn" id="ha-request-btn"><span class="ha-spinner"></span><span>Solicitar Acesso</span></button>\
</div>';
  }

  function buildCompanyHTML() {
    return '\
<div class="ha-error" id="ha-error"></div>\
<div class="ha-field">\
  <label>E-mail corporativo (opcional)</label>\
  <input type="email" id="ha-email" placeholder="nome@grupocsv.com" autocomplete="email">\
  <div style="font-size:12px;color:#6b7280;margin-top:6px;line-height:1.4;">Colaboradores do Grupo CSV podem usar a credencial individual. Para o acesso compartilhado, deixe este campo em branco.</div>\
</div>\
<div class="ha-field">\
  <label>Senha</label>\
  <div class="ha-pw-wrap">\
    <input type="password" id="ha-password" placeholder="Digite a senha de acesso" autocomplete="current-password">\
    <button class="ha-pw-toggle" id="ha-pw-toggle" type="button">\
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + ICON_EYE_OPEN + '</svg>\
    </button>\
  </div>\
</div>\
<button class="ha-btn" id="ha-login-btn"><span class="ha-spinner"></span><span>Entrar</span></button>';
  }

  // ===== Show Auth Overlay =====
  function showAuthOverlay() {
    var existing = document.getElementById('hub-auth-overlay');
    if (existing) existing.remove();

    document.body.style.overflow = 'hidden';

    var overlay = document.createElement('div');
    overlay.id = 'hub-auth-overlay';

    var bodyHTML = IS_PARTNER ? buildPartnerHTML() : buildCompanyHTML();

    overlay.innerHTML = '\
<style>' + buildCSS() + '</style>\
<div class="ha-modal">\
  <img src="/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png" alt="Grupo CSV" class="ha-logo">\
  ' + ICON_LOCK + '\
  <h2 class="ha-title">' + (PORTAL_NAMES[PORTAL] || PORTAL) + '</h2>\
  <p class="ha-subtitle">' + (IS_PARTNER ? 'Acesso restrito a usuários autorizados' : 'Acesso restrito') + '</p>\
  ' + bodyHTML + '\
  <div class="ha-footer">Hub Grupo CSV</div>\
</div>';

    document.body.appendChild(overlay);
    bindEvents(overlay);
  }

  // ===== Bind Events =====
  function bindEvents(overlay) {
    // Tabs (parceiros)
    if (IS_PARTNER) {
      var tabs = overlay.querySelectorAll('.ha-tab');
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          var tabName = this.getAttribute('data-tab');
          tabs.forEach(function(t) { t.classList.remove('active'); });
          overlay.querySelectorAll('.ha-tab-content').forEach(function(c) { c.classList.remove('active'); });
          this.classList.add('active');
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
        } else {
          pwInput.type = 'password';
          svg.innerHTML = ICON_EYE_OPEN;
        }
      });
    }

    // Login
    var loginBtn = overlay.querySelector('#ha-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', async function() {
        var errorEl = overlay.querySelector('#ha-error');
        errorEl.style.display = 'none';

        var email = overlay.querySelector('#ha-email');
        var password = overlay.querySelector('#ha-password');

        if (IS_PARTNER && (!email || !email.value)) {
          errorEl.textContent = 'Por favor, preencha o e-mail';
          errorEl.style.display = 'block';
          return;
        }
        if (!password || !password.value) {
          errorEl.textContent = 'Por favor, preencha a senha';
          errorEl.style.display = 'block';
          return;
        }

        loginBtn.disabled = true;
        loginBtn.classList.add('loading');

        var result = await doLogin(email ? email.value : 'shared_' + PORTAL, password.value);
        if (result.success) {
          overlay.remove();
          document.body.style.overflow = 'auto';
          addLogoutButton();
        } else {
          errorEl.textContent = result.error;
          errorEl.style.display = 'block';
          loginBtn.disabled = false;
          loginBtn.classList.remove('loading');
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
          errorEl.style.display = 'none';
          successEl.style.display = 'none';

          var name = overlay.querySelector('#ha-request-name');
          var email = overlay.querySelector('#ha-request-email');

          if (!name.value) { errorEl.textContent = 'Por favor, preencha o nome'; errorEl.style.display = 'block'; return; }
          if (!email.value) { errorEl.textContent = 'Por favor, preencha o e-mail'; errorEl.style.display = 'block'; return; }

          requestBtn.disabled = true;
          requestBtn.classList.add('loading');

          var result = await doRequestAccess(email.value, name.value, PORTAL);
          if (result.success) {
            successEl.innerHTML = 'Solicita\u00e7\u00e3o enviada com sucesso! Voc\u00ea receber\u00e1 um e-mail quando sua solicita\u00e7\u00e3o for aprovada.<br><a href="#" id="ha-back-to-login" style="display:inline-block;margin-top:10px;color:' + colors.accent + ';font-weight:600;text-decoration:none;font-size:14px;">\u2190 Voltar ao Login</a>';
            successEl.style.display = 'block';
            name.value = '';
            email.value = '';
            requestBtn.style.display = 'none';
            overlay.querySelectorAll('#ha-request-name, #ha-request-email').forEach(function(el) { el.closest('.ha-field').style.display = 'none'; });
            var backLink = overlay.querySelector('#ha-back-to-login');
            if (backLink) {
              backLink.addEventListener('click', function(e) {
                e.preventDefault();
                successEl.style.display = 'none';
                requestBtn.style.display = '';
                requestBtn.disabled = false;
                requestBtn.classList.remove('loading');
                overlay.querySelectorAll('#ha-request-name, #ha-request-email').forEach(function(el) { el.closest('.ha-field').style.display = ''; });
                var loginTab = overlay.querySelector('.ha-tab[data-tab="login"]');
                if (loginTab) loginTab.click();
              });
            }
            setTimeout(function() { requestBtn.disabled = false; requestBtn.classList.remove('loading'); }, 2000);
          } else {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
            requestBtn.disabled = false;
            requestBtn.classList.remove('loading');
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
          overlay.querySelectorAll('.ha-tab').forEach(function(t) { t.classList.remove('active'); });
          var forgotTab = overlay.querySelector('.ha-tab-content[data-tab="forgot"]');
          if (forgotTab) forgotTab.classList.add('active');
        });
      }

      var backLogin = overlay.querySelector('#ha-back-login');
      if (backLogin) {
        backLogin.addEventListener('click', function(e) {
          e.preventDefault();
          overlay.querySelectorAll('.ha-tab-content').forEach(function(c) { c.classList.remove('active'); });
          overlay.querySelectorAll('.ha-tab').forEach(function(t) { t.classList.remove('active'); });
          var loginContent = overlay.querySelector('.ha-tab-content[data-tab="login"]');
          var loginTab = overlay.querySelector('.ha-tab[data-tab="login"]');
          if (loginContent) loginContent.classList.add('active');
          if (loginTab) loginTab.classList.add('active');
        });
      }

      var forgotBtn = overlay.querySelector('#ha-forgot-btn');
      if (forgotBtn) {
        forgotBtn.addEventListener('click', async function() {
          var errorEl = overlay.querySelector('#ha-error-forgot');
          var successEl = overlay.querySelector('#ha-success-forgot');
          errorEl.style.display = 'none';
          successEl.style.display = 'none';

          var email = overlay.querySelector('#ha-forgot-email');
          if (!email || !email.value) {
            errorEl.textContent = 'Por favor, preencha o e-mail';
            errorEl.style.display = 'block';
            return;
          }

          forgotBtn.disabled = true;
          forgotBtn.classList.add('loading');

          try {
            var resp = await fetch(AUTH_API + '/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.value }),
            });
            var data = await resp.json();
            if (data.success) {
              successEl.textContent = 'Se o e-mail estiver cadastrado, voc\u00ea receber\u00e1 um link para redefinir sua senha.';
              successEl.style.display = 'block';
              email.value = '';
            } else {
              errorEl.textContent = data.error || 'Erro ao processar';
              errorEl.style.display = 'block';
            }
          } catch (e) {
            errorEl.textContent = 'Erro de conex\u00e3o';
            errorEl.style.display = 'block';
          }
          forgotBtn.disabled = false;
          forgotBtn.classList.remove('loading');
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

    var existing = document.getElementById('hub-auth-logout');
    if (existing) return;

    // Truncar e-mail para exibição
    var emailDisplay = session.email || '';
    var emailShort = emailDisplay.length > 24 ? emailDisplay.substring(0, 22) + '...' : emailDisplay;

    var btn = document.createElement('div');
    btn.id = 'hub-auth-logout';
    btn.innerHTML = '\
<style>\
#hub-auth-logout {\
  position: fixed; top: 0; right: 0; z-index: 99998;\
  display: flex; align-items: center; gap: 8px;\
  padding: 6px 14px; height: 64px;\
  background: transparent;\
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px;\
}\
#hub-auth-logout.ha-in-nav {\
  position: static; height: auto; padding: 0 0 0 8px; margin: 0; flex-shrink: 0;\
  border-left: 1px solid var(--vp-c-divider, rgba(0,0,0,0.08));\
}\
#hub-auth-logout.ha-in-header {\
  position: static; height: auto; padding: 0; margin-left: 12px; flex-shrink: 0;\
}\
#hub-auth-logout.ha-in-slot {\
  position: static; height: auto; padding: 0; margin: 0; flex-shrink: 0;\
}\
#hub-auth-logout.ha-dark .ha-user-badge {\
  color: rgba(255,255,255,0.92); opacity: 0.85;\
}\
#hub-auth-logout.ha-dark .ha-logout-btn {\
  background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.92);\
}\
.ha-user-badge {\
  display: flex; align-items: center; gap: 6px; color: #374151;\
  font-weight: 500; font-size: 12px; opacity: 0.7;\
}\
.ha-user-badge svg { width: 14px; height: 14px; flex-shrink: 0; }\
.ha-logout-btn {\
  display: flex; align-items: center; gap: 4px;\
  padding: 5px 10px; background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);\
  border-radius: 6px; color: #6b7280; cursor: pointer;\
  transition: all 0.2s; text-decoration: none; font-size: 12px; font-weight: 500;\
  white-space: nowrap;\
}\
.ha-logout-btn svg { width: 13px; height: 13px; flex-shrink: 0; }\
.ha-logout-btn:hover { background: #dc2626; color: white; border-color: #dc2626; }\
@media (max-width: 768px) {\
  #hub-auth-logout { padding: 6px 10px; gap: 6px; }\
  .ha-user-badge span { display: none; }\
  .ha-logout-btn span { display: none; }\
}\
/* Mobile: na navbar do VitePress o espaco e critico (logo + titulo + busca + menu).\
   O widget in-nav vira so o botao de sair (icone), sem badge nem borda, p/ nao estourar 360px. */\
@media (max-width: 768px) {\
  #hub-auth-logout.ha-in-nav { padding-left: 4px; border-left: none; gap: 4px; }\
  #hub-auth-logout.ha-in-nav .ha-user-badge { display: none; }\
  #hub-auth-logout.ha-in-nav .ha-logout-btn { padding: 5px 7px; }\
}\
@media print { #hub-auth-logout { display: none !important; } }\
</style>\
<span class="ha-user-badge">\
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>\
  <span title="' + emailDisplay + '">' + emailShort + '</span>\
</span>\
<a class="ha-logout-btn" id="ha-logout-btn" title="Encerrar sessão">\
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>\
  <span>Sair</span>\
</a>';

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
      var logoutEl = document.getElementById('hub-auth-logout');
      if (logoutEl) logoutEl.remove();
    });
  }

  // ===== Set Password Overlay =====
  function showSetPasswordOverlay(token) {
    var existing = document.getElementById('hub-auth-overlay');
    if (existing) existing.remove();

    document.body.style.overflow = 'hidden';

    var overlay = document.createElement('div');
    overlay.id = 'hub-auth-overlay';

    overlay.innerHTML = '<style>' + buildCSS() + '</style>' +
      '<div class="ha-modal">' +
      '<img src="/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png" alt="Grupo CSV" class="ha-logo">' +
      ICON_LOCK +
      '<h2 class="ha-title">Definir Senha</h2>' +
      '<p class="ha-subtitle">Crie sua senha de acesso ao portal</p>' +
      '<div class="ha-error" id="ha-error-setpw"></div>' +
      '<div class="ha-success" id="ha-success-setpw"></div>' +
      '<div class="ha-field"><label>Nova Senha</label><div class="ha-pw-wrap"><input type="password" id="ha-setpw-password" placeholder="M\u00ednimo 6 caracteres" autocomplete="new-password"></div></div>' +
      '<div class="ha-field"><label>Confirmar Senha</label><div class="ha-pw-wrap"><input type="password" id="ha-setpw-confirm" placeholder="Repita a senha" autocomplete="new-password"></div></div>' +
      '<button class="ha-btn" id="ha-setpw-btn"><span class="ha-spinner"></span><span>Definir Senha</span></button>' +
      '<div class="ha-footer">Hub Grupo CSV</div>' +
      '</div>';

    document.body.appendChild(overlay);

    var btn = overlay.querySelector('#ha-setpw-btn');
    btn.addEventListener('click', async function() {
      var errorEl = overlay.querySelector('#ha-error-setpw');
      var successEl = overlay.querySelector('#ha-success-setpw');
      errorEl.style.display = 'none';
      successEl.style.display = 'none';

      var pw = overlay.querySelector('#ha-setpw-password').value;
      var confirmPw = overlay.querySelector('#ha-setpw-confirm').value;

      if (!pw || pw.length < 6) {
        errorEl.textContent = 'Senha deve ter no m\u00ednimo 6 caracteres';
        errorEl.style.display = 'block';
        return;
      }
      if (pw !== confirmPw) {
        errorEl.textContent = 'As senhas n\u00e3o coincidem';
        errorEl.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.classList.add('loading');

      try {
        var resp = await fetch(AUTH_API + '/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token, password: pw }),
        });
        var data = await resp.json();
        if (data.success) {
          successEl.textContent = 'Senha definida com sucesso! Redirecionando...';
          successEl.style.display = 'block';
          btn.style.display = 'none';
          overlay.querySelectorAll('.ha-field').forEach(function(f) { f.style.display = 'none'; });
          var cleanUrl = window.location.href.split('?')[0];
          window.history.replaceState({}, '', cleanUrl);
          setTimeout(function() {
            overlay.remove();
            document.body.style.overflow = 'auto';
            showAuthOverlay();
          }, 2000);
        } else {
          errorEl.textContent = data.error || 'Erro ao definir senha';
          errorEl.style.display = 'block';
          btn.disabled = false;
          btn.classList.remove('loading');
        }
      } catch (e) {
        errorEl.textContent = 'Erro de conex\u00e3o. Tente novamente.';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });

    overlay.querySelector('#ha-setpw-confirm').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') btn.click();
    });
  }

  // ===== Init =====
  async function init() {
    // Verificar se ha token de set-password na URL
    var urlParams = new URLSearchParams(window.location.search);
    var setPasswordToken = urlParams.get('set-password');
    if (setPasswordToken) {
      showSetPasswordOverlay(setPasswordToken);
      return;
    }

    var session = getStoredSession();
    if (session && session.token) {
      verifyToken(session.token).then(function(valid) {
        if (!valid) {
          clearSession();
          showAuthOverlay();
          var logoutEl = document.getElementById('hub-auth-logout');
          if (logoutEl) logoutEl.remove();
        }
      });
      addLogoutButton();
      return;
    }
    showAuthOverlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
