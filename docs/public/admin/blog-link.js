/* Cartão "Link csv.online/blog" na aba Blog grupocsv.com do Admin.
 * Busca o post publicado mais recente e, sob demanda, troca o destino
 * do link rotativo csv.online/blog pela mesma API da Central de Links.
 * Não há busca automática em segundo plano: a troca só acontece no clique.
 */
(function () {
  "use strict";
  const PUBLIC_ORIGIN = "https://csv.online";
  const SLUG = "blog";
  const POLL_INTERVAL_MS = 5000;
  const CONFIRM_AFTER_S = 90;
  const GIVE_UP_AFTER_S = 300;
  const DEFAULT_ERRORS = {
    401: "Sua sessão expirou. Entre novamente.",
    403: "Seu perfil não permite esta ação.",
    409: "Outra pessoa alterou este link agora. Os dados foram recarregados. Nada foi gravado.",
    422: "O destino não passou no teste. Nada foi publicado. Revise na Central de Links.",
    429: "Muitas solicitações. Aguarde um minuto e tente novamente.",
    502: "O serviço consultado está indisponível. Tente novamente.",
    503: "A Central de Links está temporariamente indisponível. Tente novamente.",
  };
  const BADGES = {
    loading: ["Verificando…", "#334155", "#e2e8f0"],
    ok: ["Em dia", "#166534", "#dcfce7"],
    stale: ["Desatualizado", "#92400e", "#fef3c7"],
    error: ["Indisponível", "#991b1b", "#fee2e2"],
  };

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === "style") node.style.cssText = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    }
    for (const child of children)
      if (child !== null && child !== undefined)
        node.append(typeof child === "string" ? document.createTextNode(child) : child);
    return node;
  }

  function formatDate(ms) {
    if (!ms) return "";
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(ms));
    } catch {
      return "";
    }
  }

  window.createBlogLink = function (options) {
    const root = options.root;
    if (!root) return { open() {} };
    let generation = 0;
    let busy = false;
    let current = null;

    async function api(path, request = {}) {
      const token = options.getToken();
      if (!token) {
        options.clearAuth();
        options.showAuth();
        throw new Error("Sua sessão expirou. Entre novamente.");
      }
      let response;
      try {
        response = await (options.fetch || window.fetch)(options.apiBase + path, {
          method: request.method || "GET",
          credentials: "omit",
          cache: "no-store",
          redirect: "error",
          headers: { "Content-Type": "application/json", "X-Auth-Token": token },
          body: request.body === undefined ? undefined : JSON.stringify(request.body),
          signal: AbortSignal.timeout(25000),
        });
      } catch {
        throw new Error("Não foi possível conectar à Central de Links. Tente novamente.");
      }
      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (response.ok) return data;
      if (response.status === 401) {
        options.clearAuth();
        options.showAuth();
      }
      const error = new Error(
        data.message || DEFAULT_ERRORS[response.status] || "Não foi possível concluir a operação.",
      );
      error.code = data.error || data.code || null;
      error.status = response.status;
      error.requestId = data.request_id || response.headers.get("X-Request-Id") || null;
      throw error;
    }

    async function publicVersion() {
      try {
        const response = await fetch(PUBLIC_ORIGIN + "/_csv/v/" + SLUG, {
          credentials: "omit",
          cache: "no-store",
          redirect: "manual",
          signal: AbortSignal.timeout(7000),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.found ? Number(data.version) : null;
      } catch {
        return null;
      }
    }

    const titleId = "blog-link-title";
    const badge = el("span", { "data-role": "badge", style: "display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;" });
    const currentValue = el("dd", { "data-role": "current", style: "margin:2px 0 10px 0;font-size:13px;overflow-wrap:anywhere;" });
    const latestValue = el("dd", { "data-role": "latest", style: "margin:2px 0 0 0;font-size:13px;overflow-wrap:anywhere;" });
    const updateButton = el(
      "button",
      {
        type: "button",
        id: "blog-link-update",
        "aria-describedby": "blog-link-help",
        style: "padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;",
      },
      "Apontar para o último post",
    );
    const refreshButton = el(
      "button",
      {
        type: "button",
        id: "blog-link-refresh",
        style: "padding:8px 16px;background:var(--card);color:var(--primary);border:1px solid var(--primary);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;",
      },
      "Verificar de novo",
    );
    const message = el("p", {
      role: "status",
      "aria-live": "polite",
      "data-role": "message",
      style: "margin:10px 0 0 0;font-size:13px;color:var(--text-primary, #1e293b);min-height:1em;",
    });
    const card = el(
      "section",
      {
        "aria-labelledby": titleId,
        style: "border:1px solid var(--border-color);border-radius:12px;background:var(--card);padding:16px 18px;margin-bottom:16px;",
      },
      el(
        "div",
        { style: "display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px;" },
        el("h4", { id: titleId, style: "margin:0;font-size:15px;" }, "Link csv.online/blog"),
        badge,
      ),
      el(
        "p",
        { id: "blog-link-help", style: "margin:0 0 12px 0;font-size:13px;color:#475569;" },
        "Quem abre csv.online/blog vai direto ao post escolhido. O link não muda sozinho quando um post novo é publicado: use o botão abaixo para apontá-lo ao post mais recente.",
      ),
      el(
        "dl",
        { style: "margin:0 0 12px 0;" },
        el("dt", { style: "font-size:12px;font-weight:600;color:#475569;" }, "Aponta hoje para"),
        currentValue,
        el("dt", { style: "font-size:12px;font-weight:600;color:#475569;" }, "Post publicado mais recente"),
        latestValue,
      ),
      el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;" }, updateButton, refreshButton),
      message,
    );
    root.replaceChildren(card);

    function setBadge(kind) {
      const [text, color, background] = BADGES[kind];
      badge.textContent = text;
      badge.style.color = color;
      badge.style.background = background;
      badge.dataset.state = kind;
    }

    function linkTo(url, text) {
      return el("a", { href: url, target: "_blank", rel: "noopener", style: "color:var(--primary);" }, text);
    }

    function render() {
      const link = current && current.link;
      const latest = current && current.latest;
      const post = current && current.posts.find((p) => p.url === (link && link.url));
      currentValue.replaceChildren(
        link ? (post ? linkTo(link.url, post.title) : linkTo(link.url, link.url)) : document.createTextNode("—"),
        post && post.publishedAt ? document.createTextNode(" · " + formatDate(post.publishedAt)) : "",
      );
      latestValue.replaceChildren(
        latest ? linkTo(latest.url, latest.title) : document.createTextNode("—"),
        latest && latest.publishedAt ? document.createTextNode(" · " + formatDate(latest.publishedAt)) : "",
      );
      const upToDate = Boolean(link && latest && link.url === latest.url);
      setBadge(link && latest ? (upToDate ? "ok" : "stale") : "error");
      updateButton.disabled = busy || !link || !latest || upToDate;
      updateButton.style.opacity = updateButton.disabled ? "0.55" : "1";
      updateButton.style.cursor = updateButton.disabled ? "not-allowed" : "pointer";
      refreshButton.disabled = busy;
    }

    async function load(gen) {
      const [list, posts] = await Promise.all([
        api("/links?kind=rotativo&q=" + encodeURIComponent(SLUG)),
        api("/blog/posts"),
      ]);
      if (gen !== generation) return false;
      const link = (list.links || []).find(
        (item) => item.slug === SLUG && (item.domain || "csv.online") === "csv.online",
      );
      const published = Array.isArray(posts) ? posts.filter((p) => p && p.url) : [];
      const latest = published.reduce(
        (best, p) => (!best || (p.publishedAt || 0) > (best.publishedAt || 0) ? p : best),
        null,
      );
      current = { link: link || null, posts: published, latest };
      if (!link) message.textContent = "O link csv.online/blog não foi encontrado na Central de Links.";
      else if (!latest) message.textContent = "Nenhum post publicado foi encontrado no blog.";
      return true;
    }

    async function open() {
      if (busy) return;
      const gen = ++generation;
      setBadge("loading");
      message.textContent = "";
      updateButton.disabled = true;
      try {
        if (await load(gen)) render();
      } catch (error) {
        if (gen !== generation) return;
        current = null;
        setBadge("error");
        message.textContent =
          error.message + (error.requestId ? " Referência: " + error.requestId : "");
        updateButton.disabled = true;
      }
    }

    async function confirmLive(gen, version, publishedAt, url) {
      const started = Date.parse(publishedAt) || Date.now();
      while (gen === generation) {
        const observed = await publicVersion();
        if (gen !== generation) return;
        const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
        if (seconds >= CONFIRM_AFTER_S && observed !== null && observed >= version) {
          message.textContent =
            "Confirmado no ar: csv.online/blog já leva a " + url + ". A confirmação vale para a região de rede deste navegador.";
          return;
        }
        if (seconds >= GIVE_UP_AFTER_S) {
          message.textContent =
            "Gravado na versão " + version + ", mas a propagação não foi confirmada em 5 minutos. Abra a Central de Links, link blog, e use Regravar rota.";
          return;
        }
        message.textContent =
          "Publicado na Central de Links (versão " + version + "). Em propagação · " + seconds + " s desde a publicação. Por cerca de 90 segundos, alguns acessos ainda podem chegar ao post anterior.";
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }

    async function update() {
      if (busy || !current || !current.link || !current.latest) return;
      const { link, latest } = current;
      if (link.url === latest.url) return;
      const ok = window.confirm(
        'Apontar csv.online/blog para "' + latest.title + '"?\n\nQuem abrir o link passará a ir direto para esse post.',
      );
      if (!ok) return;
      const gen = ++generation;
      busy = true;
      render();
      message.textContent = "Testando o destino e publicando…";
      try {
        const saved = await api("/links/" + encodeURIComponent(link.id) + "/destination", {
          method: "POST",
          body: {
            expected_version: link.version,
            url: latest.url,
            label: latest.title || "",
            source: "blog",
            blog_post_id: latest.id,
          },
        });
        if (gen !== generation) return;
        current.link = { ...link, url: latest.url, version: saved.version };
        busy = false;
        render();
        message.textContent = "Publicado na Central de Links (versão " + saved.version + ").";
        await confirmLive(gen, Number(saved.version), saved.published_at, latest.url);
      } catch (error) {
        busy = false;
        const reference = error.requestId ? " Referência: " + error.requestId : "";
        if (error.status === 409) {
          await open();
          message.textContent = DEFAULT_ERRORS[409] + reference;
          return;
        }
        render();
        message.textContent = error.message + reference;
      }
    }

    updateButton.addEventListener("click", () => {
      update();
    });
    refreshButton.addEventListener("click", () => {
      open();
    });
    return { open };
  };
})();
