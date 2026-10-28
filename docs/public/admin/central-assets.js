/* Central de Assets: catálogo público de assets.grupocsv.com, somente leitura. */
(function () {
  "use strict";
  const BASE = "https://assets.grupocsv.com";
  const MANIFEST = BASE + "/manifest.json";
  const API_DOCS = BASE + "/api/openapi.json";
  const PER_PAGE = 24;
  const IMAGE_FORMATS = new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "svg",
    "ico",
    "gif",
    "avif",
  ]);
  const REQUIRED = [
    "key",
    "brand",
    "category",
    "description",
    "orientation",
    "polarity",
    "format",
    "url",
    "added",
  ];
  const CATEGORY = {
    logo: "Logo",
    icone: "Ícone",
    criativo: "Criativo",
    email: "E-mail",
    institucional: "Institucional",
    assinatura: "Assinatura",
    avatar: "Avatar",
    wallpaper: "Wallpaper",
  };
  const PURPOSE = {
    "identidade-de-marca": "Identidade de Marca",
    "comunicacao-recorrente": "Comunicação Recorrente",
    "conteudo-e-campanha": "Conteúdo e Campanha",
    "produto-digital": "Produto Digital",
    pessoas: "Pessoas",
    utilitario: "Utilitário",
    documentacao: "Documentação",
    "ambiente-visual": "Ambiente Visual",
  };
  const TYPE = {
    "logo-completo": "Logo Completo",
    wordmark: "Wordmark",
    simbolo: "Símbolo",
    favicon: "Favicon",
    selo: "Selo",
    "pacote-ou-documento": "Pacote ou Documento",
    "icone-de-interface": "Ícone de Interface",
    "qr-code": "QR Code",
    "avatar-ou-foto": "Avatar ou Foto",
    "mockup-de-produto": "Mockup de Produto",
    "capa-de-blog": "Capa de Blog",
    "infografico-ou-diagrama": "Infográfico ou Diagrama",
    "imagem-de-compartilhamento": "Imagem de Compartilhamento",
    "banner-de-rede-social": "Banner de Rede Social",
    "assinatura-de-email": "Assinatura de E-mail",
    "mockup-de-conteudo": "Mockup de Conteúdo",
    "elemento-decorativo": "Elemento Decorativo",
    "fundo-ou-wallpaper": "Fundo ou Wallpaper",
    "cabecalho-de-email": "Cabeçalho de E-mail",
    "guia-de-uso": "Guia de Uso",
    "assinatura-manuscrita": "Assinatura Manuscrita",
  };
  const POLARITY = {
    positivo: "Positivo",
    negativo: "Negativo",
    "mono-positivo": "Monocromático Positivo",
    "mono-negativo": "Monocromático Negativo",
    "nao-aplicavel": "Não se Aplica",
  };
  const STATUS = {
    ativo: "Ativa",
    arquivado: "Arquivada",
    incorporado: "Incorporada",
  };
  const ISSUE = {
    incompleto: "Metadados incompletos",
    "sem-cadastro": "Marca sem cadastro",
    transparencia: "Transparência divergente",
    revisao: "Em revisão",
  };
  const INFO = {
    copia: "Cópia exata",
    reclassificado: "Reclassificado",
  };
  const SYSTEM_KIND = { favicon: "Favicon", og: "Imagem de compartilhamento" };
  const SYSTEM_USE = { "open-pages": "Open Pages" };

  const normalize = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const titleCase = (slug) =>
    String(slug || "")
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  const label = (map, value) => map[value] || titleCase(value) || "—";
  const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");
  const pct = (a, b) =>
    b
      ? (100 * a / b).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }) + "%"
      : "0%";
  const stem = (key) => String(key).replace(/\.[^./]+$/, "");
  const fileName = (key) => String(key).split("/").pop();
  const formatOf = (asset) =>
    String(asset.format || fileName(asset.key).split(".").pop() || "")
      .toLowerCase()
      .trim();

  function dateTime(value) {
    const d = new Date(value);
    if (!value || Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  }
  function dateOnly(value) {
    if (!value) return "—";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value);
  }

  function assetURL(asset) {
    const url = typeof asset.url === "string" ? asset.url : "";
    if (url.startsWith(BASE + "/") && !/[\s"'<>\\]/.test(url)) return url;
    return (
      BASE +
      "/" +
      String(asset.key || "")
        .split("/")
        .map(encodeURIComponent)
        .join("/")
    );
  }
  function keyURL(key) {
    if (typeof key !== "string" || !key) return null;
    return assetURL({ key });
  }

  function issuesOf(asset, registry, hasRegistry) {
    const out = [];
    const missing = REQUIRED.some(
      (field) =>
        asset[field] === undefined ||
        asset[field] === null ||
        asset[field] === "",
    );
    if (missing || typeof asset.transparent !== "boolean")
      out.push("incompleto");
    if (hasRegistry && !registry[asset.brand]) out.push("sem-cadastro");
    const tech = asset.tech || {};
    const fraction =
      typeof tech.transparent_fraction === "number"
        ? tech.transparent_fraction
        : null;
    if (
      (asset.transparent === true &&
        (tech.has_alpha === false || fraction === 0)) ||
      (asset.transparent === false && fraction !== null && fraction >= 0.5)
    )
      out.push("transparencia");
    if (asset.review_status && asset.review_status !== "ok")
      out.push("revisao");
    return out;
  }
  function infoOf(asset) {
    const out = [];
    if (asset.canonical_of) out.push("copia");
    const legacy = asset.legacy || {};
    if (["brand", "category", "transparent"].some((k) => k in legacy))
      out.push("reclassificado");
    return out;
  }

  function prepare(manifest) {
    const m = manifest && typeof manifest === "object" ? manifest : {};
    const registry =
      m.brand_registry && typeof m.brand_registry === "object"
        ? m.brand_registry
        : {};
    const hasRegistry = Object.keys(registry).length > 0;
    const groupRegistry =
      m.brand_group_registry && typeof m.brand_group_registry === "object"
        ? m.brand_group_registry
        : {};
    const raw = Array.isArray(m.assets) ? m.assets : [];
    const assets = raw
      .filter((a) => a && typeof a === "object" && typeof a.key === "string")
      .map((a) => {
        const brand = registry[a.brand] || {};
        const format = formatOf(a);
        const legacy = a.legacy || {};
        const tech = a.tech || {};
        const prepared = {
          ...a,
          format,
          src: assetURL(a),
          title: a.display_name || fileName(a.key),
          brandName: brand.display_name || a.brand || "—",
          group: brand.group || "",
          issues: issuesOf(a, registry, hasRegistry),
          info: infoOf(a),
          stem: stem(a.key),
          image: IMAGE_FORMATS.has(format),
          alpha:
            typeof tech.has_alpha === "boolean"
              ? tech.has_alpha
              : a.transparent === true,
          dark: tech.preview_bg === "escuro",
        };
        prepared.haystack = normalize(
          [
            a.key,
            a.display_name,
            a.description,
            a.brand,
            brand.display_name,
            ...(brand.aliases || []),
            a.category,
            CATEGORY[a.category],
            a.purpose,
            PURPOSE[a.purpose],
            a.asset_type,
            TYPE[a.asset_type],
            format,
            ...(a.tags || []),
            ...(a.use_cases || []),
            legacy.brand,
            legacy.category,
            legacy.description,
          ].join(" "),
        );
        return prepared;
      });
    const byKey = new Map(assets.map((a) => [a.key, a]));
    const copiesOf = new Map();
    for (const a of assets)
      if (a.canonical_of) {
        if (!copiesOf.has(a.canonical_of)) copiesOf.set(a.canonical_of, []);
        copiesOf.get(a.canonical_of).push(a.key);
      }
    const stems = new Map();
    for (const a of assets) {
      if (!stems.has(a.stem)) stems.set(a.stem, []);
      stems.get(a.stem).push(a.key);
    }

    const brandMap = new Map();
    const ensureBrand = (slug) => {
      if (!brandMap.has(slug)) {
        const r = registry[slug] || {};
        brandMap.set(slug, {
          slug,
          name: r.display_name || slug,
          group: r.group || "",
          parent: r.parent_brand || null,
          status: r.status || "ativo",
          featured: Boolean(r.featured),
          order: Number.isFinite(r.order) ? r.order : 999,
          logo: keyURL(r.logo),
          logoDark: keyURL(r.logo_dark),
          aliases: r.aliases || [],
          note: r.note || "",
          total: 0,
          stems: new Set(),
          pending: 0,
          cats: {},
        });
      }
      return brandMap.get(slug);
    };
    Object.keys(registry).forEach(ensureBrand);
    for (const a of assets) {
      const b = ensureBrand(a.brand || "");
      b.total++;
      b.stems.add(a.stem);
      if (a.issues.length) b.pending++;
      b.cats[a.category] = (b.cats[a.category] || 0) + 1;
    }
    const brands = [...brandMap.values()].map((b) => ({
      ...b,
      designs: b.stems.size,
      stems: undefined,
    }));
    const groupOrder = Object.entries(groupRegistry)
      .map(([slug, g]) => ({
        slug,
        name: (g && g.display_name) || titleCase(slug),
        order: g && Number.isFinite(g.order) ? g.order : 999,
      }))
      .sort((x, y) => x.order - y.order);
    const known = new Set(groupOrder.map((g) => g.slug));
    if (brands.some((b) => b.total && !known.has(b.group)))
      groupOrder.push({ slug: "", name: "Sem grupo", order: 1000 });
    const groups = groupOrder
      .map((g) => {
        const list = brands
          .filter((b) =>
            g.slug ? b.group === g.slug : !known.has(b.group),
          )
          .filter((b) => b.total > 0 || b.status !== "incorporado")
          .sort((x, y) => y.total - x.total || x.name.localeCompare(y.name, "pt-BR"));
        return {
          ...g,
          brands: list,
          total: list.reduce((s, b) => s + b.total, 0),
        };
      })
      .filter((g) => g.brands.length);

    const count = (fn) => {
      const out = {};
      for (const a of assets) {
        const v = fn(a);
        if (v !== undefined && v !== null && v !== "") out[v] = (out[v] || 0) + 1;
      }
      return out;
    };
    const legacyCount = (field) =>
      assets.filter((a) => a.legacy && field in a.legacy).length;
    const issueCount = {};
    for (const code of Object.keys(ISSUE))
      issueCount[code] = assets.filter((a) => a.issues.includes(code)).length;
    const summary = {
      total: assets.length,
      designs: stems.size,
      brands: brands.filter((b) => b.total > 0).length,
      registered: Object.keys(registry).length,
      featured: brands
        .filter((b) => b.featured)
        .sort((x, y) => x.order - y.order || x.name.localeCompare(y.name, "pt-BR")),
      pending: assets.filter((a) => a.issues.length).length,
      issues: issueCount,
      copies: assets.filter((a) => a.canonical_of).length,
      reclassified: assets.filter((a) => a.info.includes("reclassificado"))
        .length,
      legacy: {
        brand: legacyCount("brand"),
        category: legacyCount("category"),
        transparent: legacyCount("transparent"),
        description: legacyCount("description"),
        any: assets.filter((a) => a.legacy && Object.keys(a.legacy).length)
          .length,
      },
      categories: count((a) => a.category),
      purposes: count((a) => a.purpose),
      types: count((a) => a.asset_type),
      formats: count((a) => a.format),
      polarities: count((a) => a.polarity),
      updated: m.updated || m.updated_at || "",
      version: m.version || "",
      schema: m.schema_version || "",
      systemObjects: Array.isArray(m.system_objects) ? m.system_objects : [],
    };
    return {
      assets,
      byKey,
      copiesOf,
      stems,
      brands,
      brandBySlug: new Map(brands.map((b) => [b.slug, b])),
      groups,
      summary,
    };
  }

  function matchesSituation(asset, sit) {
    if (!sit) return true;
    if (sit === "pendencia") return asset.issues.length > 0;
    if (sit === "ok") return asset.issues.length === 0;
    if (ISSUE[sit]) return asset.issues.includes(sit);
    if (INFO[sit]) return asset.info.includes(sit);
    return true;
  }
  function filterAssets(data, st) {
    const terms = normalize(st.q).split(/\s+/).filter(Boolean);
    const list = data.assets.filter(
      (a) =>
        (!st.brand || a.brand === st.brand) &&
        (!st.category || a.category === st.category) &&
        (!st.purpose || a.purpose === st.purpose) &&
        (!st.type || a.asset_type === st.type) &&
        (!st.format || a.format === st.format) &&
        (!st.polarity || a.polarity === st.polarity) &&
        matchesSituation(a, st.sit) &&
        terms.every((t) => a.haystack.includes(t)),
    );
    if (st.order === "recentes")
      list.sort(
        (x, y) =>
          String(y.added || "").localeCompare(String(x.added || "")) ||
          x.key.localeCompare(y.key),
      );
    else
      list.sort(
        (x, y) =>
          x.brandName.localeCompare(y.brandName, "pt-BR") ||
          x.title.localeCompare(y.title, "pt-BR") ||
          x.key.localeCompare(y.key),
      );
    return list;
  }
  function paginate(list, page, per = PER_PAGE) {
    const pages = Math.max(1, Math.ceil(list.length / per));
    const current = Math.min(Math.max(1, Number(page) || 1), pages);
    const start = (current - 1) * per;
    return { page: current, pages, start, items: list.slice(start, start + per) };
  }
  function pageList(page, pages) {
    const out = [];
    for (let p = 1; p <= pages; p++)
      if (p === 1 || p === pages || Math.abs(p - page) <= 1) out.push(p);
      else if (out[out.length - 1] !== "…") out.push("…");
    return out;
  }
  function dimensions(asset) {
    const t = asset.tech || {};
    const w = t.width || asset.width;
    const h = t.height || asset.height;
    return w && h ? `${fmt(w)} × ${fmt(h)} px` : "";
  }
  function reference(asset) {
    const parts = [
      `${String(asset.format || "").toUpperCase()}`,
      dimensions(asset),
      asset.alpha ? "fundo transparente" : "com fundo",
      `polaridade ${asset.polarity || "—"}`,
    ].filter(Boolean);
    return [
      `Asset: ${asset.title} (${asset.brandName})`,
      `URL: ${asset.src}`,
      `Key: ${asset.key}`,
      `Marca: ${asset.brandName} (brand=${asset.brand}) · Categoria: ${asset.category} · Tipo: ${label(TYPE, asset.asset_type)}`,
      `Formato: ${parts.join(" · ")}`,
    ].join("\n");
  }
  function previewClass(asset, mode) {
    if (mode === "claro") return "";
    if (mode === "escuro") return "ca-dark";
    if (mode === "xadrez") return "ca-check";
    if (asset.dark) return "ca-dark";
    return asset.alpha ? "ca-check" : "";
  }
  function catLine(brand) {
    return Object.entries(brand.cats)
      .sort((x, y) => y[1] - x[1])
      .map(([c, n]) => `${label(CATEGORY, c)} ${fmt(n)}`)
      .join(" · ");
  }

  const core = {
    BASE,
    MANIFEST,
    PER_PAGE,
    CATEGORY,
    PURPOSE,
    TYPE,
    ISSUE,
    INFO,
    normalize,
    esc,
    assetURL,
    issuesOf,
    prepare,
    filterAssets,
    paginate,
    pageList,
    reference,
    previewClass,
    catLine,
    dateTime,
    dateOnly,
  };
  window.CsvAssetsCore = core;

  window.createCentralAssets = function createCentralAssets(options = {}) {
    const root = options.root;
    const toast = options.showToast || (() => {});
    const fetchImpl = options.fetch || ((...args) => window.fetch(...args));
    let data = null;
    let loadedAt = null;
    let generation = 0;
    let ready = false;
    let detailKey = null;
    let detailBg = null;
    let lastFocus = null;
    const st = {
      view: "visao",
      q: "",
      brand: "",
      category: "",
      purpose: "",
      type: "",
      format: "",
      polarity: "",
      sit: "",
      order: "marca",
      page: 1,
      bg: "auto",
    };
    const $ = (sel) => root.querySelector(sel);

    function skeleton() {
      root.innerHTML = `
        <div class="ca-head">
          <div class="ca-head-text">
            <h3 class="ca-title" id="ca-title">Central de Assets</h3>
            <p class="ca-sub" data-ca-sub>Carregando o catálogo de assets.grupocsv.com…</p>
          </div>
          <div class="ca-head-actions">
            <a class="ca-btn" href="${API_DOCS}" target="_blank" rel="noopener noreferrer">Documentação da API</a>
            <button type="button" class="ca-btn ca-btn-primary" data-ca-reload>Recarregar Catálogo</button>
          </div>
        </div>
        <div class="ca-tabs" role="tablist" aria-label="Seções da Central de Assets">
          <button type="button" role="tab" id="ca-tab-visao" aria-controls="ca-view-visao" data-ca-view="visao">Visão Geral</button>
          <button type="button" role="tab" id="ca-tab-catalogo" aria-controls="ca-view-catalogo" data-ca-view="catalogo">Catálogo <span class="ca-count" data-ca-count="catalogo"></span></button>
          <button type="button" role="tab" id="ca-tab-qualidade" aria-controls="ca-view-qualidade" data-ca-view="qualidade">Qualidade <span class="ca-count" data-ca-count="qualidade"></span></button>
        </div>
        <div class="ca-status" data-ca-status role="status" aria-live="polite"></div>
        <div class="ca-view" role="tabpanel" id="ca-view-visao" aria-labelledby="ca-tab-visao" data-ca-panel="visao"></div>
        <div class="ca-view" role="tabpanel" id="ca-view-catalogo" aria-labelledby="ca-tab-catalogo" data-ca-panel="catalogo" hidden>
          <div class="ca-filters" data-ca-filters>
            <label class="ca-search"><span class="ca-sr">Buscar assets</span>
              <input type="search" data-ca-filter="q" placeholder="Buscar por nome, marca ou tag" autocomplete="off">
            </label>
            <button type="button" class="ca-btn ca-filters-toggle" data-ca-filters-toggle aria-expanded="false">Filtros</button>
            <div class="ca-filter-extra">
              <label><span class="ca-sr">Marca</span><select data-ca-filter="brand"></select></label>
              <label><span class="ca-sr">Categoria</span><select data-ca-filter="category"></select></label>
              <label><span class="ca-sr">Finalidade</span><select data-ca-filter="purpose"></select></label>
              <label><span class="ca-sr">Tipo</span><select data-ca-filter="type"></select></label>
              <label><span class="ca-sr">Formato</span><select data-ca-filter="format"></select></label>
              <label><span class="ca-sr">Polaridade</span><select data-ca-filter="polarity"></select></label>
              <label><span class="ca-sr">Situação</span><select data-ca-filter="sit"></select></label>
              <div class="ca-seg" role="group" aria-label="Fundo da pré-visualização">
                <button type="button" data-ca-bg="auto" aria-pressed="true">Fundo Automático</button>
                <button type="button" data-ca-bg="claro" aria-pressed="false">Claro</button>
                <button type="button" data-ca-bg="escuro" aria-pressed="false">Escuro</button>
              </div>
            </div>
          </div>
          <div class="ca-resbar">
            <span data-ca-result></span>
            <span class="ca-spacer"></span>
            <button type="button" class="ca-link" data-ca-clear hidden>Limpar filtros</button>
            <label class="ca-order"><span>Ordenar</span>
              <select data-ca-filter="order">
                <option value="marca">Marca e nome</option>
                <option value="recentes">Mais recentes</option>
              </select>
            </label>
          </div>
          <div class="ca-grid" data-ca-grid></div>
          <nav class="ca-pager" data-ca-pager aria-label="Páginas do catálogo"></nav>
        </div>
        <div class="ca-view" role="tabpanel" id="ca-view-qualidade" aria-labelledby="ca-tab-qualidade" data-ca-panel="qualidade" hidden></div>
        <div class="ca-backdrop" data-ca-backdrop hidden></div>
        <aside class="ca-drawer" data-ca-drawer role="dialog" aria-modal="true" aria-labelledby="ca-drawer-title" hidden>
          <div class="ca-drawer-head">
            <h4 id="ca-drawer-title" data-ca-drawer-title></h4>
            <button type="button" class="ca-btn" data-ca-close>Fechar</button>
          </div>
          <div class="ca-drawer-body" data-ca-drawer-body></div>
        </aside>`;
      root.addEventListener("click", onClick);
      root.addEventListener("input", onInput);
      root.addEventListener("change", onInput);
      root.addEventListener(
        "error",
        (event) => {
          const img = event.target;
          if (!(img instanceof HTMLImageElement) || img.dataset.caFailed) return;
          img.dataset.caFailed = "1";
          const ph = document.createElement("span");
          ph.className = "ca-ph";
          ph.textContent = "Pré-visualização indisponível";
          img.replaceWith(ph);
        },
        true,
      );
      ready = true;
      showView(st.view);
    }

    function setStatus(text, kind) {
      const el = $("[data-ca-status]");
      if (!el) return;
      el.textContent = text || "";
      el.className = "ca-status" + (kind ? " ca-status-" + kind : "");
      el.hidden = !text;
    }

    async function load(force) {
      const gen = ++generation;
      setStatus(force ? "Recarregando o catálogo…" : "Carregando o catálogo…");
      try {
        const response = await fetchImpl(MANIFEST + "?v=" + Date.now(), {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("HTTP " + response.status);
        const manifest = await response.json();
        if (gen !== generation) return;
        data = prepare(manifest);
        loadedAt = new Date();
        setStatus("");
        render();
        if (force) toast("Catálogo recarregado.", "success");
      } catch (error) {
        if (gen !== generation) return;
        setStatus(
          "Não foi possível carregar o catálogo (manifest.json). Use Recarregar Catálogo para tentar de novo.",
          "error",
        );
        if (force) toast("Não foi possível recarregar o catálogo.", "error");
      }
    }

    function render() {
      if (!data) return;
      const s = data.summary;
      $("[data-ca-sub]").textContent =
        `assets.grupocsv.com · catálogo atualizado em ${dateTime(s.updated)} · ` +
        `${fmt(s.total)} assets em ${fmt(s.brands)} marcas · lido às ` +
        new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          timeStyle: "short",
        }).format(loadedAt);
      $('[data-ca-count="catalogo"]').textContent = fmt(s.total);
      const q = $('[data-ca-count="qualidade"]');
      q.textContent = s.pending ? fmt(s.pending) : "em dia";
      q.classList.toggle("ca-count-warn", s.pending > 0);
      q.classList.toggle("ca-count-ok", s.pending === 0);
      renderOverview();
      fillFilters();
      renderCatalog();
      renderQuality();
    }

    function kpi(labelText, value, detail, tone) {
      return `<div class="ca-kpi"><div class="ca-kpi-label">${esc(labelText)}</div><div class="ca-kpi-value ${tone || ""}">${value}</div><div class="ca-kpi-detail">${detail}</div></div>`;
    }

    function renderOverview() {
      const s = data.summary;
      const featured = s.featured;
      const featuredTotal = featured.reduce((sum, b) => sum + b.total, 0);
      const purposes = Object.entries(s.purposes).sort((x, y) => y[1] - x[1]);
      const maxPurpose = Math.max(1, ...purposes.map((p) => p[1]));
      const groupName = new Map(data.groups.map((g) => [g.slug, g.name]));
      $('[data-ca-panel="visao"]').innerHTML = `
        <div class="ca-kpis">
          ${kpi("Assets Catalogados", fmt(s.total), `${fmt(s.designs)} desenhos únicos, em até 4 formatos cada`, "ca-good")}
          ${kpi("Marcas", fmt(s.brands), `${fmt(data.groups.length)} grupos · as ${fmt(featured.length)} principais somam ${pct(featuredTotal, s.total)}`)}
          ${kpi("Pendências de Metadados", fmt(s.pending), s.pending ? `${pct(s.pending, s.total)} do catálogo` : "Nenhuma nas verificações automáticas", s.pending ? "ca-warn" : "ca-good")}
          ${kpi("Reclassificados", fmt(s.reclassified), `${fmt(s.legacy.brand)} de marca · ${fmt(s.legacy.category)} de categoria · ${fmt(s.legacy.transparent)} de transparência`)}
          ${kpi("Cópias Exatas", fmt(s.copies), "Mesma imagem em duas URLs; as duas continuam válidas")}
        </div>
        <section class="ca-section" aria-labelledby="ca-featured-title">
          <h4 class="ca-h" id="ca-featured-title">Marcas Principais</h4>
          <p class="ca-hs">${fmt(featured.length)} marcas. Clique para abrir o catálogo filtrado.</p>
          <div class="ca-brands">
            ${featured
              .map(
                (b) => `
              <button type="button" class="ca-brand" data-ca-brand="${esc(b.slug)}">
                <span class="ca-brand-logo">${b.logo ? `<img src="${esc(b.logo)}" alt="${esc(b.name)}" loading="lazy">` : `<span class="ca-ph">${esc(b.name)}</span>`}</span>
                <span class="ca-brand-body">
                  <span class="ca-brand-name">${esc(b.name)}</span>
                  <span class="ca-brand-group">${esc(groupName.get(b.group) || "")}</span>
                  <span class="ca-brand-num"><b>${fmt(b.total)}</b><span>assets · ${fmt(b.designs)} desenhos</span>${b.pending ? `<span class="ca-pill ca-pill-warn">${fmt(b.pending)} a revisar</span>` : `<span class="ca-pill ca-pill-ok">em dia</span>`}</span>
                  <span class="ca-brand-cats">${esc(catLine(b))}</span>
                </span>
              </button>`,
              )
              .join("")}
          </div>
        </section>
        <div class="ca-two">
          <section class="ca-panel" aria-labelledby="ca-groups-title">
            <h4 class="ca-h" id="ca-groups-title">Todas as Marcas por Grupo</h4>
            <p class="ca-hs">Nome oficial de exibição. O identificador técnico (slug) continua o mesmo nas URLs e na API.</p>
            ${data.groups
              .map(
                (g) => `
              <div class="ca-group">
                <div class="ca-group-head"><b>${esc(g.name)}</b><span>${fmt(g.brands.length)} marcas</span><span class="ca-spacer"></span><span><b>${fmt(g.total)}</b> assets</span></div>
                <div class="ca-chips">${g.brands
                  .map(
                    (b) =>
                      `<button type="button" class="ca-chip${b.status === "arquivado" ? " ca-chip-archived" : ""}" data-ca-brand="${esc(b.slug)}" title="${esc(b.slug)}">${esc(b.name)}<em>${fmt(b.total)}</em></button>`,
                  )
                  .join("")}</div>
              </div>`,
              )
              .join("")}
          </section>
          <section class="ca-panel" aria-labelledby="ca-purpose-title">
            <h4 class="ca-h" id="ca-purpose-title">Finalidade dos Assets</h4>
            <p class="ca-hs">Classificação complementar à categoria. Separa, por exemplo, mockups de campanha das peças de e-mail.</p>
            <div class="ca-bars">
              ${purposes
                .map(
                  ([p, n]) => `
                <button type="button" class="ca-bar" data-ca-purpose="${esc(p)}">
                  <span>${esc(label(PURPOSE, p))}</span>
                  <span class="ca-bar-track"><span class="ca-bar-fill${p === "identidade-de-marca" ? " ca-bar-main" : ""}" style="width:${((100 * n) / maxPurpose).toFixed(1)}%"></span></span>
                  <b>${fmt(n)}</b>
                </button>`,
                )
                .join("")}
            </div>
            <p class="ca-note">A categoria (logo, ícone, e-mail etc.) continua igual na API, para não quebrar buscas já usadas.</p>
          </section>
        </div>`;
    }

    function fillSelect(select, first, entries) {
      const el = $(`[data-ca-filter="${select}"]`);
      el.innerHTML =
        `<option value="">${esc(first)}</option>` +
        entries
          .map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`)
          .join("");
      el.value = st[select];
      if (el.value !== st[select]) st[select] = "";
    }

    function fillFilters() {
      const s = data.summary;
      const brandSelect = $('[data-ca-filter="brand"]');
      brandSelect.innerHTML =
        '<option value="">Todas as marcas</option>' +
        data.groups
          .map(
            (g) =>
              `<optgroup label="${esc(g.name)}">${[...g.brands]
                .filter((b) => b.total)
                .sort((x, y) => x.name.localeCompare(y.name, "pt-BR"))
                .map((b) => `<option value="${esc(b.slug)}">${esc(b.name)} (${fmt(b.total)})</option>`)
                .join("")}</optgroup>`,
          )
          .join("");
      brandSelect.value = st.brand;
      if (brandSelect.value !== st.brand) st.brand = "";
      const sorted = (obj, map) =>
        Object.entries(obj)
          .sort((x, y) => y[1] - x[1])
          .map(([v, n]) => [v, `${label(map, v)} (${fmt(n)})`]);
      fillSelect("category", "Todas as categorias", sorted(s.categories, CATEGORY));
      fillSelect("purpose", "Todas as finalidades", sorted(s.purposes, PURPOSE));
      fillSelect("type", "Todos os tipos", sorted(s.types, TYPE));
      fillSelect(
        "format",
        "Todos os formatos",
        Object.entries(s.formats)
          .sort((x, y) => y[1] - x[1])
          .map(([v, n]) => [v, `${v.toUpperCase()} (${fmt(n)})`]),
      );
      fillSelect("polarity", "Todas as polaridades", sorted(s.polarities, POLARITY));
      const sits = [
        ["pendencia", `Com pendência (${fmt(s.pending)})`],
        ["ok", `Sem pendência (${fmt(s.total - s.pending)})`],
        ...Object.entries(ISSUE)
          .filter(([code]) => s.issues[code])
          .map(([code, text]) => [code, `${text} (${fmt(s.issues[code])})`]),
        ["copia", `Cópia exata (${fmt(s.copies)})`],
        ["reclassificado", `Reclassificado (${fmt(s.reclassified)})`],
      ];
      fillSelect("sit", "Qualquer situação", sits);
      $('[data-ca-filter="q"]').value = st.q;
      $('[data-ca-filter="order"]').value = st.order;
    }

    function card(a) {
      const preview = a.image
        ? `<img src="${esc(a.src)}" alt="" loading="lazy" decoding="async">`
        : `<span class="ca-ph">${esc(a.format.toUpperCase())}<br>sem pré-visualização</span>`;
      const badges = [
        `<span class="ca-pill">${esc(a.format.toUpperCase())}</span>`,
        `<span class="ca-pill">${esc(label(CATEGORY, a.category))}</span>`,
        ...a.issues.map((code) => `<span class="ca-pill ca-pill-warn">${esc(ISSUE[code])}</span>`),
        ...(a.info.includes("copia") ? [`<span class="ca-pill ca-pill-info">${INFO.copia}</span>`] : []),
      ];
      return `<article class="ca-card">
        <div class="ca-preview ${previewClass(a, st.bg)}">${preview}</div>
        <div class="ca-card-body">
          <h5 class="ca-card-title">${esc(a.title)}</h5>
          <div class="ca-card-meta">${esc(a.brandName)} · ${esc(label(TYPE, a.asset_type))}</div>
          <div class="ca-card-badges">${badges.join("")}</div>
          <div class="ca-card-actions">
            <button type="button" data-ca-copy="url" data-ca-key="${esc(a.key)}">Copiar URL</button>
            <button type="button" class="ca-secondary" data-ca-detail="${esc(a.key)}" aria-label="Detalhes de ${esc(a.title)}">Detalhes</button>
          </div>
        </div>
      </article>`;
    }

    function activeFilters() {
      return ["q", "brand", "category", "purpose", "type", "format", "polarity", "sit"].some(
        (k) => st[k],
      );
    }

    function renderCatalog() {
      if (!data) return;
      const list = filterAssets(data, st);
      const page = paginate(list, st.page);
      st.page = page.page;
      $("[data-ca-result]").textContent = list.length
        ? `${fmt(page.start + 1)}–${fmt(page.start + page.items.length)} de ${fmt(list.length)} assets`
        : "Nenhum asset encontrado com esses filtros";
      $("[data-ca-clear]").hidden = !activeFilters();
      $("[data-ca-grid]").innerHTML = page.items.map(card).join("");
      $("[data-ca-pager]").innerHTML =
        page.pages > 1
          ? pageList(page.page, page.pages)
              .map((p) =>
                p === "…"
                  ? '<span class="ca-gap" aria-hidden="true">…</span>'
                  : `<button type="button" data-ca-page="${p}"${p === page.page ? ' aria-current="page" class="ca-on"' : ""} aria-label="Página ${p}">${p}</button>`,
              )
              .join("")
          : "";
      root
        .querySelectorAll("[data-ca-bg]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.caBg === st.bg)));
    }

    function qualityCard(value, title, detail, sit, tone) {
      return `<div class="ca-q">
        <div class="ca-q-value ${tone || ""}">${fmt(value)}</div>
        <div class="ca-q-title">${esc(title)}</div>
        <div class="ca-q-detail">${detail}</div>
        ${value ? `<button type="button" class="ca-btn" data-ca-sit="${esc(sit)}">Ver no catálogo</button>` : ""}
      </div>`;
    }

    function renderQuality() {
      const s = data.summary;
      const tone = (n) => (n ? "ca-warn" : "ca-good");
      const rows = data.groups
        .map(
          (g) =>
            `<tr class="ca-group-row"><td colspan="6">${esc(g.name)} · ${fmt(g.brands.length)} marcas · ${fmt(g.total)} assets</td></tr>` +
            g.brands
              .map(
                (b) => `<tr>
              <td><button type="button" class="ca-link" data-ca-brand="${esc(b.slug)}">${esc(b.name)}</button>${b.status !== "ativo" ? ` <span class="ca-pill">${esc(STATUS[b.status] || b.status)}</span>` : ""}</td>
              <td class="ca-hide-sm ca-muted">${esc(b.slug)}</td>
              <td>${esc(catLine(b)) || "—"}</td>
              <td class="ca-num"><b>${fmt(b.total)}</b></td>
              <td class="ca-num ca-hide-sm">${fmt(b.designs)}</td>
              <td class="ca-num">${b.pending ? `<span class="ca-pill ca-pill-warn">${fmt(b.pending)}</span>` : "—"}</td>
            </tr>`,
              )
              .join(""),
        )
        .join("");
      const sys = s.systemObjects;
      $('[data-ca-panel="qualidade"]').innerHTML = `
        <div class="ca-qgrid">
          ${qualityCard(s.issues.incompleto, ISSUE.incompleto, "Falta algum campo obrigatório: URL, orientação, polaridade, descrição, formato, transparência ou data.", "incompleto", tone(s.issues.incompleto))}
          ${qualityCard(s.issues["sem-cadastro"], ISSUE["sem-cadastro"], "Asset com marca que não consta no cadastro de marcas do catálogo.", "sem-cadastro", tone(s.issues["sem-cadastro"]))}
          ${qualityCard(s.issues.transparencia, ISSUE.transparencia, "O campo de transparência contradiz o arquivo: declarado transparente e totalmente opaco, ou o contrário.", "transparencia", tone(s.issues.transparencia))}
          ${qualityCard(s.issues.revisao, ISSUE.revisao, "Asset marcado para revisão no catálogo.", "revisao", tone(s.issues.revisao))}
          ${qualityCard(s.copies, INFO.copia, "Mesmo arquivo publicado em duas URLs. As duas continuam válidas; o detalhe indica a cópia canônica.", "copia", "")}
          ${qualityCard(s.reclassified, "Reclassificados", `Marca, categoria ou transparência corrigidas, com o valor anterior preservado: buscas antigas seguem encontrando o asset. Descrições revisadas: ${fmt(s.legacy.description)}.`, "reclassificado", "")}
        </div>
        <section class="ca-panel ca-section" aria-labelledby="ca-table-title">
          <h4 class="ca-h" id="ca-table-title">Marcas, Assets e Pendências</h4>
          <p class="ca-hs">Só aparecem as categorias existentes em cada marca.</p>
          <div class="ca-table-wrap" tabindex="0" role="region" aria-label="Tabela de marcas, assets e pendências">
            <table class="ca-table">
              <thead><tr><th scope="col">Marca</th><th scope="col" class="ca-hide-sm">Identificador</th><th scope="col">Categorias</th><th scope="col" class="ca-num">Assets</th><th scope="col" class="ca-num ca-hide-sm">Desenhos</th><th scope="col" class="ca-num">Pendências</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
        ${
          sys.length
            ? `<section class="ca-panel ca-section" aria-labelledby="ca-system-title">
          <h4 class="ca-h" id="ca-system-title">Arquivos de Sistema</h4>
          <p class="ca-hs">Arquivos em pastas de asset usados por outros sistemas. Ficam registrados no manifesto, fora da busca da API.</p>
          <div class="ca-table-wrap" tabindex="0" role="region" aria-label="Tabela de arquivos de sistema">
            <table class="ca-table">
              <thead><tr><th scope="col">Arquivo</th><th scope="col">Tipo</th><th scope="col">Usado por</th><th scope="col" class="ca-num ca-hide-sm">Tamanho</th></tr></thead>
              <tbody>${sys
                .map(
                  (o) => `<tr><td class="ca-break">${esc(o.key)}</td><td>${esc(SYSTEM_KIND[o.kind] || titleCase(o.kind))}</td><td>${esc(SYSTEM_USE[o.used_by] || titleCase(o.used_by))}</td><td class="ca-num ca-hide-sm">${o.size_bytes ? fmt(Math.round(o.size_bytes / 1024)) + " KB" : "—"}</td></tr>`,
                )
                .join("")}</tbody>
            </table>
          </div>
        </section>`
            : ""
        }`;
    }

    function showView(view) {
      st.view = view;
      root.querySelectorAll("[data-ca-view]").forEach((b) => {
        const on = b.dataset.caView === view;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
      });
      root.querySelectorAll("[data-ca-panel]").forEach((p) => {
        p.hidden = p.dataset.caPanel !== view;
      });
    }

    function goCatalog(changes) {
      Object.assign(st, { q: "", brand: "", category: "", purpose: "", type: "", format: "", polarity: "", sit: "" }, changes, { page: 1 });
      if (data) fillFilters();
      showView("catalogo");
      renderCatalog();
      root.scrollIntoView({ block: "start" });
    }

    function openDetail(key, bg) {
      const a = data && data.byKey.get(key);
      if (!a) return;
      if (!detailKey) lastFocus = document.activeElement;
      detailKey = key;
      detailBg = bg || detailBg || null;
      const mode = detailBg || (a.dark ? "escuro" : a.alpha ? "xadrez" : "claro");
      const brand = data.brandBySlug.get(a.brand) || { name: a.brand, group: "" };
      const groupName = (data.groups.find((g) => g.slug === brand.group) || {}).name || "—";
      const siblings = (data.stems.get(a.stem) || []).filter((k) => k !== key);
      const copies = data.copiesOf.get(key) || [];
      const legacy = a.legacy || {};
      const legacyRows = [
        ["brand", "Marca anterior"],
        ["category", "Categoria anterior"],
        ["transparent", "Transparência anterior"],
      ]
        .filter(([k]) => k in legacy)
        .map(([k, t]) => `<dt>${t}</dt><dd>${esc(k === "transparent" ? (legacy[k] ? "transparente" : "com fundo") : legacy[k])}</dd>`)
        .join("");
      const keyButton = (k) => `<button type="button" class="ca-chip" data-ca-detail="${esc(k)}">${esc(k)}</button>`;
      $("[data-ca-drawer-title]").textContent = a.title;
      $("[data-ca-drawer-body]").innerHTML = `
        <div class="ca-seg" role="group" aria-label="Fundo da pré-visualização">
          ${["claro", "escuro", "xadrez"].map((m) => `<button type="button" data-ca-detail-bg="${m}" aria-pressed="${m === mode}">${m === "xadrez" ? "Xadrez" : m === "claro" ? "Claro" : "Escuro"}</button>`).join("")}
        </div>
        <div class="ca-big ca-preview ${previewClass(a, mode)}">${a.image ? `<img src="${esc(a.src)}" alt="${esc(a.title)}">` : `<span class="ca-ph">${esc(a.format.toUpperCase())}<br>sem pré-visualização</span>`}</div>
        <dl class="ca-kv">
          <dt>Marca</dt><dd>${esc(brand.name)} <span class="ca-pill">${esc(a.brand)}</span></dd>
          <dt>Grupo</dt><dd>${esc(groupName)}</dd>
          <dt>Categoria (API)</dt><dd>${esc(label(CATEGORY, a.category))} <span class="ca-pill">${esc(a.category)}</span></dd>
          <dt>Finalidade</dt><dd>${esc(label(PURPOSE, a.purpose))}</dd>
          <dt>Tipo</dt><dd>${esc(label(TYPE, a.asset_type))}</dd>
          <dt>Formato</dt><dd>${esc(a.format.toUpperCase())}${dimensions(a) ? " · " + esc(dimensions(a)) : ""}</dd>
          <dt>Polaridade</dt><dd>${esc(label(POLARITY, a.polarity))} · ${a.alpha ? "fundo transparente" : "com fundo"}</dd>
          <dt>Orientação (API)</dt><dd>${esc(a.orientation || "—")}</dd>
          <dt>Incluído em</dt><dd>${esc(dateOnly(a.added))}</dd>
          <dt>Situação</dt><dd>${a.issues.length ? a.issues.map((c) => `<span class="ca-pill ca-pill-warn">${esc(ISSUE[c])}</span>`).join(" ") : '<span class="ca-pill ca-pill-ok">Sem pendência</span>'}</dd>
          ${a.description ? `<dt>Descrição</dt><dd>${esc(a.description)}</dd>` : ""}
          ${legacyRows}
        </dl>
        ${a.canonical_of ? `<div class="ca-block"><div class="ca-block-title">Cópia exata de</div>${keyButton(a.canonical_of)}<p class="ca-note">As duas URLs continuam válidas. Para novos usos, prefira a canônica.</p></div>` : ""}
        ${copies.length ? `<div class="ca-block"><div class="ca-block-title">Também publicado em</div><div class="ca-chips">${copies.map(keyButton).join("")}</div></div>` : ""}
        ${siblings.length ? `<div class="ca-block"><div class="ca-block-title">Outros formatos do mesmo desenho</div><div class="ca-chips">${siblings.map(keyButton).join("")}</div></div>` : ""}
        <div class="ca-code" data-ca-url>${esc(a.src)}</div>
        <div class="ca-drawer-actions">
          <button type="button" class="ca-btn ca-btn-primary" data-ca-copy="url" data-ca-key="${esc(a.key)}">Copiar URL</button>
          <button type="button" class="ca-btn" data-ca-copy="ref" data-ca-key="${esc(a.key)}">Copiar Referência</button>
          <a class="ca-btn" href="${esc(a.src)}" target="_blank" rel="noopener noreferrer">Abrir</a>
        </div>
        <p class="ca-note">A referência copiada traz título, URL, key, marca, categoria, tipo, formato e dimensões, pronta para colar em um pedido.</p>`;
      $("[data-ca-drawer]").hidden = false;
      $("[data-ca-backdrop]").hidden = false;
      document.addEventListener("keydown", onKey);
      $("[data-ca-close]").focus();
    }

    function closeDetail() {
      if (!ready || !detailKey) return;
      detailKey = null;
      detailBg = null;
      $("[data-ca-drawer]").hidden = true;
      $("[data-ca-backdrop]").hidden = true;
      document.removeEventListener("keydown", onKey);
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
      lastFocus = null;
    }

    function onKey(event) {
      if (event.key === "Escape") closeDetail();
    }

    async function copy(text, message) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        let ok = false;
        try {
          ok = document.execCommand("copy");
        } catch {
          ok = false;
        }
        area.remove();
        if (!ok) {
          toast("Não foi possível copiar. Selecione o texto e copie manualmente.", "error");
          return;
        }
      }
      toast(message, "success");
    }

    function onClick(event) {
      const t = event.target.closest(
        "[data-ca-view],[data-ca-brand],[data-ca-purpose],[data-ca-sit],[data-ca-page],[data-ca-detail],[data-ca-detail-bg],[data-ca-copy],[data-ca-bg],[data-ca-reload],[data-ca-close],[data-ca-backdrop],[data-ca-filters-toggle],[data-ca-clear]",
      );
      if (!t || !root.contains(t)) return;
      const d = t.dataset;
      if (d.caView) return showView(d.caView);
      if ("caReload" in d) return load(true);
      if ("caClose" in d || "caBackdrop" in d) return closeDetail();
      if (!data) return;
      if (d.caBrand !== undefined) {
        closeDetail();
        return goCatalog({ brand: d.caBrand });
      }
      if (d.caPurpose) return goCatalog({ purpose: d.caPurpose });
      if (d.caSit) return goCatalog({ sit: d.caSit });
      if (d.caPage) {
        st.page = Number(d.caPage);
        renderCatalog();
        $("[data-ca-filters]").scrollIntoView({ block: "start" });
        return;
      }
      if (d.caDetailBg) return openDetail(detailKey, d.caDetailBg);
      if (d.caDetail) return openDetail(d.caDetail, d.caDetail === detailKey ? detailBg : null);
      if (d.caCopy) {
        const a = data.byKey.get(d.caKey);
        if (!a) return;
        return d.caCopy === "ref"
          ? copy(reference(a), "Referência copiada.")
          : copy(a.src, "URL copiada.");
      }
      if (d.caBg) {
        st.bg = d.caBg;
        return renderCatalog();
      }
      if ("caFiltersToggle" in d) {
        const box = $("[data-ca-filters]");
        const open = !box.classList.contains("ca-open");
        box.classList.toggle("ca-open", open);
        t.setAttribute("aria-expanded", String(open));
        return;
      }
      if ("caClear" in d) return goCatalog({ order: st.order });
    }

    let typing = null;
    function onInput(event) {
      const field = event.target.dataset && event.target.dataset.caFilter;
      if (!field || !data) return;
      if (field === "q" && event.type === "change") return;
      st[field] = event.target.value;
      st.page = 1;
      clearTimeout(typing);
      if (field === "q") typing = setTimeout(renderCatalog, 150);
      else renderCatalog();
    }

    return {
      open() {
        if (!root) return;
        if (!ready) skeleton();
        if (!data) load(false);
      },
      close() {
        closeDetail();
        if (!data) generation++;
      },
      reload: () => load(true),
      state: st,
    };
  };
})();
