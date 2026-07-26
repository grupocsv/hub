import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const GENERATOR = join(REPO_ROOT, "scripts", "generate-documentos-config.mjs");

const VALID_CONFIG = Object.freeze({
  schemaVersion: 1,
  enabled: false,
  apiBaseUrl: null,
  enabledPortals: [],
  features: {
    favorites: true,
    offline: false,
    upload: false,
    viewer: false,
  },
});

const EMPTY_REGISTRY = Object.freeze({
  schemaVersion: 1,
  tenants: [],
});

const SHELL_TEMPLATE = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <meta http-equiv="Content-Security-Policy" content="__DOCUMENTOS_CSP__">
    <title>Documentos | Grupo CSV</title>
  </head>
  <body>
    <main id="app"></main>
    <script src="./assets/runtime-config.js" integrity="__DOCUMENTOS_RUNTIME_INTEGRITY__" crossorigin="anonymous"></script>
  </body>
</html>
`;

async function createFixture({
  config = VALID_CONFIG,
  registry = EMPTY_REGISTRY,
  template = SHELL_TEMPLATE,
  includeConfig = true,
} = {}) {
  const root = await mkdtemp(join(tmpdir(), "hub-documentos-config-"));
  await mkdir(join(root, "scripts"), { recursive: true });
  await mkdir(join(root, "docs", "public"), { recursive: true });

  if (includeConfig) {
    await writeJson(
      join(root, "scripts", "documentos-runtime-config.json"),
      config,
    );
  }
  await writeJson(join(root, "scripts", "documentos-tenants.json"), registry);
  await writeFile(
    join(root, "scripts", "documentos-shell.template.html"),
    template,
    "utf8",
  );

  return root;
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runGenerator(root, extraEnv = {}) {
  return spawnSync(process.execPath, [GENERATOR, "--root", root], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
}

async function readGeneratedSet(root) {
  const base = join(root, "docs", "public", "documentos");
  return {
    runtime: await readFile(join(base, "assets", "runtime-config.js"), "utf8"),
    shell: await readFile(join(base, "index.html"), "utf8"),
  };
}

function sha384(value) {
  return `sha384-${createHash("sha384").update(value).digest("base64")}`;
}

function parseRuntimeConfig(runtime) {
  const prefix = "globalThis.HUB_DOCUMENTOS_CONFIG = Object.freeze(";
  assert.ok(
    runtime.startsWith(prefix),
    "artefato deve expor somente o objeto público esperado",
  );
  assert.ok(
    runtime.endsWith(");\n"),
    "artefato deve terminar de forma determinística",
  );
  return JSON.parse(runtime.slice(prefix.length, -3));
}

async function withFixture(options, callback) {
  const root = await createFixture(options);
  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("falha fechado quando a fonte versionada da configuração está ausente", async () => {
  await withFixture({ includeConfig: false }, async (root) => {
    const result = runGenerator(root);

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /configuração versionada.*ausente/i,
    );
  });
});

test("gera runtime config e shell com SRI SHA-384 e CSP coerentes", async () => {
  await withFixture({}, async (root) => {
    const result = runGenerator(root);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

    const generated = await readGeneratedSet(root);
    const integrity = sha384(generated.runtime);
    const config = parseRuntimeConfig(generated.runtime);

    assert.deepEqual(config, VALID_CONFIG);
    assert.match(
      generated.shell,
      new RegExp(
        `integrity="${integrity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
      ),
    );
    assert.match(generated.shell, /crossorigin="anonymous"/);
    assert.match(
      generated.shell,
      new RegExp(
        `script-src[^\"]*'${integrity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`,
      ),
    );
    assert.doesNotMatch(generated.shell, /style-src[^"]*'unsafe-inline'/);
    assert.doesNotMatch(
      generated.shell,
      /__DOCUMENTOS_(?:CSP|RUNTIME_INTEGRITY)__/,
    );
  });
});

test("features.search é opcional com default seguro e preserva true quando declarado", async () => {
  await withFixture({}, async (root) => {
    const result = runGenerator(root);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const generated = parseRuntimeConfig((await readGeneratedSet(root)).runtime);
    assert.equal(Object.hasOwn(generated.features, "search"), false);
  });

  await withFixture(
    {
      config: {
        ...VALID_CONFIG,
        features: { ...VALID_CONFIG.features, search: true },
      },
    },
    async (root) => {
      const result = runGenerator(root);
      assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
      const generated = parseRuntimeConfig((await readGeneratedSet(root)).runtime);
      assert.equal(generated.features.search, true);
    },
  );
});

test("CSP habilitada permite somente API documental e origem pública do Hub Auth", async () => {
  const config = {
    ...VALID_CONFIG,
    enabled: true,
    apiBaseUrl: "https://hub.grupocsv.com",
    enabledPortals: ["unimed"],
  };
  const registry = {
    schemaVersion: 1,
    tenants: [{ portal: "unimed", enabled: true, href: "/documentos/" }],
  };

  await withFixture({ config, registry }, async (root) => {
    const result = runGenerator(root);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const { shell } = await readGeneratedSet(root);
    const csp = shell.match(
      /http-equiv="Content-Security-Policy" content="([^"]+)"/,
    )?.[1];
    assert.ok(csp);
    const connectSources = csp
      .split("; ")
      .find((directive) => directive.startsWith("connect-src "))
      ?.split(" ")
      .slice(1);

    assert.deepEqual(connectSources, [
      "'self'",
      "https://hub.grupocsv.com",
      "https://csv-auth.guilherme-thom.workers.dev",
    ]);
    assert.doesNotMatch(
      csp,
      /frame-ancestors/,
      "frame-ancestors não produz proteção quando entregue por meta CSP",
    );
  });
});

test("produz exatamente os mesmos artefatos em execuções consecutivas", async () => {
  await withFixture({}, async (root) => {
    const first = runGenerator(root);
    assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
    const firstSet = await readGeneratedSet(root);

    const second = runGenerator(root);
    assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`);
    const secondSet = await readGeneratedSet(root);

    assert.deepEqual(secondSet, firstSet);
  });
});

test("normaliza LF e CRLF para o mesmo shell gerado", async () => {
  let shellLf;
  await withFixture({ template: SHELL_TEMPLATE }, async (root) => {
    const result = runGenerator(root);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    shellLf = (await readGeneratedSet(root)).shell;
  });
  await withFixture(
    { template: SHELL_TEMPLATE.replaceAll("\n", "\r\n") },
    async (root) => {
      const result = runGenerator(root);
      assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
      assert.equal((await readGeneratedSet(root)).shell, shellLf);
    },
  );
});

test("ignora variável de ambiente como fonte da base da API", async () => {
  await withFixture({}, async (root) => {
    const injected = "https://nao-confiavel.example/api";
    const result = runGenerator(root, { DOCUMENTOS_API_BASE_URL: injected });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

    const generated = await readGeneratedSet(root);
    assert.doesNotMatch(generated.runtime, /nao-confiavel\.example/);
    assert.equal(parseRuntimeConfig(generated.runtime).apiBaseUrl, null);
  });
});

for (const [name, config, expected] of [
  [
    "origem HTTP",
    { ...VALID_CONFIG, enabled: true, apiBaseUrl: "http://documents.example" },
    /origem HTTPS permitida/i,
  ],
  [
    "origem HTTPS fora da allowlist",
    {
      ...VALID_CONFIG,
      enabled: true,
      apiBaseUrl: "https://nao-confiavel.example",
    },
    /origem HTTPS permitida/i,
  ],
  [
    "origem com credencial embutida",
    {
      ...VALID_CONFIG,
      enabled: true,
      apiBaseUrl: "https://usuario:senha@hub.grupocsv.com",
    },
    /URL pública inválida/i,
  ],
  [
    "origem com query",
    {
      ...VALID_CONFIG,
      enabled: true,
      apiBaseUrl: "https://hub.grupocsv.com?token=segredo",
    },
    /URL pública inválida/i,
  ],
  [
    "origem com fragmento",
    {
      ...VALID_CONFIG,
      enabled: true,
      apiBaseUrl: "https://hub.grupocsv.com/#segredo",
    },
    /URL pública inválida/i,
  ],
]) {
  test(`rejeita ${name}`, async () => {
    await withFixture({ config }, async (root) => {
      const result = runGenerator(root);

      assert.notEqual(result.status, 0);
      assert.match(`${result.stdout}\n${result.stderr}`, expected);
    });
  });
}

test("rejeita portal habilitado que não esteja no registro declarativo", async () => {
  await withFixture(
    { config: { ...VALID_CONFIG, enabledPortals: ["unimed"] } },
    async (root) => {
      const result = runGenerator(root);

      assert.notEqual(result.status, 0);
      assert.match(
        `${result.stdout}\n${result.stderr}`,
        /portal.*não registrado/i,
      );
    },
  );
});

test("rejeita campos que poderiam transportar tenant ou token pelo frontend", async () => {
  await withFixture(
    {
      config: {
        ...VALID_CONFIG,
        tenant_id: "unimed",
        token: "não-deve-existir",
      },
    },
    async (root) => {
      const result = runGenerator(root);

      assert.notEqual(result.status, 0);
      assert.match(
        `${result.stdout}\n${result.stderr}`,
        /campo.*não permitido/i,
      );
    },
  );
});

test("mantém o conjunto canônico intacto quando a geração falha antes da promoção", async () => {
  await withFixture({}, async (root) => {
    const first = runGenerator(root);
    assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
    const previous = await readGeneratedSet(root);

    await writeJson(join(root, "scripts", "documentos-runtime-config.json"), {
      ...VALID_CONFIG,
      features: { ...VALID_CONFIG.features, upload: false },
    });
    await writeFile(
      join(root, "scripts", "documentos-shell.template.html"),
      SHELL_TEMPLATE.replace("__DOCUMENTOS_CSP__", "marcador-removido"),
      "utf8",
    );

    const failed = runGenerator(root);
    assert.notEqual(failed.status, 0);
    assert.match(`${failed.stdout}\n${failed.stderr}`, /marcador.*CSP/i);

    const current = await readGeneratedSet(root);
    assert.deepEqual(current, previous);
  });
});

test("executa a geração versionada antes do build do Hub", async () => {
  const packageJson = JSON.parse(
    await readFile(join(REPO_ROOT, "package.json"), "utf8"),
  );
  const workflow = await readFile(
    join(REPO_ROOT, ".github", "workflows", "deploy.yml"),
    "utf8",
  );
  const downstreamWorkflow = await readFile(
    join(REPO_ROOT, ".github", "workflows", "sync-r2-ai-search.yml"),
    "utf8",
  );
  const attributes = await readFile(join(REPO_ROOT, ".gitattributes"), "utf8");

  assert.equal(
    packageJson.scripts["documentos:generate"],
    "npm run documentos:vendor && node scripts/generate-documentos-config.mjs",
  );
  assert.equal(
    packageJson.scripts["documentos:test"],
    "npm run documentos:vendor && node --test tests/documentos/*.test.mjs tests/hub-auth-corporate.test.mjs",
  );
  assert.equal(
    packageJson.scripts["documentos:vendor"],
    "node scripts/vendor-documentos-pdfjs.mjs",
  );
  assert.equal(packageJson.engines.node, ">=22.13.0 <25");
  assert.match(workflow, /node-version:\s*22\.13\.0/);
  assert.match(workflow, /pull_request:\s*\n\s+branches:\s*\[main\]/);
  assert.match(
    workflow,
    /permissions:\s*\n\s+contents:\s*read\s*\n\s*\nconcurrency:/,
  );
  assert.match(
    workflow,
    /group:\s*\$\{\{\s*github\.event_name == 'pull_request'.*hub-documentos-pr-\{0\}.*\|\| 'pages'\s*\}\}/,
  );

  const generationStep = workflow.indexOf("npm run documentos:generate");
  const driftStep = workflow.indexOf("Reject generated artifact drift");
  const buildStep = workflow.indexOf("npm run docs:build");
  const manifestStep = workflow.indexOf(
    "node scripts/verify-documentos-pdfjs-manifest.mjs docs/.vitepress/dist",
  );
  const e2eStep = workflow.indexOf("npm run documentos:e2e");
  assert.ok(
    generationStep >= 0,
    "workflow deve gerar a configuração do Hub Documentos",
  );
  assert.ok(
    driftStep >= 0,
    "workflow deve rejeitar drift dos artefatos gerados",
  );
  assert.ok(buildStep >= 0, "workflow deve manter o build VitePress");
  assert.ok(
    manifestStep >= 0,
    "workflow deve validar integralmente o PDF.js publicado",
  );
  assert.ok(e2eStep >= 0, "workflow deve executar a suíte E2E");
  assert.ok(
    generationStep < buildStep,
    "geração segura deve ocorrer antes do build",
  );
  assert.ok(generationStep < driftStep && driftStep < buildStep);
  assert.ok(buildStep < manifestStep && manifestStep < e2eStep);
  assert.match(
    workflow,
    /DOCUMENTOS_E2E_PUBLIC_ROOT:\s*docs\/\.vitepress\/dist/,
  );
  assert.match(
    workflow,
    /Upload artifact\s*\n\s+if:\s*\$\{\{\s*github\.event_name != 'pull_request'\s*\}\}/,
  );
  assert.match(
    workflow,
    /deploy:\s*\n\s+if:\s*\$\{\{\s*github\.event_name == 'workflow_dispatch' \|\| \(github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'\)\s*\}\}\s*\n\s+permissions:\s*\n\s+contents:\s*read\s*\n\s+pages:\s*write\s*\n\s+id-token:\s*write/,
  );
  assert.match(
    downstreamWorkflow,
    /github\.event\.workflow_run\.event == 'push'/,
  );
  assert.match(
    downstreamWorkflow,
    /github\.event\.workflow_run\.event == 'workflow_dispatch'/,
  );
  assert.match(
    downstreamWorkflow,
    /github\.event\.workflow_run\.head_branch == 'main'/,
  );
  assert.match(
    downstreamWorkflow,
    /github\.event\.workflow_run\.head_repository\.full_name == github\.repository/,
  );
  assert.match(
    downstreamWorkflow,
    /ref:\s*\$\{\{\s*github\.event_name == 'workflow_run' && github\.event\.workflow_run\.head_sha \|\| github\.sha\s*\}\}/,
  );
  assert.doesNotMatch(downstreamWorkflow, /rclone\.org\/install\.sh/);
  assert.match(downstreamWorkflow, /RCLONE_VERSION="1\.74\.4"/);
  assert.match(
    downstreamWorkflow,
    /RCLONE_SHA256="fe435e0c36228e7c2f116a8701f01127bb1f694005fc11d1f27186c8bca4115d"/,
  );
  assert.match(downstreamWorkflow, /sha256sum --check --strict/);
  for (const criticalArtifact of [
    "documentos/index.html",
    "documentos/assets/api-client.js",
    "documentos/assets/app.js",
    "documentos/assets/catalog.js",
    "documentos/assets/detail.js",
    "documentos/assets/documentos.css",
    "documentos/assets/runtime-config.js",
    "documentos/assets/session.js",
    "documentos/assets/upload.js",
    "documentos/assets/view.js",
    "documentos/assets/viewer.js",
    "documentos/assets/workspace.js",
    "documentos/vendor/pdfjs/LICENSE",
    "documentos/vendor/pdfjs/manifest.json",
    "documentos/vendor/pdfjs/build/pdf.min.mjs",
    "documentos/vendor/pdfjs/build/pdf.worker.min.mjs",
  ]) {
    assert.match(workflow, new RegExp(criticalArtifact.replaceAll(".", "\\.")));
  }
  assert.match(
    workflow,
    /noindex, nofollow ausente em documentos\/index\.html/,
  );
  assert.match(workflow, /CSP ausente em documentos\/index\.html/);
  assert.match(workflow, /CSP permissiva em documentos\/index\.html/);
  assert.match(workflow, /bloqueio de contexto enquadrado ausente/);
  assert.match(attributes, /\/docs\/public\/documentos\/\*\* text eol=lf/);
  assert.match(attributes, /\/package-lock\.json -text whitespace=cr-at-eol/);
  assert.match(attributes, /\/scripts\/hub-auth\.js text eol=lf/);
  assert.match(attributes, /\/tests\/documentos\/\*\* text eol=lf/);
});
