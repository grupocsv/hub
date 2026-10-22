/* Central de Links: sessão do Admin, formulários e rotas públicas. */
(function () {
  "use strict";
  const CONFLICT =
    "Outra pessoa alterou este link enquanto você editava. Recarregue para ver a versão atual. Nada foi gravado.";
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "medium",
        }).format(new Date(value))
      : "—";
  const toLocal = (value) =>
    value
      ? new Date(new Date(value).getTime() - 10800000)
          .toISOString()
          .slice(0, 16)
      : "";
  const toUTC = (value) =>
    value ? new Date(value + ":00-03:00").toISOString() : null;
  const publicURL = (slug) => "https://csv.online/" + encodeURIComponent(slug);
  function safeURL(value) {
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password
        ? u.href
        : null;
    } catch {
      return null;
    }
  }
  function pageWarning(value) {
    try {
      const u = new URL(value);
      return (
        u.hostname === "open.grupocsv.com" ||
        u.hostname === "hub.unimedgv.com" ||
        (u.hostname === "hub.grupocsv.com" && u.pathname.startsWith("/p/"))
      );
    } catch {
      return false;
    }
  }
  function propagation(published, version, observed, now = Date.now()) {
    const seconds = Math.max(
      0,
      Math.floor((now - Date.parse(published)) / 1000),
    );
    return {
      seconds,
      status:
        seconds >= 90 && observed >= version
          ? "Confirmado"
          : seconds >= 300
            ? "Propagação não confirmada"
            : "Em propagação",
    };
  }
  function createApi(options) {
    return async function (path, request = {}) {
      const token = options.getToken();
      if (!token) {
        options.clearAuth();
        options.showAuth();
        throw new Error("Sua sessão expirou. Entre novamente.");
      }
      let response;
      try {
        response = await (options.fetch || window.fetch)(
          options.apiBase + path,
          {
            method: request.method || "GET",
            credentials: "omit",
            cache: "no-store",
            redirect: "error",
            headers: {
              "Content-Type": "application/json",
              "X-Auth-Token": token,
            },
            body:
              request.body === undefined
                ? undefined
                : JSON.stringify(request.body),
            signal: AbortSignal.timeout(20000),
          },
        );
      } catch {
        throw new Error(
          "Não foi possível conectar à Central de Links. Tente novamente.",
        );
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
      const defaults = {
        401: "Sua sessão expirou. Entre novamente.",
        403: "Seu perfil não permite esta ação.",
        422: "Confira os campos informados.",
        429: "Muitas solicitações. Aguarde um minuto e tente novamente.",
        502: "O serviço consultado está indisponível. Tente novamente.",
        503: "A Central de Links está temporariamente indisponível. Tente novamente.",
      };
      const message =
        data.error === "version_conflict"
          ? CONFLICT
          : data.error === "must_change_password"
            ? "Troque sua senha no Admin antes de realizar esta ação."
            : data.message ||
              defaults[response.status] ||
              "Não foi possível concluir a solicitação.";
      throw Object.assign(new Error(message), {
        code: data.error,
        status: response.status,
        requestId: data.request_id || response.headers?.get("X-Request-Id"),
        data,
      });
    };
  }
  window.CsvLinksCore = {
    date,
    toLocal,
    toUTC,
    publicURL,
    safeURL,
    pageWarning,
    propagation,
    createApi,
  };
  window.createCentralLinks = function (options) {
    const root = document.getElementById("centralLinks");
    const view = document.getElementById("cl-view");
    const alert = document.getElementById("cl-notice");
    const api = createApi(options);
    let role = "",
      section = "overview",
      current = null,
      generation = 0,
      timer = null,
      reload = null;
    let fieldNumber = 0;
    function el(tag, text = "", className = "") {
      const node = document.createElement(tag);
      node.textContent = text;
      if (className) node.className = className;
      return node;
    }
    function notice(message = "", type = "error") {
      alert.replaceChildren();
      alert.className = "cl-notice " + type;
      alert.hidden = !message;
      if (message) alert.append(el("p", message));
    }
    async function run(fn) {
      try {
        return await fn();
      } catch (e) {
        notice(e.message + (e.requestId ? " Referência: " + e.requestId : ""));
        if (e.code === "version_conflict" && reload)
          alert.append(button("Recarregar", reload));
      }
    }
    function button(text, fn) {
      const b = el("button", text, "cl-button");
      b.type = "button";
      b.addEventListener("click", () =>
        run(async () => {
          b.disabled = true;
          try {
            await fn();
          } finally {
            b.disabled = false;
          }
        }),
      );
      return b;
    }
    function field(parent, label, type = "text", value = "") {
      const wrap = el("div", "", "cl-field"),
        id = "cl-field-" + ++fieldNumber,
        lab = el("label", label);
      const input = el(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") input.type = type;
      input.id = id;
      input.value = value ?? "";
      lab.htmlFor = id;
      wrap.append(lab, input);
      parent.append(wrap);
      return input;
    }
    function select(parent, label, items, value = "") {
      const wrap = el("div", "", "cl-field"),
        lab = el("label", label),
        input = el("select");
      input.id = "cl-field-" + ++fieldNumber;
      lab.htmlFor = input.id;
      for (const [v, t] of items) {
        const o = el("option", t);
        o.value = v;
        input.append(o);
      }
      input.value = value;
      wrap.append(lab, input);
      parent.append(wrap);
      return input;
    }
    function checkbox(parent, label) {
      const wrap = el("label", "", "cl-check"),
        input = el("input");
      input.type = "checkbox";
      wrap.append(input, document.createTextNode(label));
      parent.append(wrap);
      return input;
    }
    function link(text, url) {
      const a = el("a", text);
      const safe = safeURL(url);
      if (safe) {
        a.href = safe;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      return a;
    }
    function download(blob, filename) {
      const url = URL.createObjectURL(blob),
        a = el("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    function start(title) {
      generation++;
      clearTimeout(timer);
      notice();
      view.replaceChildren(el("h3", title));
      current = null;
      return generation;
    }
    function warning(parent, url) {
      if (pageWarning(url))
        parent.append(
          el(
            "p",
            "A revogação desta página é feita em Links Públicos",
            "cl-note",
          ),
        );
    }
    function status(item) {
      if (item.deleted_at) return "Excluído";
      if (item.archived_at) return "Arquivado";
      if (!item.routing_enabled) return "Desativado";
      if (item.expires_at && Date.parse(item.expires_at) <= Date.now())
        return "Expirado";
      if (item.last_check?.status === "falhou") return "Destino com falha";
      if (
        item.published_at &&
        Date.now() - Date.parse(item.published_at) < 90000
      )
        return "Em propagação";
      return "Ativo";
    }
    function checkResult(parent, check) {
      parent.replaceChildren(
        el(
          "p",
          (check.status === "ok" ? "Destino disponível" : "Teste falhou") +
            " · HTTP " +
            (check.http_status ?? "sem resposta"),
        ),
      );
      parent.append(
        el("p", "Endereço final: " + (check.final_url || check.url)),
        el("p", "Redirecionamentos: " + check.redirects),
        el(
          "p",
          check.has_og_image
            ? "Prévia própria: " + (check.og_title || "Sem título")
            : "Sem prévia própria",
        ),
      );
      if (check.error_code)
        parent.append(el("p", "Motivo: " + check.error_code));
    }
    async function showList(kind, filters = {}) {
      section = kind;
      const gen = start(kind === "rotativo" ? "Rotativos" : "Estáticos");
      reload = () => showList(kind, filters);
      const toolbar = el("form", "", "cl-grid");
      const q = field(toolbar, "Buscar", "search", filters.q),
        tag = field(toolbar, "Etiqueta", "text", filters.tag);
      const st = select(
        toolbar,
        "Situação",
        [
          ["", "Todas (exceto arquivados e excluídos)"],
          ["ativo", "Ativos"],
          ["desativado", "Desativados"],
          ["expirado", "Expirados"],
          ["arquivado", "Arquivados"],
          ["excluido", "Excluídos"],
          ["com_falha", "Destino com falha"],
        ],
        filters.status || "",
      );
      const sort = select(
        toolbar,
        "Ordenação",
        [
          ["updated_at", "Última alteração"],
          ["slug", "Nome curto"],
        ],
        filters.sort || "updated_at",
      );
      const apply = () =>
        showList(kind, {
          q: q.value,
          tag: tag.value,
          status: st.value,
          sort: sort.value,
          page: 1,
        });
      toolbar.append(button("Filtrar", apply));
      toolbar.addEventListener("submit", (e) => {
        e.preventDefault();
        run(apply);
      });
      view.append(
        toolbar,
        button(kind === "rotativo" ? "Criar rotativo" : "Criar estático", () =>
          showForm(null, kind),
        ),
      );
      const rows = el("div", "", "cl-list");
      view.append(rows);
      const params = new URLSearchParams({
        ...filters,
        kind,
        page: String(filters.page || 1),
        page_size: "25",
      });
      for (const [key, value] of [...params]) if (!value) params.delete(key);
      const data = await api("/links?" + params);
      const details = await Promise.all(
        data.links.map((item) => api("/links/" + encodeURIComponent(item.id))),
      );
      if (gen !== generation) return;
      rows.append(el("p", data.total + " link(s)"));
      const table = el("table", "", "cl-table cl-link-table"),
        head = el("thead"),
        tr = el("tr");
      [
        "Endereço público",
        "Destino vigente",
        "Tipo",
        "Situação",
        "Última alteração",
        "Ações",
      ].forEach((t) => tr.append(el("th", t)));
      head.append(tr);
      table.append(head);
      const body = el("tbody");
      table.append(body);
      rows.append(table);
      details.forEach((item) => {
        const row = el("tr");
        row.dataset.slug = item.slug;
        const values = [
          link("csv.online/" + item.slug, publicURL(item.slug)),
          el("div"),
          el(
            "span",
            item.kind === "rotativo" ? "Rotativo" : "Estático",
            "cl-kind " + item.kind,
          ),
          el("span", status(item)),
          el("div", date(item.updated_at) + " · " + item.updated_by),
          el("div", "", "cl-actions"),
        ];
        const dest = el("span", item.destination?.url || "—", "cl-destination");
        dest.title = item.destination?.url || "";
        values[1].append(dest, el("p", item.destination?.label || ""));
        values[5].append(
          link("Abrir", publicURL(item.slug)),
          button("Copiar", () =>
            navigator.clipboard
              .writeText(publicURL(item.slug))
              .then(() => notice("Endereço copiado.", "success")),
          ),
          button("QR Code", () => showQR(item)),
          button("Detalhes", () => openDetail(item.id)),
        );
        values.forEach((v, i) => {
          const td = el("td");
          td.dataset.label = tr.children[i].textContent;
          td.append(v);
          row.append(td);
        });
        body.append(row);
      });
      const pages = el("div", "", "cl-actions"),
        page = filters.page || 1;
      const prev = button("Anterior", () =>
        showList(kind, { ...filters, page: page - 1 }),
      );
      prev.disabled = page <= 1;
      const next = button("Próxima", () =>
        showList(kind, { ...filters, page: page + 1 }),
      );
      next.disabled = page * 25 >= data.total;
      pages.append(prev, el("span", "Página " + page), next);
      rows.append(pages);
      if (kind === "rotativo") {
        const suggestions = el("section", "", "cl-card");
        suggestions.append(
          el("h4", "Sugestões"),
          el(
            "p",
            "Nomes sugeridos, não criados por esta lista. A disponibilidade é conferida no formulário.",
          ),
        );
        for (const slug of ["compass", "evento", "material", "agenda"])
          suggestions.append(
            button("Criar " + slug, () => showForm(null, kind, slug)),
          );
        view.append(suggestions);
      }
    }
    function metadata(parent, item = {}) {
      const title = field(parent, "Título interno", "text", item.title);
      title.required = true;
      title.maxLength = 200;
      const tags = field(
        parent,
        "Etiquetas",
        "text",
        (item.tags || []).join(", "),
      );
      tags.placeholder = "Separadas por vírgula";
      const expiry = field(
        parent,
        "Validade (horário de Brasília)",
        "datetime-local",
        toLocal(item.expires_at),
      );
      const preview = field(
        parent,
        "Descrição de prévia",
        "textarea",
        item.preview_description,
      );
      preview.maxLength = 160;
      const notes = field(parent, "Notas", "textarea", item.notes);
      notes.maxLength = 10000;
      return () => ({
        title: title.value.trim(),
        tags: tags.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        expires_at: toUTC(expiry.value),
        preview_description: preview.value,
        notes: notes.value,
      });
    }
    async function showForm(
      item,
      kind = "rotativo",
      slugValue = "",
      restore = null,
      metaOnly = false,
    ) {
      const gen = start(
        metaOnly
          ? "Editar informações"
          : item
            ? restore
              ? "Restaurar destino"
              : item.kind === "estatico"
                ? "Corrigir destino"
                : "Trocar destino"
            : "Criar link",
      );
      current = item;
      reload = item ? () => openDetail(item.id) : () => showList(kind);
      const form = el("form", "", "cl-card");
      form.id = "cl-form";
      view.append(form);
      form.append(button("Voltar", reload));
      let slug, kindSelect, readMeta;
      if (!item) {
        kindSelect = select(
          form,
          "Tipo",
          [
            ["rotativo", "Rotativo"],
            ["estatico", "Estático"],
          ],
          kind,
        );
        const explanation = el("p");
        const describe = () => {
          explanation.textContent =
            kindSelect.value === "rotativo"
              ? "O endereço fica o mesmo, e você pode trocar o destino quando quiser"
              : "O endereço sempre leva ao mesmo conteúdo; só o superadmin corrige, com motivo";
        };
        kindSelect.addEventListener("change", describe);
        describe();
        form.append(explanation);
        slug = field(form, "Nome curto", "text", slugValue);
        slug.required = true;
        slug.maxLength = 64;
        slug.pattern = "[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?";
        const available = el("p", "", "cl-muted");
        available.setAttribute("role", "status");
        form.append(available);
        let availabilityTimer;
        const availability = async () => {
          const value = slug.value;
          available.textContent = "csv.online/" + value;
          if (!value) return;
          const a = await api(
            "/slugs/" + encodeURIComponent(value) + "/availability",
          );
          if (value === slug.value && gen === generation)
            available.textContent =
              "csv.online/" +
              value +
              " · " +
              (a.available
                ? "Disponível"
                : {
                    formato: "Formato inválido",
                    reservado: "Nome reservado",
                    em_uso: "Nome em uso",
                  }[a.reason] || "Indisponível");
        };
        slug.addEventListener("input", () => {
          clearTimeout(availabilityTimer);
          availabilityTimer = setTimeout(() => run(availability), 350);
        });
        if (slugValue) run(availability);
      }
      if (!item || metaOnly) readMeta = metadata(form, item || {});
      if (metaOnly) {
        const submit = el("button", "Salvar informações", "cl-button");
        submit.type = "submit";
        form.append(submit);
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          run(async () => {
            submit.disabled = true;
            try {
              await api("/links/" + encodeURIComponent(item.id), {
                method: "PATCH",
                body: { ...readMeta(), expected_version: item.version },
              });
              if (gen === generation) await openDetail(item.id);
            } finally {
              submit.disabled = false;
            }
          });
        });
        return;
      }
      const source = select(
        form,
        "Origem do destino",
        [
          ["manual", "Outra URL"],
          ["blog", "Post do blog"],
        ],
        "manual",
      );
      const posts = select(form, "Post do blog", [["", "Selecione um post"]]);
      posts.parentElement.hidden = true;
      const url = field(form, "Destino", "url", restore?.url || "");
      url.required = true;
      url.maxLength = 2048;
      url.placeholder = "https://";
      if (restore) url.readOnly = true;
      const label = field(
        form,
        "Rótulo do destino",
        "text",
        restore?.label || "",
      );
      label.maxLength = 200;
      const blogMessage = el("p"),
        pageMessage = el("p", "", "cl-note");
      form.append(blogMessage, pageMessage);
      let blog = [];
      source.addEventListener("change", () =>
        run(async () => {
          posts.parentElement.hidden = source.value !== "blog";
          if (source.value === "blog" && !blog.length) {
            try {
              blog = await api("/blog/posts");
              if (gen !== generation) return;
              blog.forEach((p) => {
                const o = el("option", p.title + " · " + date(p.publishedAt));
                o.value = p.id;
                posts.append(o);
              });
            } catch (e) {
              blogMessage.textContent =
                e.message +
                (e.requestId ? " Referência: " + e.requestId : "") +
                " Você pode usar Outra URL.";
            }
          }
        }),
      );
      if (restore) {
        source.disabled = true;
        posts.disabled = true;
        label.readOnly = true;
      }
      let check = null,
        checkedURL = null;
      const result = el("div", "", "cl-check-result");
      result.setAttribute("role", "status");
      form.append(result);
      const override = checkbox(form, "Publicar mesmo assim");
      override.parentElement.hidden = true;
      const credential = checkbox(
        form,
        "Este endereço parece conter uma credencial e ficará visível para quem usar o link",
      );
      credential.parentElement.hidden = true;
      function invalidate() {
        check = null;
        checkedURL = null;
        result.replaceChildren();
        override.checked = false;
        override.parentElement.hidden = true;
        credential.checked = false;
        credential.parentElement.hidden = true;
        pageMessage.textContent = pageWarning(url.value)
          ? "A revogação desta página é feita em Links Públicos"
          : "";
      }
      url.addEventListener("input", invalidate);
      posts.addEventListener("change", () => {
        const post = blog.find((p) => String(p.id) === posts.value);
        if (post) {
          url.value = post.url;
          label.value = post.title;
          invalidate();
        }
      });
      invalidate();
      function acceptCheck(c, requestedURL) {
        if (gen !== generation || url.value !== requestedURL) return false;
        check = c;
        checkedURL = requestedURL;
        override.checked = false;
        credential.checked = false;
        checkResult(result, c);
        override.parentElement.hidden = c.status !== "falhou";
        credential.parentElement.hidden = !c.credential_warning;
        return true;
      }
      async function requestCheck() {
        const requestedURL = url.value;
        const result = await api("/checks", {
          method: "POST",
          body: { url: requestedURL },
        });
        return acceptCheck(result, requestedURL);
      }
      const testButton = button("Testar destino", requestCheck);
      form.append(testButton);
      let reason, confirmSlug;
      if (item?.kind === "estatico") {
        reason = field(
          form,
          "Motivo da correção (mínimo de 10 caracteres)",
          "textarea",
        );
        reason.required = true;
        reason.minLength = 10;
        confirmSlug = field(form, "Digite o nome curto para confirmar", "text");
        confirmSlug.required = true;
      }
      const submit = el(
        "button",
        item
          ? restore
            ? "Restaurar destino"
            : "Salvar destino"
          : "Criar link",
        "cl-button cl-primary",
      );
      submit.type = "submit";
      form.append(submit);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        run(async () => {
          notice();
          if (confirmSlug && confirmSlug.value !== item.slug)
            throw new Error(
              "Digite o nome curto exatamente como exibido: " + item.slug,
            );
          if (reason && reason.value.trim().length < 10)
            throw new Error("O motivo precisa ter pelo menos 10 caracteres.");
          submit.disabled = true;
          try {
            if ((!check || checkedURL !== url.value) && !(await requestCheck()))
              return;
            if (check.status === "falhou" && !override.checked)
              throw new Error(
                "O teste falhou. Revise o destino ou marque Publicar mesmo assim.",
              );
            if (check.credential_warning && !credential.checked)
              throw new Error(
                "Confirme que o endereço ficará visível para quem usar o link.",
              );
            if (
              check.status === "falhou" &&
              !window.confirm(
                "O teste do destino falhou. Confirma publicar mesmo assim?",
              )
            )
              return;
            const post =
              source.value === "blog"
                ? blog.find((p) => String(p.id) === posts.value)
                : null;
            if (source.value === "blog" && (!post || post.url !== url.value))
              throw new Error("Selecione um post ou escolha Outra URL.");
            const destination = {
              url: url.value,
              label: label.value,
              source: post ? "blog" : "manual",
              ...(post ? { blog_post_id: post.id } : {}),
            };
            const common = {
              check_id: check.check_id,
              publish_despite_failure:
                check.status === "falhou" && override.checked,
              confirm_credential_url: credential.checked,
            };
            const body = item
              ? {
                  ...destination,
                  ...common,
                  expected_version: item.version,
                  ...(reason
                    ? {
                        reason: reason.value.trim(),
                        confirm_slug: confirmSlug.value,
                      }
                    : {}),
                  ...(restore ? { destination_id: restore.id } : {}),
                }
              : {
                  ...readMeta(),
                  ...common,
                  slug: slug.value,
                  kind: kindSelect.value,
                  destination,
                };
            let saved;
            try {
              saved = await api(
                item
                  ? "/links/" +
                      encodeURIComponent(item.id) +
                      (restore ? "/restore" : "/destination")
                  : "/links",
                { method: "POST", body },
              );
            } catch (err) {
              if (err.data?.check)
                acceptCheck(
                  { ...err.data.check, check_id: err.data.check.id },
                  destination.url,
                );
              if (err.code === "credential_confirmation_required") {
                credential.parentElement.hidden = false;
                check.credential_warning = true;
              }
              throw err;
            }
            if (gen !== generation) return;
            const detailGeneration = generation + 1;
            await openDetail(saved.id);
            if (
              generation === detailGeneration &&
              saved.route_written === false
            )
              notice(
                "O link foi salvo, mas a rota ainda precisa ser regravada. Acompanhe a propagação.",
              );
          } finally {
            submit.disabled = false;
          }
        });
      });
    }
    async function openDetail(id) {
      const gen = start("Detalhes do link");
      reload = () => openDetail(id);
      const item = await api("/links/" + encodeURIComponent(id));
      if (gen !== generation) return;
      current = item;
      const card = el("section", "", "cl-card");
      card.append(
        el("h4", "csv.online/" + item.slug),
        link(item.destination?.url || "Sem destino", item.destination?.url),
        el(
          "p",
          (item.kind === "rotativo" ? "Rotativo" : "Estático") +
            " · " +
            status(item) +
            " · Versão " +
            item.version,
        ),
        el("p", "Validade: " + date(item.expires_at)),
        el("p", "Etiquetas: " + item.tags.join(", ")),
        el("p", "Título: " + item.title),
        el("p", "Notas: " + (item.notes || "—")),
        el("p", "Descrição de prévia: " + (item.preview_description || "—")),
      );
      warning(card, item.destination?.url);
      view.append(card);
      const propagationNode = el("div", "", "cl-note");
      card.append(propagationNode);
      const actions = el("div", "", "cl-actions");
      card.append(actions);
      actions.append(
        button("Voltar à lista", () => showList(item.kind)),
        button("QR Code", () => showQR(item)),
        button("Copiar", () =>
          navigator.clipboard
            .writeText(publicURL(item.slug))
            .then(() => notice("Endereço copiado.", "success")),
        ),
      );
      if (!item.deleted_at) {
        actions.append(
          button("Editar informações", () =>
            showForm(item, item.kind, "", null, true),
          ),
        );
        if (item.kind === "rotativo" || role === "superadmin")
          actions.append(
            button(
              item.kind === "rotativo" ? "Trocar destino" : "Corrigir destino",
              () => showForm(item),
            ),
          );
        for (const [text, endpoint] of [
          [
            item.routing_enabled ? "Desativar" : "Reativar",
            item.routing_enabled ? "disable" : "enable",
          ],
          [
            item.archived_at ? "Desarquivar" : "Arquivar",
            item.archived_at ? "unarchive" : "archive",
          ],
        ])
          actions.append(
            button(text, async () => {
              if (
                !window.confirm(
                  text +
                    " csv.online/" +
                    item.slug +
                    "?" +
                    (endpoint === "archive"
                      ? " O roteamento continua ativo."
                      : ""),
                )
              )
                return;
              await api("/links/" + encodeURIComponent(id) + "/" + endpoint, {
                method: "POST",
                body: { expected_version: item.version },
              });
              if (gen === generation) await openDetail(id);
            }),
          );
        actions.append(
          button("Testar destino de novo", async () => {
            const c = await api("/checks", {
              method: "POST",
              body: {
                url: item.destination.url,
                destination_id: item.destination.id,
              },
            });
            if (gen === generation) checkResult(test, c);
          }),
          button("Regravar rota", async () => {
            await api("/links/" + encodeURIComponent(id) + "/rewrite-route", {
              method: "POST",
              body: {},
            });
            if (gen === generation) await openDetail(id);
          }),
        );
        if (role === "superadmin")
          actions.append(button("Excluir", () => showDelete(item)));
      }
      const test = el("div", "", "cl-check-result");
      card.append(test);
      if (item.last_check) checkResult(test, item.last_check);
      if (!item.deleted_at) monitor(item, propagationNode, gen);
      const historyNode = el("section", "", "cl-card");
      historyNode.append(el("h4", "Histórico de destinos"));
      view.append(historyNode);
      async function historyPage(page = 1) {
        const history = await api(
          "/links/" +
            encodeURIComponent(id) +
            "/history?page=" +
            page +
            "&page_size=25",
        );
        if (gen !== generation) return;
        historyNode.replaceChildren(el("h4", "Histórico de destinos"));
        for (const d of history.destinations) {
          const row = el("article", "", "cl-history");
          row.append(
            link(d.url, d.url),
            el("p", d.label || ""),
            el(
              "p",
              "De " +
                date(d.valid_from) +
                " até " +
                (d.valid_to ? date(d.valid_to) : "agora") +
                " · " +
                d.created_by,
            ),
            el(
              "p",
              d.published_despite_failure
                ? "Publicado apesar da falha no teste"
                : "Teste de publicação aprovado",
            ),
            el("p", d.reason ? "Motivo: " + d.reason : ""),
          );
          if (
            d.id !== item.current_destination_id &&
            !item.deleted_at &&
            (item.kind === "rotativo" || role === "superadmin")
          )
            row.append(
              button("Restaurar este destino", () =>
                showForm(item, item.kind, "", d),
              ),
            );
          historyNode.append(row);
        }
        const events = el("details");
        events.append(el("summary", "Eventos deste link"));
        for (const ev of history.events)
          events.append(
            el(
              "p",
              date(ev.at) +
                " · " +
                ev.type +
                " · " +
                ev.actor_email +
                (ev.reason ? " · " + ev.reason : ""),
            ),
          );
        historyNode.append(events);
        const nav = el("div", "", "cl-actions");
        const prev = button("Destinos anteriores", () => historyPage(page - 1));
        prev.disabled = page <= 1;
        const next = button("Mais destinos", () => historyPage(page + 1));
        next.disabled =
          page * 25 >= history.total && history.destinations.length < 25;
        nav.append(prev, el("span", "Página " + page), next);
        historyNode.append(nav);
      }
      await historyPage();
    }
    async function monitor(item, node, gen) {
      let observed = null,
        provisional = false;
      async function poll() {
        if (gen !== generation || !root.classList.contains("active")) return;
        try {
          const path = "/_csv/v/" + encodeURIComponent(item.slug),
            request = {
              credentials: "omit",
              cache: "no-store",
              redirect: "manual",
              signal: AbortSignal.timeout(7000),
            };
          let response = await fetch("https://csv.online" + path, request);
          if (response.type === "opaqueredirect") {
            provisional = true;
            response = await fetch("https://pre.csv.online" + path, request);
          }
          if (response.ok) {
            const v = await response.json();
            observed = v.found ? Number(v.version) : null;
          }
        } catch {
          observed = null;
        }
        if (gen !== generation) return;
        const state = propagation(
          item.published_at || item.updated_at,
          item.version,
          observed,
        );
        node.replaceChildren(
          el(
            "p",
            state.status +
              (state.status === "Em propagação"
                ? " · " + state.seconds + " s desde a publicação"
                : ""),
          ),
          el(
            "p",
            "A confirmação vale para a região de rede deste navegador. Alguns acessos ainda podem chegar ao destino anterior por cerca de 90 segundos ou mais.",
          ),
        );
        if (provisional)
          node.append(
            el("p", "A regra provisória ainda responde em csv.online"),
          );
        if (state.status !== "Confirmado") timer = setTimeout(poll, 15000);
      }
      node.append(el("p", "Em propagação"));
      poll();
    }
    function showDelete(item) {
      const gen = start("Excluir link");
      current = item;
      reload = () => openDetail(item.id);
      const form = el("form", "", "cl-card");
      form.append(
        el(
          "p",
          "O nome ficará livre para outro link. O histórico e as métricas deste link serão preservados.",
        ),
        el("p", "csv.online/" + item.slug),
      );
      const confirmSlug = field(form, "Digite o nome curto para excluir");
      confirmSlug.required = true;
      const submit = el("button", "Confirmar exclusão", "cl-button");
      submit.type = "submit";
      form.append(submit, button("Cancelar", reload));
      view.append(form);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        run(async () => {
          if (confirmSlug.value !== item.slug)
            throw new Error("O nome curto não confere.");
          submit.disabled = true;
          try {
            await api("/links/" + encodeURIComponent(item.id), {
              method: "DELETE",
              body: {
                expected_version: item.version,
                confirm_slug: confirmSlug.value,
              },
            });
            if (gen === generation) await showList(item.kind);
          } finally {
            submit.disabled = false;
          }
        });
      });
    }
    function showQR(item) {
      start("QR Code");
      reload = () => openDetail(item.id);
      const address = publicURL(item.slug),
        qr = window.qrcode(0, "M");
      qr.addData(address, "Byte");
      qr.make();
      const n = qr.getModuleCount(),
        scale = 8,
        margin = 4,
        size = (n + margin * 2) * scale,
        canvas = el("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.setAttribute("aria-label", "QR Code de " + address);
      canvas.setAttribute("role", "img");
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#000000";
      let path = "";
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (qr.isDark(r, c)) {
            ctx.fillRect(
              (c + margin) * scale,
              (r + margin) * scale,
              scale,
              scale,
            );
            path += "M" + (c + margin) + " " + (r + margin) + "h1v1h-1z";
          }
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
        (n + 8) +
        " " +
        (n + 8) +
        '" width="' +
        size +
        '" height="' +
        size +
        '"><rect width="100%" height="100%" fill="white"/><path d="' +
        path +
        '" fill="black"/></svg>';
      const card = el("div", "", "cl-card cl-qr");
      card.append(
        el("p", address),
        canvas,
        button(
          "Baixar PNG",
          () =>
            new Promise((resolve) =>
              canvas.toBlob((blob) => {
                download(blob, item.slug + ".png");
                resolve();
              }, "image/png"),
            ),
        ),
        button("Baixar SVG", () =>
          download(
            new Blob([svg], { type: "image/svg+xml" }),
            item.slug + ".svg",
          ),
        ),
        button("Voltar", reload),
      );
      view.append(card);
    }
    async function navigate(name) {
      section = name;
      document
        .querySelectorAll("[data-cl-section]")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.clSection === name)),
        );
      if (name === "rotativo" || name === "estatico") return showList(name);
      const gen = start(
        {
          overview: "Visão geral",
          domains: "Domínios",
          metrics: "Histórico e Métricas",
          email: "csv.email",
        }[name],
      );
      reload = () => navigate(name);
      const sections = window.createCentralLinksSections({
        api,
        el,
        button,
        field,
        select,
        notice,
        run,
        view,
        role,
        openDetail,
        date,
        download,
        isCurrent: () => gen === generation,
      });
      await sections[name]();
    }
    root
      .querySelectorAll("[data-cl-section]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          run(() => navigate(b.dataset.clSection)),
        ),
      );
    const controller = {
      open: () =>
        run(async () => {
          role = "";
          const gen = start("Central de Links");
          reload = () => controller.open();
          const me = await api("/me");
          if (gen !== generation) return;
          role = me.role;
          await navigate(section);
        }),
      close: () => {
        generation++;
        clearTimeout(timer);
      },
    };
    return controller;
  };
})();
