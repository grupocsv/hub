(function () {
  "use strict";

  function dayInBrasilia(value) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const part = (type) => parts.find((item) => item.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }

  function period(days, now = new Date()) {
    const to = dayInBrasilia(now);
    const start = new Date(`${to}T12:00:00Z`);
    start.setUTCDate(start.getUTCDate() - days + 1);
    return { from: start.toISOString().slice(0, 10), to };
  }

  function retentionDay(now = new Date()) {
    const [year, month, day] = dayInBrasilia(now).split("-").map(Number);
    const lastDay = new Date(Date.UTC(year - 2, month, 0)).getUTCDate();
    return new Date(Date.UTC(year - 2, month - 1, Math.min(day, lastDay)))
      .toISOString()
      .slice(0, 10);
  }

  function choiceLabel(link, date) {
    const address = `csv.online/${link.slug}`;
    return link.deleted_at
      ? `${address} · Excluído em ${date(link.deleted_at)}`
      : link.archived_at
        ? `${address} · Arquivado`
        : address;
  }

  function dailySeries(rows, from, to) {
    const indexed = new Map();
    for (const row of rows) {
      if (!indexed.has(row.value))
        indexed.set(row.value, { clique: 0, robo: 0 });
      if (row.traffic === "clique" || row.traffic === "robo")
        indexed.get(row.value)[row.traffic] += Number(row.count) || 0;
    }
    const result = [];
    const cursor = new Date(`${from}T12:00:00Z`);
    for (
      let count = 0;
      count < 733 && Number.isFinite(cursor.getTime());
      count++
    ) {
      const day = cursor.toISOString().slice(0, 10);
      if (day > to) break;
      result.push({ day, ...(indexed.get(day) || { clique: 0, robo: 0 }) });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return result;
  }

  window.centralLinksPeriod = period;
  window.centralLinksRetentionDay = retentionDay;
  window.centralLinksChoiceLabel = choiceLabel;
  window.centralLinksDailySeries = dailySeries;
  window.createCentralLinksSections = function (ctx) {
    const {
      api,
      el,
      button,
      field,
      select,
      notice,
      run,
      view,
      date,
      download,
    } = ctx;
    let generation = 0;
    let fieldId = 0;
    const eventLabels = {
      criado: "Criado",
      destino_publicado: "Destino publicado",
      destino_restaurado: "Destino restaurado",
      estatico_corrigido: "Estático corrigido",
      metadados_alterados: "Metadados alterados",
      validade_alterada: "Validade alterada",
      desativado: "Desativado",
      reativado: "Reativado",
      arquivado: "Arquivado",
      desarquivado: "Desarquivado",
      excluido: "Excluído",
      rota_regravada: "Rota regravada",
    };
    const statusLabels = {
      pendente: "Pendente",
      verificado: "Verificado",
      nao_configurado: "Não configurado",
    };
    const fmt = (value) => Number(value || 0).toLocaleString("pt-BR");

    function start(title) {
      const current = ++generation;
      view.replaceChildren(el("h2", title), el("p", "Carregando…", "cl-muted"));
      return current;
    }
    function active(current) {
      return current === generation && (!ctx.isCurrent || ctx.isCurrent());
    }
    function card(parent, title) {
      const box = el("section", "", "cl-card");
      if (title) box.append(el("h3", title));
      parent.append(box);
      return box;
    }
    function actions(parent) {
      const box = el("div", "", "cl-actions");
      parent.append(box);
      return box;
    }
    function message(error) {
      return `${error.message || "Não foi possível concluir a consulta."}${error.requestId ? ` Referência: ${error.requestId}` : ""}`;
    }
    function table(
      parent,
      headers,
      rows,
      empty = "Nenhum registro neste período.",
    ) {
      if (!rows.length) {
        parent.append(el("p", empty, "cl-muted"));
        return;
      }
      const element = el("table", "", "cl-table");
      const head = el("thead");
      const heading = el("tr");
      for (const name of headers) {
        const cell = el("th", name);
        cell.scope = "col";
        heading.append(cell);
      }
      head.append(heading);
      const body = el("tbody");
      for (const row of rows) {
        const tr = el("tr");
        row.forEach((value, index) => {
          const cell = el("td");
          cell.dataset.label = headers[index];
          if (value && typeof value === "object" && value.nodeType)
            cell.append(value);
          else cell.textContent = String(value ?? "—");
          tr.append(cell);
        });
        body.append(tr);
      }
      element.append(head, body);
      parent.append(element);
    }
    function textarea(parent, label, value, maxLength) {
      const id = `cl-extra-${++fieldId}`;
      const labelNode = el("label", label);
      labelNode.htmlFor = id;
      const input = el("textarea");
      input.id = id;
      input.value = value || "";
      input.rows = 4;
      input.maxLength = maxLength;
      parent.append(labelNode, input);
      return input;
    }
    function checkbox(parent, label, checked) {
      const box = el("label", "", "cl-check");
      const input = el("input");
      input.type = "checkbox";
      input.checked = checked;
      box.append(input, el("span", label));
      parent.append(box);
      return input;
    }
    function external(parent, title, href) {
      const link = el("a", title);
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      parent.append(link);
    }
    function eventRows(events, names = new Map()) {
      return events.map((event) => [
        date(event.at),
        eventLabels[event.type] || event.type,
        button(names.get(event.link_id) || "Abrir link", () =>
          ctx.openDetail(event.link_id),
        ),
        event.actor_email || "Rotina automática",
        event.to_version == null ? "—" : `v${event.to_version}`,
      ]);
    }
    function domainTable(parent, result) {
      parent.append(el("p", `Verificação: ${date(result.at)}`, "cl-muted"));
      for (const domain of result.domains || []) {
        const box = card(parent, domain.domain);
        table(
          box,
          ["Registro", "Situação", "Valores"],
          ["ns", "mx", "spf", "dmarc", "a", "aaaa"].map((key) => {
            const record = domain[key] || {};
            return [
              key.toUpperCase(),
              record.status === "ok" ? "Consultado" : "Sem resposta",
              (record.values || []).join(" · ") ||
                (record.status === "ok"
                  ? "Nenhum registro encontrado"
                  : "Consulta indisponível"),
            ];
          }),
        );
      }
    }

    async function overview() {
      const current = start("Visão geral");
      const [summary, domainsResult] = await Promise.allSettled([
        api("/metrics/overview"),
        api("/domains"),
      ]);
      if (!active(current)) return;
      view.replaceChildren(el("h2", "Visão geral"));
      if (summary.status === "fulfilled") {
        const data = summary.value;
        const grid = el("div", "", "cl-grid");
        view.append(grid);
        const counts = data.links || [];
        const sum = (key) =>
          counts.reduce((total, row) => total + Number(row[key] || 0), 0);
        const stats = [
          ["Rotativos", counts.find((row) => row.kind === "rotativo")?.total],
          ["Estáticos", counts.find((row) => row.kind === "estatico")?.total],
          ["Ativos", sum("active")],
          ["Desativados", sum("disabled")],
          ["Expirados", sum("expired")],
          ["Falhas no último teste diário", (data.daily_failures || []).length],
          ["Cliques em 7 dias", data.clicks_last_7_days],
          ["Cliques em 30 dias", data.clicks_last_30_days],
        ];
        for (const [name, count] of stats)
          card(grid, name).append(el("p", fmt(count), "cl-stat"));
        view.append(
          el(
            "p",
            "Cliques sem robôs. A classificação de robôs é aproximada.",
            "cl-muted",
          ),
        );
        const recent = card(view, "Últimas 10 alterações");
        table(
          recent,
          ["Data de Brasília", "Evento", "Link", "Autor", "Versão"],
          eventRows(data.recent_events || []),
        );
        const failures = card(view, "Destinos com falha no teste diário");
        table(
          failures,
          ["Endereço", "Último teste", "Situação"],
          (data.daily_failures || []).map((item) => [
            button(`csv.online/${item.slug}`, () => ctx.openDetail(item.id)),
            date(item.at),
            "Destino com falha",
          ]),
          "Nenhuma falha informada no último teste diário.",
        );
        const jobs = new Map(
          (data.jobs || []).map((job) => [job.job, job.last_success]),
        );
        const daily = card(
          view,
          "Últimas execuções bem-sucedidas da tarefa diária",
        );
        table(
          daily,
          ["Etapa", "Data de Brasília"],
          [
            ["teste_diario", "Teste diário dos destinos"],
            ["conciliacao_kv", "Conciliação das rotas"],
            ["retencao_metricas", "Retenção das métricas"],
          ].map(([key, label]) => [
            label,
            jobs.get(key)
              ? date(jobs.get(key))
              : "Nenhuma execução bem-sucedida informada",
          ]),
        );
      } else notice(message(summary.reason));
      const domainBox = card(view, "Situação dos domínios");
      if (domainsResult.status === "fulfilled")
        domainTable(domainBox, domainsResult.value);
      else domainBox.append(el("p", message(domainsResult.reason)));
      if (ctx.role === "superadmin") {
        const admin = card(view, "Administração");
        admin.append(
          el(
            "p",
            "A exportação contém destinos e autoria administrativa. Guarde o arquivo em local com acesso restrito.",
            "cl-muted",
          ),
        );
        actions(admin).append(
          button("Exportar cópia de segurança", () =>
            run(async () => {
              const data = await api("/admin/export");
              download(
                new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                }),
                `central-de-links-${period(1).to}.json`,
              );
            }),
          ),
          button("Reconstruir KV", () =>
            run(async () => {
              if (
                !window.confirm(
                  "Reconstruir todas as rotas a partir dos registros salvos?",
                )
              )
                return;
              await api("/admin/rebuild-kv", { method: "POST", body: {} });
              notice(
                "Rotas reconstruídas. A atualização dos acessos segue o prazo de propagação.",
                "success",
              );
            }),
          ),
        );
      }
    }

    async function domains() {
      const current = start("Domínios");
      const attemptedAt = new Date().toISOString();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const health = (async () => {
        try {
          const response = await fetch("https://csv.online/_csv/health", {
            signal: controller.signal,
            redirect: "manual",
            cache: "no-store",
          });
          if (!response.ok && response.status !== 503)
            throw new Error("Sem resposta");
          const data = await response.json();
          if (
            data.service !== "csv-links" ||
            !["ok", "erro"].includes(data.d1) ||
            !["ok", "erro"].includes(data.kv)
          )
            throw new Error("Sem resposta");
          return data;
        } finally {
          clearTimeout(timer);
        }
      })();
      const [dns, worker] = await Promise.allSettled([api("/domains"), health]);
      if (!active(current)) return;
      view.replaceChildren(el("h2", "Domínios"));
      actions(view).append(button("Verificar novamente", () => run(domains)));
      const workerBox = card(view, "Saúde de csv.online");
      workerBox.append(el("p", `Tentativa: ${date(attemptedAt)}`, "cl-muted"));
      if (worker.status === "fulfilled") {
        const state = worker.value;
        workerBox.append(
          el(
            "p",
            `Serviço: ${state.service || "csv-links"} · D1: ${state.d1 === "ok" ? "Disponível" : "Indisponível"} · KV: ${state.kv === "ok" ? "Disponível" : "Indisponível"}`,
          ),
        );
      } else workerBox.append(el("p", "Sem resposta"));
      if (dns.status === "fulfilled") domainTable(view, dns.value);
      else notice(message(dns.reason));
      const policy = card(view, "Política vigente");
      policy.append(
        el(
          "p",
          "Links ativos respondem com redirecionamento 302 e Cache-Control: no-store. O endereço curto preserva o login e as permissões do destino.",
        ),
      );
      policy.append(
        el(
          "p",
          "Somente parâmetros utm_ válidos são acrescentados: até cinco, com até 200 caracteres cada. Valores já presentes no destino prevalecem.",
        ),
      );
      policy.append(
        el(
          "p",
          "Nomes reservados: admin, api, app, assets, auth, email, favicon, health, help, links, login, logout, mail, og, p, preview, qr, robots, s, static, status e www.",
        ),
      );
      policy.append(
        el(
          "p",
          "Esta área apenas consulta DNS e saúde; não altera a configuração dos domínios.",
          "cl-muted",
        ),
      );
    }

    function drawChart(parent, series, showBots) {
      if (!series.length) {
        parent.append(el("p", "Nenhum dia neste período.", "cl-muted"));
        return;
      }
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 720 260");
      svg.setAttribute("role", "img");
      svg.setAttribute(
        "aria-label",
        "Cliques por dia; linha contínua para cliques e tracejada para robôs.",
      );
      svg.style.width = "100%";
      svg.style.height = "auto";
      const title = document.createElementNS(ns, "title");
      title.textContent = "Cliques diários e robôs";
      svg.append(title);
      const max = Math.max(
        1,
        ...series.map((row) => Math.max(row.clique, showBots ? row.robo : 0)),
      );
      const point = (row, index, key) =>
        `${44 + (index * 652) / Math.max(1, series.length - 1)},${220 - (row[key] * 180) / max}`;
      for (const key of showBots ? ["clique", "robo"] : ["clique"]) {
        const line = document.createElementNS(ns, "polyline");
        line.setAttribute(
          "points",
          series.map((row, index) => point(row, index, key)).join(" "),
        );
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", "currentColor");
        line.setAttribute("stroke-width", key === "clique" ? "3" : "2");
        if (key === "robo") line.setAttribute("stroke-dasharray", "7 5");
        svg.append(line);
      }
      for (const [text, x, y, anchor] of [
        [fmt(max), 5, 44, "start"],
        ["0", 12, 224, "start"],
        [series[0].day, 44, 248, "start"],
        [series[series.length - 1].day, 696, 248, "end"],
      ]) {
        const label = document.createElementNS(ns, "text");
        label.textContent = text;
        label.setAttribute("x", x);
        label.setAttribute("y", y);
        label.setAttribute("fill", "currentColor");
        label.setAttribute("font-size", "13");
        label.setAttribute("text-anchor", anchor);
        svg.append(label);
      }
      parent.append(
        svg,
        el(
          "p",
          `Linha contínua: cliques${showBots ? " · Linha tracejada: robôs" : ""}. Classificação aproximada.`,
          "cl-muted",
        ),
      );
      const details = el("details");
      details.append(el("summary", "Ver valores diários em tabela"));
      table(
        details,
        ["Dia", "Cliques", ...(showBots ? ["Robôs"] : [])],
        series.map((row) => [
          row.day,
          fmt(row.clique),
          ...(showBots ? [fmt(row.robo)] : []),
        ]),
      );
      parent.append(details);
    }

    async function allLinks() {
      const links = new Map();
      for (const status of ["", "arquivado", "excluido"]) {
        let page = 1;
        while (true) {
          const result = await api(
            `/links?page=${page}&page_size=100&sort=slug${status ? `&status=${status}` : ""}`,
          );
          for (const link of result.links) links.set(link.id, link);
          if (page * 100 >= result.total || !result.links.length) break;
          page++;
        }
      }
      return [...links.values()].sort((left, right) =>
        left.slug.localeCompare(right.slug),
      );
    }

    async function allDestinations(id) {
      const destinations = new Map();
      for (let page = 1; ; page++) {
        const result = await api(
          `/links/${id}/history?page=${page}&page_size=100`,
        );
        for (const destination of result.destinations || [])
          destinations.set(destination.id, destination);
        if ((result.destinations || []).length < 100) return destinations;
      }
    }

    async function metrics() {
      const current = start("Histórico e Métricas");
      const links = await allLinks();
      if (!active(current)) return;
      view.replaceChildren(el("h2", "Histórico e Métricas"));
      const choices = links.map((link) => [link.id, choiceLabel(link, date)]);
      const names = new Map(choices);
      const filters = card(view, "Período e link");
      const grid = el("div", "", "cl-grid");
      filters.append(grid);
      const range = select(
        grid,
        "Período",
        [
          ["7", "Últimos 7 dias"],
          ["30", "Últimos 30 dias"],
          ["90", "Últimos 90 dias"],
          ["custom", "Personalizado"],
        ],
        "30",
      );
      const selected = select(
        grid,
        "Link",
        [["", "Todos os links"], ...choices],
        links[0]?.id || "",
      );
      const initial = period(30);
      const from = field(grid, "De", "date", initial.from);
      const to = field(grid, "Até", "date", initial.to);
      from.max = to.max = period(1).to;
      from.min = to.min = retentionDay();
      from.disabled = to.disabled = true;
      const bots = checkbox(filters, "Mostrar robôs no gráfico diário", true);
      range.addEventListener("change", () => {
        from.disabled = to.disabled = range.value !== "custom";
        if (range.value !== "custom") {
          const next = period(Number(range.value));
          from.value = next.from;
          to.value = next.to;
        }
      });
      const output = card(view, "Cliques");
      const historyBox = card(view, "Histórico geral");
      const eventFilters = el("div", "", "cl-grid");
      historyBox.append(eventFilters);
      const eventLink = select(
        eventFilters,
        "Link do histórico",
        [["", "Todos os links"], ...choices],
        "",
      );
      const eventType = select(
        eventFilters,
        "Tipo de evento",
        [["", "Todos os eventos"], ...Object.entries(eventLabels)],
        "",
      );
      const author = field(eventFilters, "Autor", "email", "");
      const eventsOutput = el("div");
      historyBox.append(eventsOutput);
      let eventPage = 1;
      let metricRequest = 0;
      let eventRequest = 0;
      let latestSeries = [];

      function validatePeriod() {
        if (
          !from.value ||
          !to.value ||
          from.value > to.value ||
          from.value < from.min ||
          to.value > to.max
        ) {
          throw new Error(
            "Informe um período válido dentro dos últimos 24 meses.",
          );
        }
      }
      async function loadEvents() {
        validatePeriod();
        const request = ++eventRequest;
        const params = new URLSearchParams({
          page: String(eventPage),
          page_size: "25",
          from: `${from.value}T00:00:00-03:00`,
          to: `${to.value}T23:59:59.999-03:00`,
        });
        // O histórico é armazenado em UTC; normalize os limites antes da comparação no servidor.
        params.set("from", new Date(params.get("from")).toISOString());
        params.set("to", new Date(params.get("to")).toISOString());
        if (eventLink.value) params.set("link_id", eventLink.value);
        if (eventType.value) params.set("type", eventType.value);
        if (author.value.trim()) params.set("actor_email", author.value.trim());
        const result = await api(`/events?${params}`);
        if (!active(current) || request !== eventRequest) return;
        eventsOutput.replaceChildren();
        table(
          eventsOutput,
          ["Data de Brasília", "Evento", "Link", "Autor", "Versão"],
          eventRows(result.events || [], names),
        );
        const pager = actions(eventsOutput);
        const previous = button("Eventos anteriores", () =>
          run(async () => {
            eventPage--;
            await loadEvents();
          }),
        );
        previous.disabled = eventPage === 1;
        const next = button("Mais eventos", () =>
          run(async () => {
            eventPage++;
            await loadEvents();
          }),
        );
        next.disabled = eventPage * 25 >= result.total;
        pager.append(
          previous,
          el("span", `Página ${eventPage} · ${fmt(result.total)} eventos`),
          next,
        );
      }
      async function loadMetrics() {
        validatePeriod();
        const request = ++metricRequest;
        const params = new URLSearchParams({ from: from.value, to: to.value });
        if (!selected.value) {
          const result = await api(`/metrics/overview?${params}`);
          if (!active(current) || request !== metricRequest) return;
          output.replaceChildren(el("h3", "Cliques no período"));
          output.append(
            el(
              "p",
              `${fmt((result.totals || []).reduce((sum, row) => sum + Number(row.count || 0), 0))} cliques sem robôs.`,
            ),
          );
          table(
            output,
            ["Endereço", "Cliques"],
            (result.top_links || []).map((link) => [
              `csv.online/${link.slug}`,
              fmt(link.count),
            ]),
          );
          output.append(
            el(
              "p",
              "Escolha um link para ver o gráfico diário e as distribuições.",
              "cl-muted",
            ),
          );
          latestSeries = [];
          return;
        }
        const id = encodeURIComponent(selected.value);
        const groups = ["day", "destination", "country", "source", "campaign"];
        const result = await Promise.all(
          groups.map((group) =>
            api(
              `/links/${id}/metrics?${params}&group=${group}${group === "day" ? "" : "&traffic=clique"}`,
            ),
          ),
        );
        const destinations = await allDestinations(id);
        if (!active(current) || request !== metricRequest) return;
        output.replaceChildren(el("h3", "Cliques diários"));
        latestSeries = dailySeries(result[0].rows || [], from.value, to.value);
        const chart = el("div");
        chart.dataset.clChart = "true";
        output.append(chart);
        drawChart(chart, latestSeries, bots.checked);
        const headers = {
          destination: "Período de cada destino",
          country: "País",
          source: "Origem",
          campaign: "Campanha",
        };
        groups.slice(1).forEach((group, index) => {
          const box = card(output, headers[group]);
          if (group === "destination") {
            table(
              box,
              ["Destino", "Vigência de Brasília", "Cliques"],
              (result[index + 1].rows || []).map((row) => {
                const destination = destinations.get(row.value);
                return [
                  destination
                    ? destination.label || destination.url
                    : "Destino histórico",
                  destination
                    ? `${date(destination.valid_from)} até ${destination.valid_to ? date(destination.valid_to) : "agora"}`
                    : "Consulte o histórico do link",
                  fmt(row.count),
                ];
              }),
            );
          } else
            table(
              box,
              [headers[group], "Cliques"],
              (result[index + 1].rows || []).map((row) => [
                row.value || "Não informada",
                fmt(row.count),
              ]),
            );
        });
      }
      bots.addEventListener("change", () => {
        const chart = output.querySelector("[data-cl-chart]");
        if (chart) {
          chart.replaceChildren();
          drawChart(chart, latestSeries, bots.checked);
        }
      });
      actions(filters).append(
        button("Consultar métricas", () =>
          run(async () => {
            eventPage = 1;
            await Promise.all([loadMetrics(), loadEvents()]);
          }),
        ),
      );
      actions(historyBox).append(
        button("Filtrar histórico", () =>
          run(async () => {
            eventPage = 1;
            await loadEvents();
          }),
        ),
      );
      await Promise.all([loadMetrics(), loadEvents()]);
    }

    function possibilities(parent) {
      const box = card(parent, "Possibilidades para decisão futura");
      box.append(
        el(
          "p",
          "Referência de preços e condições consultada em 22/10/2026. Estas opções não ativam serviços.",
          "cl-muted",
        ),
      );
      const entries = [
        [
          "Manter como está",
          "Protege contra e-mail falso; não exige mudança.",
          "Nenhuma dependência ou risco adicional.",
          "Custo zero.",
          "RFC 7505",
          "https://www.rfc-editor.org/rfc/rfc7505",
        ],
        [
          "Recebimento com encaminhamento",
          "Cloudflare Email Routing encaminha endereços para caixas existentes; não oferece caixa postal.",
          "Exige remover o MX nulo, publicar os registros da Cloudflare e verificar destinos. O encaminhamento pode falhar no SPF e DMARC do remetente.",
          "Recebimento ilimitado nos planos Free e Paid; até 200 regras por domínio, 200 destinos verificados por conta e 25 MiB por mensagem.",
          "Limites do Email Routing",
          "https://developers.cloudflare.com/email-routing/limits/",
        ],
        [
          "Envio transacional pelo Resend",
          "Reaproveita a integração do csv-mail.",
          "Exige DKIM e SPF. O MX nulo não pode permanecer no domínio remetente: usar subdomínio de envio ou retirar o MX nulo. Domínio novo precisa construir reputação.",
          "Free: US$ 0, 3.000/mês, 100/dia e 3 domínios. Pro: US$ 20/mês, 50.000 e-mails e 10 domínios. Plano atual da conta não verificado.",
          "Preços do Resend",
          "https://resend.com/pricing",
        ],
        [
          "Envio pela Cloudflare Email Service",
          "Mantém o envio na conta dos Workers.",
          "Exige Workers Paid e autenticação. Vale a mesma restrição do MX nulo. Cota inicial conservadora.",
          "3.000/mês incluídos por conta; US$ 0,35 por 1.000 excedentes. Envio a endereços verificados gratuito.",
          "Email Service",
          "https://developers.cloudflare.com/email-service/",
        ],
        [
          "Caixas postais no Google Workspace",
          "Oferece caixas completas.",
          "Exige configuração no Workspace e MX do Google; há custo por usuário. Uso como domínio secundário ou alias na conta atual não verificado.",
          "Starter: US$ 7; Standard: US$ 14; Plus: US$ 22 por usuário/mês, sem impostos.",
          "Preços do Google Workspace",
          "https://workspace.google.com/intl/pt-BR/pricing.html",
        ],
      ];
      for (const [name, benefit, dependencies, cost, source, href] of entries) {
        const item = card(box, name);
        item.append(el("p", benefit), el("p", dependencies), el("p", cost));
        external(item, source, href);
      }
    }

    async function email() {
      const current = start("csv.email");
      let data = await api("/email-prep");
      let draftVersion = data.version;
      if (!active(current)) return;
      view.replaceChildren(
        el("h2", "csv.email"),
        el(
          "p",
          "Área de preparação. Salvar decisões não ativa site, envio, recebimento ou caixas postais. Não informe credenciais.",
          "cl-muted",
        ),
      );
      const form = el("form", "", "cl-card");
      view.append(form);
      const purpose = textarea(
        form,
        "Finalidade pretendida",
        data.purpose,
        2000,
      );
      const briefing = textarea(
        form,
        "Notas de briefing",
        data.briefing,
        10000,
      );
      const purposeConfirmed = checkbox(
        form,
        "Finalidade confirmada por Guilherme Thomé",
        data.checklist?.purpose?.status === "verificado",
      );
      const decisionsBox = card(form, "Decisões pendentes");
      const decisionFields = [];
      function addDecision(value = {}) {
        const box = card(decisionsBox, "Decisão");
        const title = field(
          box,
          "Título da decisão",
          "text",
          value.title || "",
        );
        title.required = true;
        title.maxLength = 200;
        const options = textarea(
          box,
          "Opções (uma por linha)",
          (value.options || []).join("\n"),
          10020,
        );
        const status = select(
          box,
          "Situação da decisão",
          [
            ["pendente", "Pendente"],
            ["decidida", "Decidida"],
          ],
          value.status || "pendente",
        );
        const decision = textarea(box, "Decisão tomada", value.decision, 2000);
        const dateInput = field(
          box,
          "Data da decisão",
          "date",
          value.date ? String(value.date).slice(0, 10) : "",
        );
        const entry = { box, title, options, status, decision, dateInput };
        decisionFields.push(entry);
        actions(box).append(
          button("Remover decisão", () => {
            decisionFields.splice(decisionFields.indexOf(entry), 1);
            box.remove();
          }),
        );
      }
      (data.pending_decisions || []).forEach(addDecision);
      actions(decisionsBox).append(
        button("Adicionar decisão", () => {
          if (decisionFields.length >= 100) {
            notice("Informe no máximo 100 decisões.");
            return;
          }
          addDecision();
        }),
      );
      const save = el("button", "Salvar preparação", "cl-button cl-primary");
      save.type = "submit";
      actions(form).append(save);
      const saved = el(
        "p",
        `Versão ${data.version} · Atualizado em ${date(data.updated_at)}`,
        "cl-muted",
      );
      form.append(saved);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        run(async () => {
          const pending = decisionFields.map((entry) => {
            const options = entry.options.value
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean);
            if (
              options.length > 20 ||
              options.some((value) => Array.from(value).length > 500)
            )
              throw new Error(
                "Cada decisão aceita até 20 opções, com até 500 caracteres por opção.",
              );
            if (
              entry.status.value === "decidida" &&
              (!entry.decision.value.trim() || !entry.dateInput.value)
            )
              throw new Error("Uma decisão concluída precisa de texto e data.");
            return {
              title: entry.title.value,
              options,
              status: entry.status.value,
              decision: entry.decision.value,
              date: entry.dateInput.value || null,
            };
          });
          save.disabled = true;
          try {
            data = await api("/email-prep", {
              method: "PUT",
              body: {
                expected_version: draftVersion,
                purpose: purpose.value,
                briefing: briefing.value,
                pending_decisions: pending,
                checklist: {
                  purpose: {
                    status: purposeConfirmed.checked
                      ? "verificado"
                      : "pendente",
                  },
                },
              },
            });
            draftVersion = data.version;
            saved.textContent = `Versão ${data.version} · Atualizado em ${date(data.updated_at)}`;
            renderChecklist();
            notice("Preparação salva. Nenhum serviço foi ativado.", "success");
          } catch (error) {
            if (error.status === 409) {
              notice(
                `Outra pessoa alterou esta área. Recarregue antes de salvar. Nada foi gravado.${error.requestId ? ` Referência: ${error.requestId}` : ""}`,
              );
              saved.replaceChildren(
                el("span", "Revise a versão atual antes de tentar novamente. "),
                button("Recarregar csv.email", () => run(email)),
              );
            } else throw error;
          } finally {
            save.disabled = false;
          }
        });
      });
      const checklistBox = card(view, "Checklist de preparação");
      const checklistOutput = el("div");
      checklistBox.append(checklistOutput);
      const checklistLabels = {
        ns: "Zona ativa e nameservers da conta",
        mx: "MX nulo (0 .)",
        spf: "SPF v=spf1 -all",
        dmarc: "DMARC p=reject",
        purpose: "Finalidade definida",
        site: "Site no csv.email",
        receiving: "Recebimento ou encaminhamento",
        sending: "Envio",
        mailboxes: "Caixas postais",
        dkim: "DKIM",
      };
      function renderChecklist() {
        checklistOutput.replaceChildren();
        table(
          checklistOutput,
          ["Item", "Situação", "Verificação e método"],
          Object.entries(checklistLabels).map(([key, label]) => {
            const item = data.checklist?.[key] || { status: "pendente" };
            const details = [
              item.at ? date(item.at) : null,
              item.method,
              item.note,
              ...(item.values || []),
            ]
              .filter(Boolean)
              .join(" · ");
            return [
              label,
              statusLabels[item.status] || "Pendente",
              details || "Ainda não verificado",
            ];
          }),
        );
      }
      renderChecklist();
      actions(checklistBox).append(
        button("Verificar configuração DNS", () =>
          run(async () => {
            data = await api("/email-prep/verify");
            renderChecklist();
            saved.replaceChildren(
              el(
                "span",
                `Checklist atualizado em ${date(data.updated_at)}. Os campos em edição continuam baseados na versão ${draftVersion}. `,
              ),
              button("Recarregar csv.email", () => {
                if (
                  window.confirm(
                    "Recarregar a área e descartar as alterações ainda não salvas?",
                  )
                )
                  return email();
              }),
            );
            notice(
              "Verificação concluída. Confira a situação e o método de cada item.",
              "success",
            );
          }),
        ),
      );
      possibilities(view);
    }

    return { overview, domains, metrics, email };
  };
})();
