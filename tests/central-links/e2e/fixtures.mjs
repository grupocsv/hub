import { expect } from "@playwright/test";

export const NOW = "2026-10-22T15:00:00.000Z";
export const REQUEST_ID = "requisicao-simulada";
const actor = "admin@exemplo.com";
const oldDate = "2026-10-20T15:00:00.000Z";

function destination(id, url, label = "Conteúdo publicado") {
  return {
    id: `destino-${id}`,
    link_id: id,
    url,
    label,
    source: "manual",
    blog_post_id: null,
    valid_from: oldDate,
    valid_to: null,
    created_by: actor,
    publish_check_id: "teste-inicial",
    published_despite_failure: 0,
    reason: null,
  };
}
function link(id, slug, kind) {
  const current = destination(id, `https://grupocsv.com/blog/${slug}`);
  return {
    id,
    domain: "csv.online",
    slug,
    kind,
    title: kind === "rotativo" ? "Post do momento" : "Manual de referência",
    notes: "Conteúdo de exemplo.",
    preview_description: null,
    routing_enabled: 1,
    archived_at: null,
    expires_at: null,
    current_destination_id: current.id,
    version: 1,
    created_at: oldDate,
    created_by: actor,
    updated_at: oldDate,
    updated_by: actor,
    deleted_at: null,
    deleted_by: null,
    destination: current,
    tags: ["institucional"],
    published_at: oldDate,
    last_check: {
      url: current.url,
      at: oldDate,
      trigger: "diario",
      status: "ok",
      http_status: 200,
      final_url: current.url,
      redirects: 0,
      has_og_image: 1,
      og_title: "Conteúdo publicado",
      error_code: null,
    },
  };
}
export function createState(options = {}) {
  const links = [
    link("rotativo-blog", "blog", "rotativo"),
    link("estatico-manual", "manual", "estatico"),
  ];
  return {
    role: options.role || "admin",
    links,
    requests: [],
    external: [],
    unhandled: [],
    errors: [],
    consoleErrors: [],
    failures: new Map(),
    checkFailure: false,
    healthFailure: false,
    credentialWarning: false,
    provisional: false,
    publicVersion: 50,
    histories: new Map(
      links.map((item) => [item.id, [structuredClone(item.destination)]]),
    ),
    events: [
      {
        id: "evento-inicial",
        link_id: links[0].id,
        type: "criado",
        actor_email: actor,
        at: oldDate,
        from_version: null,
        to_version: 1,
        payload: "{}",
      },
    ],
    email: {
      domain: "csv.email",
      purpose: "",
      briefing: "",
      pending_decisions: [],
      checklist: {
        ns: { status: "pendente" },
        mx: { status: "pendente" },
        spf: { status: "pendente" },
        dmarc: { status: "pendente" },
        purpose: { status: "pendente" },
        site: { status: "nao_configurado" },
        receiving: { status: "nao_configurado" },
        sending: { status: "nao_configurado" },
        mailboxes: { status: "nao_configurado" },
        dkim: { status: "nao_configurado" },
      },
      version: 1,
      updated_at: oldDate,
      updated_by: actor,
    },
    ...options,
  };
}
export async function mockApi(page, options = {}) {
  const state = createState(options);
  await page.clock.setFixedTime(new Date(NOW));
  await page.addInitScript(() => {
    localStorage.setItem("hub_auth_admin_token", "sessao-admin-simulada");
    localStorage.setItem("hub_auth_admin_email", "admin@exemplo.com");
    localStorage.setItem("hub_auth_admin_expires", "2099-01-01T00:00:00.000Z");
    localStorage.setItem("op_admin_token", "sessao-open-pages-distinta");
  });
  page.on("pageerror", (error) => state.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      state.consoleErrors.push(message.text() + " " + message.location().url);
  });
  const detail = (item) => ({
    ...item,
    propagation: {
      status: "em_propagacao",
      published_at: item.published_at,
      confirm_after_seconds: 90,
      version: item.version,
      verification_path: `/_csv/v/${item.slug}`,
    },
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json; charset=utf-8",
        headers: {
          "Cache-Control": "no-store",
          "X-Request-Id": REQUEST_ID,
          "Access-Control-Allow-Origin":
            request.headers().origin || "http://127.0.0.1:4182",
        },
        body: JSON.stringify(body),
      });
    if (url.origin === "http://127.0.0.1:4182") {
      if (url.pathname === "/p/registry.json") return json({ links: [] });
      return route.continue();
    }
    state.external.push(url.origin + url.pathname);
    if (url.hostname === "csv.online" || url.hostname === "pre.csv.online") {
      if (url.pathname === "/_csv/health")
        return state.healthFailure
          ? route.abort("failed")
          : json({
              service: "csv-links",
              version: "teste",
              d1: "ok",
              kv: "ok",
            });
      if (url.pathname.startsWith("/_csv/v/")) {
        if (state.provisional && url.hostname === "csv.online")
          return route.fulfill({
            status: 302,
            headers: {
              Location: "https://grupocsv.com/",
              "Cache-Control": "no-store",
            },
          });
        return json({
          slug: url.pathname.split("/").at(-1),
          found: true,
          version: state.publicVersion,
          routing_enabled: true,
          written_at: NOW,
        });
      }
    }
    if (url.hostname !== "links-api.grupocsv.com") {
      if (request.resourceType() === "image")
        return route.fulfill({
          status: 200,
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
        });
      if (request.resourceType() === "stylesheet")
        return route.fulfill({
          status: 200,
          contentType: "text/css",
          body: "",
        });
      if (request.resourceType() === "script")
        return route.fulfill({
          status: 200,
          contentType: "text/javascript",
          body: "",
        });
      return json({
        users: [],
        requests: [],
        admins: [],
        items: [],
        logs: [],
        results: [],
        data: [],
        assets: [],
        files: [],
        documents: [],
        pages: [],
        keys: [],
        memories: [],
        feedbacks: [],
        stats: {},
        portals: [],
        tenants: [],
        editions: [],
      });
    }
    const pathname = url.pathname.slice(3);
    const body = request.postData() ? JSON.parse(request.postData()) : {};
    state.requests.push({
      path: pathname,
      method,
      body,
      params: Object.fromEntries(url.searchParams),
      token: request.headers()["x-auth-token"],
      authorization: request.headers().authorization,
    });
    const failure = state.failures.get(`${method} ${pathname}`);
    if (failure) {
      if (failure.once !== false)
        state.failures.delete(`${method} ${pathname}`);
      return json(
        {
          error: failure.code,
          message: failure.message,
          request_id: REQUEST_ID,
          ...failure.extra,
        },
        failure.status,
      );
    }
    if (pathname === "/me") return json({ email: actor, role: state.role });
    if (pathname === "/health")
      return json({
        service: "csv-links",
        version: "teste",
        d1: "ok",
        kv: "ok",
      });
    if (pathname === "/metrics/overview")
      return json({
        from: "2026-09-23",
        to: "2026-10-22",
        clicks_last_7_days: 17,
        clicks_last_30_days: 80,
        recent_events: state.events.slice(0, 10),
        daily_failures: [],
        totals: [{ traffic: "clique", count: 80 }],
        top_links: [{ link_id: "rotativo-blog", slug: "blog", count: 80 }],
        links: ["rotativo", "estatico"].map((kind) => ({
          kind,
          total: state.links.filter((item) => item.kind === kind).length,
          active: 1,
          disabled: 0,
          expired: 0,
        })),
        jobs: [{ job: "teste_diario", last_success: oldDate }],
      });
    if (pathname === "/events")
      return json({
        events: state.events,
        total: state.events.length,
        page: 1,
        page_size: 25,
      });
    if (pathname === "/blog/posts")
      return json([
        {
          id: 7,
          slug: "cuidado",
          title: "Organizar o cuidado",
          publishedAt: Date.parse(oldDate),
          url: "https://grupocsv.com/blog/cuidado",
        },
      ]);
    if (pathname === "/domains")
      return json({
        at: NOW,
        domains: ["csv.online", "www.csv.online", "csv.email"].map(
          (domain) => ({
            domain,
            ...Object.fromEntries(
              ["ns", "mx", "spf", "dmarc", "a", "aaaa"].map((type) => [
                type,
                {
                  status: "ok",
                  values:
                    type === "mx"
                      ? ["0 ."]
                      : type === "spf"
                        ? ["v=spf1 -all"]
                        : type === "dmarc"
                          ? ["v=DMARC1; p=reject"]
                          : [],
                  error_code: null,
                },
              ]),
            ),
          }),
        ),
      });
    if (pathname.startsWith("/slugs/"))
      return json({
        available: !state.links.some((item) =>
          pathname.includes(`/${item.slug}/`),
        ),
        reason: state.links.some((item) => pathname.includes(`/${item.slug}/`))
          ? "em_uso"
          : null,
      });
    if (pathname === "/checks")
      return json({
        url: body.url,
        at: NOW,
        status: state.checkFailure ? "falhou" : "ok",
        http_status: state.checkFailure ? 500 : 200,
        final_url: body.url,
        redirects: 0,
        has_og_image: !state.checkFailure,
        og_title: "Prévia de exemplo",
        error_code: state.checkFailure ? "http_5xx" : null,
        id: "teste-novo",
        check_id: "teste-novo",
        credential_warning: state.credentialWarning,
      });
    if (pathname === "/email-prep/verify") {
      for (const key of ["mx", "spf", "dmarc"])
        state.email.checklist[key] = {
          status: "verificado",
          at: NOW,
          method: "DNS sobre HTTPS",
          values: [],
        };
      state.email.version++;
      return json(state.email);
    }
    if (pathname === "/email-prep") {
      if (method === "PUT") {
        if (body.expected_version !== state.email.version)
          return json(
            {
              error: "version_conflict",
              message:
                "Outra pessoa alterou esta área. Recarregue antes de salvar.",
              request_id: REQUEST_ID,
              current_version: state.email.version,
              current: state.email,
            },
            409,
          );
        const { expected_version, checklist, ...fields } = body;
        Object.assign(state.email, fields, {
          version: expected_version + 1,
          checklist: { ...state.email.checklist, ...checklist },
        });
      }
      return json(state.email);
    }
    if (pathname.startsWith("/admin/") && state.role !== "superadmin")
      return json(
        {
          error: "forbidden",
          message: "Esta operação exige o papel de superadmin.",
          request_id: REQUEST_ID,
        },
        403,
      );
    if (pathname === "/admin/rebuild-kv")
      return json({ written: state.links.length, deleted: 0 });
    if (pathname === "/admin/export")
      return json({
        format: "csv-links",
        schema_version: 1,
        links: state.links,
        exported_at: NOW,
      });
    if (pathname === "/links" && method === "GET") {
      const status = url.searchParams.get("status");
      let items = state.links.filter((item) =>
        status === "excluido"
          ? item.deleted_at
          : !item.deleted_at &&
            (status === "arquivado" ? item.archived_at : !item.archived_at),
      );
      if (status === "ativo")
        items = items.filter(
          (item) =>
            item.routing_enabled && (!item.expires_at || item.expires_at > NOW),
        );
      if (status === "desativado")
        items = items.filter((item) => !item.routing_enabled);
      if (status === "expirado")
        items = items.filter(
          (item) => item.expires_at && item.expires_at <= NOW,
        );
      if (status === "com_falha")
        items = items.filter((item) => item.last_check?.status === "falhou");
      for (const key of ["kind"])
        if (url.searchParams.get(key))
          items = items.filter(
            (item) => item[key] === url.searchParams.get(key),
          );
      if (url.searchParams.get("q"))
        items = items.filter((item) =>
          `${item.slug} ${item.title} ${item.destination.url}`.includes(
            url.searchParams.get("q"),
          ),
        );
      if (url.searchParams.has("tag"))
        items = items.filter((item) =>
          item.tags.includes(url.searchParams.get("tag")),
        );
      const pageNumber = Number(url.searchParams.get("page") || 1);
      const pageSize = Number(url.searchParams.get("page_size") || 25);
      return json({
        links: items
          .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
          .map(({ destination: dest, last_check, tags, ...item }) => ({
            ...item,
            url: dest.url,
            destination_label: dest.label,
            destination_source: dest.source,
            destination_blog_post_id: dest.blog_post_id,
            last_check_status: last_check?.status ?? null,
            last_check_at: last_check?.at ?? null,
          })),
        total: items.length,
        page: pageNumber,
        page_size: pageSize,
      });
    }
    if (pathname === "/links" && method === "POST") {
      const item = {
        ...link("link-novo", body.slug, body.kind),
        title: body.title,
        notes: body.notes || "",
        tags: body.tags || [],
        expires_at: body.expires_at || null,
        preview_description: body.preview_description || null,
        version: 1,
        published_at: NOW,
      };
      item.destination = {
        ...destination(item.id, body.destination.url, body.destination.label),
        ...body.destination,
        valid_from: NOW,
      };
      item.current_destination_id = item.destination.id;
      state.links.push(item);
      state.histories.set(item.id, [structuredClone(item.destination)]);
      return json({ ...detail(item), route_written: true }, 201);
    }
    const match = /^\/links\/([^/]+)(?:\/([^/]+))?$/.exec(pathname);
    if (match) {
      const item = state.links.find((entry) => entry.id === match[1]);
      if (!item)
        return json(
          {
            error: "link_not_found",
            message: "Link não encontrado.",
            request_id: REQUEST_ID,
          },
          404,
        );
      const action = match[2];
      if (action === "history") {
        const pageNumber = Number(url.searchParams.get("page") || 1),
          pageSize = Number(url.searchParams.get("page_size") || 25),
          offset = (pageNumber - 1) * pageSize;
        const events = state.events.filter(
          (event) => event.link_id === item.id,
        );
        return json({
          events: events.slice(offset, offset + pageSize),
          destinations: state.histories
            .get(item.id)
            .toReversed()
            .slice(offset, offset + pageSize),
          total: events.length,
          page: pageNumber,
          page_size: pageSize,
        });
      }
      if (action === "metrics") {
        const group = url.searchParams.get("group") || "day";
        const traffic = url.searchParams.get("traffic");
        const value = {
          day: "2026-10-21",
          destination: item.destination.id,
          country: "BR",
          source: "direto",
          campaign: "institucional",
        }[group];
        const rows = [
          { value, traffic: "clique", count: 12 },
          { value, traffic: "robo", count: 3 },
        ].filter((row) => !traffic || row.traffic === traffic);
        return json({
          from: url.searchParams.get("from"),
          to: url.searchParams.get("to"),
          group,
          approximate_bots: true,
          rows,
        });
      }
      if (method === "GET") return json(detail(item));
      if (
        (method === "DELETE" ||
          (item.kind === "estatico" &&
            ["destination", "restore"].includes(action))) &&
        state.role !== "superadmin"
      )
        return json(
          {
            error: "forbidden",
            message: "Esta operação exige o papel de superadmin.",
            request_id: REQUEST_ID,
          },
          403,
        );
      if (action === "rewrite-route")
        return json({ rewritten: true, version: item.version });
      if (body.expected_version !== item.version)
        return json(
          {
            error: "version_conflict",
            message:
              "Outra pessoa alterou este link enquanto você editava. Recarregue para ver a versão atual. Nada foi gravado.",
            request_id: REQUEST_ID,
            version: item.version,
            current: item,
          },
          409,
        );
      if (method === "PATCH") {
        const { expected_version, ...metadata } = body;
        Object.assign(item, metadata);
      }
      if (method === "DELETE") item.deleted_at = NOW;
      if (action === "disable" || action === "enable")
        item.routing_enabled = Number(action === "enable");
      if (action === "archive" || action === "unarchive")
        item.archived_at = action === "archive" ? NOW : null;
      if (action === "destination" || action === "restore") {
        const history = state.histories.get(item.id);
        history.at(-1).valid_to = NOW;
        const previous =
          action === "restore"
            ? history.find((dest) => dest.id === body.destination_id)
            : body;
        item.destination = {
          ...destination(item.id, previous.url, previous.label),
          ...previous,
          id: `destino-${item.id}-${item.version + 1}`,
          valid_from: NOW,
          valid_to: null,
          reason: body.reason || null,
        };
        item.current_destination_id = item.destination.id;
        item.published_at = NOW;
        history.push(structuredClone(item.destination));
      }
      item.version++;
      item.updated_at = NOW;
      state.events.unshift({
        id: `evento-${item.id}-${item.version}`,
        link_id: item.id,
        type: action === "restore" ? "destino_restaurado" : "destino_publicado",
        actor_email: actor,
        at: NOW,
        from_version: item.version - 1,
        to_version: item.version,
        payload: "{}",
      });
      return json({ ...detail(item), route_written: true });
    }
    state.unhandled.push(`${method} ${pathname}`);
    return json(
      {
        error: "not_found",
        message: "Operação não encontrada.",
        request_id: REQUEST_ID,
      },
      404,
    );
  });
  return state;
}
export async function openCentral(page) {
  await page.goto("/admin/");
  const menu = page.locator('.sidebar-item[data-tab="central-links"]');
  if (await page.locator("#sidebar-toggle").isVisible())
    await page.locator("#sidebar-toggle").click();
  await menu.click();
  await expect(page.locator("#centralLinks")).toBeVisible();
}
export async function section(page, name) {
  await page
    .locator("#centralLinks")
    .getByRole("button", { name, exact: true })
    .click();
}
export async function openDetail(page, kind = "Rotativos") {
  await section(page, kind);
  await page
    .locator("#centralLinks")
    .getByRole("button", { name: "Detalhes", exact: true })
    .first()
    .click();
}
export function assertRequests(state) {
  expect(state.unhandled).toEqual([]);
  expect(state.errors).toEqual([]);
  for (const request of state.requests) {
    expect(request.token).toBe("sessao-admin-simulada");
    expect(request.authorization).toBeUndefined();
  }
}
