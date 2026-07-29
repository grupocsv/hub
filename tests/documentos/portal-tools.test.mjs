import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const GENERATOR = join(REPO_ROOT, "scripts", "generate-portal-tools.py");
const PORTALS = Object.freeze(["unimed", "unihealth", "icds"]);
const RUNTIME_PORTALS = Object.freeze(["grupo-csv", ...PORTALS]);
const BASELINE_PURPOSE =
  "Congela integralmente a base não gerenciada; a Fase 9.7 apenas reconcilia o card Documentos.";
const BASELINE_AUTHORITY =
  "Git e revisão obrigatória são a âncora de autoridade; manifestSha256 é apenas checksum de integridade.";

const DISABLED_CONFIG = Object.freeze({
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

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalHash(value) {
  return sha256(JSON.stringify(canonical(value)));
}

function outputFor(
  portal,
  tools = [],
  generatedAt = "2026-07-01T00:00:00+00:00",
) {
  return {
    portal,
    generatedAt,
    totalTools: tools.length,
    tools,
  };
}

function externalTool(href, title, modified = "2026-06-01T00:00:00+00:00") {
  return {
    file: href,
    title,
    created: modified,
    lastModified: modified,
    external: true,
  };
}

function sourceDescriptor({ extras = null, overrides = null, html = [] } = {}) {
  return {
    extras,
    html: html
      .map((page) => ({
        ...page,
        source: page.source.replace(/\r\n?/g, "\n"),
      }))
      .sort((left, right) => left.file.localeCompare(right.file)),
    overrides,
  };
}

function isDocumentosCandidate(tool) {
  let file = typeof tool?.file === "string" ? tool.file : "";
  let isDocumentosRoute = false;
  try {
    file = file.replaceAll("\\", "/");
    for (let index = 0; index < 3; index += 1) {
      const decoded = decodeURIComponent(file);
      if (decoded === file) break;
      file = decoded;
    }
    const normalized = new URL(file, "https://hub.grupocsv.com").pathname
      .replace(/\/+/g, "/")
      .replace(/\/(?:\.\/)+/g, "/");
    const segments = [];
    for (const segment of normalized.split("/")) {
      if (!segment || segment === ".") continue;
      if (segment === "..") segments.pop();
      else segments.push(segment);
    }
    isDocumentosRoute = `/${segments.join("/")}` === "/documentos";
  } catch {
    isDocumentosRoute = false;
  }
  return (
    tool?.managedBy === "hub-documentos" ||
    tool?.title?.trim().toLocaleLowerCase("pt-BR") === "documentos" ||
    isDocumentosRoute
  );
}

function baselineManifest(portalState) {
  const manifest = {
    schemaVersion: 2,
    purpose: BASELINE_PURPOSE,
    integrityAuthority: BASELINE_AUTHORITY,
    portals: Object.fromEntries(
      PORTALS.map((portal) => {
        const state = portalState[portal];
        const unmanagedOutput = outputFor(
          portal,
          state.output.tools.filter((tool) => !isDocumentosCandidate(tool)),
          state.output.generatedAt,
        );
        return [
          portal,
          {
            sourceSha256: canonicalHash(sourceDescriptor(state)),
            unmanagedOutput,
            unmanagedOutputSha256: canonicalHash(unmanagedOutput),
          },
        ];
      }),
    ),
  };
  return {
    ...manifest,
    manifestSha256: canonicalHash(manifest),
  };
}

function baselineAnchor(manifest) {
  return {
    schemaVersion: 1,
    authority: BASELINE_AUTHORITY,
    baselineManifestSha256: manifest.manifestSha256,
  };
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function createFixture({
  config = DISABLED_CONFIG,
  registry = EMPTY_REGISTRY,
  portalState = {},
  withBaseline = false,
} = {}) {
  const root = await mkdtemp(join(tmpdir(), "hub-portal-tools-"));
  await writeFile(
    join(root, ".portal-tools-test-fixture"),
    "hub-portal-tools-fixture-v1\n",
    "utf8",
  );
  await mkdir(join(root, "scripts"), { recursive: true });
  await writeJson(
    join(root, "scripts", "documentos-runtime-config.json"),
    config,
  );
  await writeJson(join(root, "scripts", "documentos-tenants.json"), registry);

  const normalizedState = {};
  for (const portal of PORTALS) {
    const state = {
      extras: null,
      overrides: null,
      html: [],
      output: outputFor(portal),
      ...portalState[portal],
    };
    normalizedState[portal] = state;
    await mkdir(join(root, portal), { recursive: true });
    for (const page of state.html) {
      await writeFile(join(root, portal, page.file), page.source, "utf8");
    }
    if (state.extras !== null) {
      await writeJson(join(root, portal, "extras.json"), state.extras);
    }
    if (state.overrides !== null) {
      await writeJson(
        join(root, portal, "tools-overrides.json"),
        state.overrides,
      );
    }
    await writeJson(join(root, portal, "tools.json"), state.output);
  }

  if (withBaseline) {
    const manifest = baselineManifest(normalizedState);
    await writeJson(
      join(root, "scripts", "portal-tools-unmanaged-baseline.json"),
      manifest,
    );
    await writeJson(
      join(root, "scripts", "portal-tools-unmanaged-baseline.anchor.json"),
      baselineAnchor(manifest),
    );
  }
  return root;
}

function runGenerator(root, extraEnv = {}) {
  return spawnSync("python", [GENERATOR, root], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
}

function spawnGenerator(root, extraEnv = {}) {
  const child = spawn("python", [GENERATOR, root], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.portalToolsOutput = { stdout: "", stderr: "" };
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    child.portalToolsOutput.stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    child.portalToolsOutput.stderr += chunk;
  });
  return child;
}

async function waitForPath(path, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await access(path);
      return;
    } catch {
      await delay(20);
    }
  }
  assert.fail(`Caminho não apareceu no prazo: ${path}`);
}

async function collectProcess(child) {
  const status =
    child.exitCode ??
    (await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    }));
  return { status, ...child.portalToolsOutput };
}

async function waitForProcessOutput(child, pattern, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const output =
      child.portalToolsOutput.stdout + child.portalToolsOutput.stderr;
    if (pattern.test(output)) return;
    if (child.exitCode !== null) {
      assert.fail(`Processo terminou antes do marcador: ${output}`);
    }
    await delay(20);
  }
  assert.fail(`Marcador não apareceu no prazo: ${pattern}`);
}

async function readOutputs(root) {
  return Object.fromEntries(
    await Promise.all(
      PORTALS.map(async (portal) => [
        portal,
        await readFile(join(root, portal, "tools.json"), "utf8"),
      ]),
    ),
  );
}

function parseOutput(outputs, portal) {
  return JSON.parse(outputs[portal]);
}

async function withFixture(options, callback) {
  const root = await createFixture(options);
  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("estado canônico vazio valida as duas fontes e preserva os três tools.json byte a byte", async () => {
  await withFixture({ withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const beforeStats = Object.fromEntries(
      await Promise.all(
        PORTALS.map(async (portal) => [
          portal,
          (await stat(join(root, portal, "tools.json"))).mtimeMs,
        ]),
      ),
    );

    const result = runGenerator(root);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.deepEqual(await readOutputs(root), before);
    assert.deepEqual(
      Object.fromEntries(
        await Promise.all(
          PORTALS.map(async (portal) => [
            portal,
            (await stat(join(root, portal, "tools.json"))).mtimeMs,
          ]),
        ),
      ),
      beforeStats,
      "execução sem mudança não deve sequer regravar os outputs",
    );
    assert.match(result.stdout, /0 cards Documentos/i);
  });
});

test("baseline e âncora externa são obrigatórios e a ausência é fail-closed", async (t) => {
  for (const [name, removePath, expected] of [
    [
      "baseline",
      ["scripts", "portal-tools-unmanaged-baseline.json"],
      /baseline não gerenciado ausente/i,
    ],
    [
      "âncora",
      ["scripts", "portal-tools-unmanaged-baseline.anchor.json"],
      /âncora externa do baseline ausente/i,
    ],
  ]) {
    await t.test(name, async () => {
      await withFixture({ withBaseline: true }, async (root) => {
        const before = await readOutputs(root);
        await rm(join(root, ...removePath));
        const result = runGenerator(root);
        assert.notEqual(result.status, 0);
        assert.match(`${result.stdout}\n${result.stderr}`, expected);
        assert.deepEqual(await readOutputs(root), before);
      });
    });
  }
});

test("gera exatamente um card marcado por tenant habilitado e nenhum nos demais", async () => {
  const registry = {
    schemaVersion: 1,
    tenants: [
      { portal: "unimed", enabled: true, href: "/documentos/" },
      { portal: "unihealth", enabled: false, href: "/documentos/" },
    ],
  };
  const config = {
    ...DISABLED_CONFIG,
    enabled: true,
    apiBaseUrl: "https://documentos-api.grupocsv.com",
    enabledPortals: ["unimed"],
    features: { ...DISABLED_CONFIG.features, search: false },
  };

  await withFixture({ config, registry, withBaseline: true }, async (root) => {
    const first = runGenerator(root);
    assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
    const firstOutputs = await readOutputs(root);

    const unimedCards = parseOutput(firstOutputs, "unimed").tools.filter(
      (tool) => tool.managedBy === "hub-documentos",
    );
    assert.equal(unimedCards.length, 1);
    assert.deepEqual(
      {
        external: unimedCards[0].external,
        file: unimedCards[0].file,
        title: unimedCards[0].title,
      },
      {
        external: true,
        file: "/documentos/?portal=unimed",
        title: "Documentos",
      },
    );
    assert.equal(
      parseOutput(firstOutputs, "unihealth").tools.some(
        (tool) => tool.managedBy === "hub-documentos",
      ),
      false,
    );
    assert.equal(
      parseOutput(firstOutputs, "icds").tools.some(
        (tool) => tool.managedBy === "hub-documentos",
      ),
      false,
    );

    const second = runGenerator(root);
    assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`);
    assert.deepEqual(await readOutputs(root), firstOutputs);
  });
});

test("rejeita portal duplicado no registro antes de qualquer escrita", async () => {
  const registry = {
    schemaVersion: 1,
    tenants: [
      { portal: "unimed", enabled: false, href: "/documentos/" },
      { portal: "unimed", enabled: false, href: "/documentos/" },
    ],
  };
  await withFixture({ registry, withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const result = runGenerator(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /portal duplicado/i);
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("rejeita tenant desconhecido e rota divergente", async (t) => {
  for (const [name, registry, expected] of [
    [
      "desconhecido",
      {
        schemaVersion: 1,
        tenants: [{ portal: "axia", enabled: false, href: "/documentos/" }],
      },
      /tenant desconhecido.*axia/i,
    ],
    [
      "rota",
      {
        schemaVersion: 1,
        tenants: [
          { portal: "unimed", enabled: false, href: "/documentos-v2/" },
        ],
      },
      /rota divergente.*unimed/i,
    ],
  ]) {
    await t.test(name, async () => {
      await withFixture({ registry, withBaseline: true }, async (root) => {
        const before = await readOutputs(root);
        const result = runGenerator(root);
        assert.notEqual(result.status, 0);
        assert.match(`${result.stdout}\n${result.stderr}`, expected);
        assert.deepEqual(await readOutputs(root), before);
      });
    });
  }
});

test("aceita tenant institucional sem exigir um catálogo de parceiro", async () => {
  const registry = {
    schemaVersion: 1,
    tenants: [
      { portal: "grupo-csv", enabled: true, href: "/documentos/" },
    ],
  };
  const config = {
    ...DISABLED_CONFIG,
    enabled: true,
    apiBaseUrl: "https://documentos-api.grupocsv.com",
    enabledPortals: ["grupo-csv"],
  };

  await withFixture({ config, registry, withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const result = runGenerator(root);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("exige igualdade exata entre tenants habilitados e enabledPortals", async (t) => {
  for (const [name, registry, enabledPortals] of [
    [
      "registro habilita e runtime omite",
      {
        schemaVersion: 1,
        tenants: [{ portal: "unimed", enabled: true, href: "/documentos/" }],
      },
      [],
    ],
    ["runtime habilita e registro omite", EMPTY_REGISTRY, ["unimed"]],
  ]) {
    await t.test(name, async () => {
      const config = {
        ...DISABLED_CONFIG,
        enabled: true,
        apiBaseUrl: "https://documentos-api.grupocsv.com",
        enabledPortals,
      };
      await withFixture(
        { config, registry, withBaseline: true },
        async (root) => {
          const before = await readOutputs(root);
          const result = runGenerator(root);
          assert.notEqual(result.status, 0);
          assert.match(
            `${result.stdout}\n${result.stderr}`,
            /enabledPortals.*diverge/i,
          );
          assert.deepEqual(await readOutputs(root), before);
        },
      );
    });
  }
});

test("valida a origem da configuração pública antes de escrever", async () => {
  const config = {
    ...DISABLED_CONFIG,
    apiBaseUrl: "https://nao-confiavel.example/?token=segredo",
  };
  await withFixture({ config, withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const result = runGenerator(root);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /origem HTTPS permitida/i,
    );
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("rejeita card Documentos manual em extras e tools.json", async (t) => {
  for (const [name, portalState] of [
    [
      "extras",
      {
        unimed: {
          extras: [
            {
              title: "Documentos",
              href: "/documentos/?portal=unimed",
              created: "2026-06-01T00:00:00+00:00",
              lastModified: "2026-06-01T00:00:00+00:00",
            },
          ],
        },
      },
    ],
    [
      "tools",
      {
        unimed: {
          output: outputFor("unimed", [
            externalTool("/documentos/?portal=unimed", "Documentos"),
          ]),
        },
      },
    ],
  ]) {
    await t.test(name, async () => {
      await withFixture({ portalState, withBaseline: true }, async (root) => {
        const before = await readOutputs(root);
        const result = runGenerator(root);
        assert.notEqual(result.status, 0);
        assert.match(
          `${result.stdout}\n${result.stderr}`,
          /card Documentos manual/i,
        );
        assert.deepEqual(await readOutputs(root), before);
      });
    });
  }
});

test("rejeita duplicidade e card gerenciado em tenant desabilitado", async (t) => {
  const managed = {
    ...externalTool("/documentos/?portal=unimed", "Documentos"),
    managedBy: "hub-documentos",
  };
  for (const [name, tools, expected] of [
    ["duplicado", [managed, managed], /card Documentos duplicado/i],
    ["desabilitado", [managed], /card Documentos.*tenant desabilitado/i],
  ]) {
    await t.test(name, async () => {
      const portalState = {
        unimed: { output: outputFor("unimed", tools) },
      };
      await withFixture({ portalState, withBaseline: true }, async (root) => {
        const before = await readOutputs(root);
        const result = runGenerator(root);
        assert.notEqual(result.status, 0);
        assert.match(`${result.stdout}\n${result.stderr}`, expected);
        assert.deepEqual(await readOutputs(root), before);
      });
    });
  }
});

test("falha fatalmente em JSON inválido sem promover saída parcial", async () => {
  await withFixture({ withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    await writeFile(join(root, "icds", "extras.json"), "{ inválido", "utf8");
    const result = runGenerator(root);

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /JSON inválido.*extras\.json/i,
    );
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("mudança de fonte aborta e exige fluxo separado de regeneração geral", async () => {
  const stale = externalTool("/p/legado/", "Legado");
  const current = externalTool(
    "/p/atual/",
    "Atual",
    "2026-07-02T00:00:00+00:00",
  );
  const portalState = {
    icds: {
      extras: [
        {
          title: stale.title,
          href: stale.file,
          created: stale.created,
          lastModified: stale.lastModified,
        },
      ],
      output: outputFor("icds", [stale]),
    },
  };
  await withFixture({ portalState, withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    await writeJson(join(root, "icds", "extras.json"), [
      {
        title: current.title,
        href: current.file,
        created: current.created,
        lastModified: current.lastModified,
      },
    ]);

    const result = runGenerator(root);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /fonte não gerenciada.*fluxo separado.*autorizado/i,
    );
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("comentário HTML também integra o snapshot de fonte e não é ignorado", async () => {
  const portalState = {
    unimed: {
      html: [
        {
          file: "painel.html",
          source: "<!doctype html><title>Painel</title><!-- revisão A -->",
        },
      ],
    },
  };
  await withFixture({ portalState, withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    await writeFile(
      join(root, "unimed", "painel.html"),
      "<!doctype html><title>Painel</title><!-- revisão B -->",
      "utf8",
    );
    const result = runGenerator(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /fonte não gerenciada/i);
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("HTML LF e CRLF produzem o mesmo descriptor sem normalizar tools.json", async () => {
  const lfSource = "<!doctype html>\n<title>Painel</title>\n<!-- revisão -->\n";
  const crlfSource = lfSource.replaceAll("\n", "\r\n");
  const roots = await Promise.all([
    createFixture({
      portalState: {
        unimed: { html: [{ file: "painel.html", source: lfSource }] },
      },
      withBaseline: true,
    }),
    createFixture({
      portalState: {
        unimed: { html: [{ file: "painel.html", source: crlfSource }] },
      },
      withBaseline: true,
    }),
  ]);

  try {
    const baselines = await Promise.all(
      roots.map(async (root) =>
        JSON.parse(
          await readFile(
            join(root, "scripts", "portal-tools-unmanaged-baseline.json"),
            "utf8",
          ),
        ),
      ),
    );
    assert.equal(
      baselines[0].portals.unimed.sourceSha256,
      baselines[1].portals.unimed.sourceSha256,
      "o hash do descriptor HTML deve ser independente do checkout LF/CRLF",
    );

    const crlfToolsPath = join(roots[1], "unimed", "tools.json");
    const originalCrlfTools = (
      await readFile(crlfToolsPath, "utf8")
    ).replaceAll("\n", "\r\n");
    await writeFile(crlfToolsPath, originalCrlfTools, "utf8");
    const before = await Promise.all(roots.map(readOutputs));

    const results = roots.map((root) => runGenerator(root));
    for (const result of results) {
      assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
      assert.match(result.stdout, /sem reescrita/i);
    }

    const after = await Promise.all(roots.map(readOutputs));
    assert.deepEqual(after, before);
    assert.equal(after[1].unimed, originalCrlfTools);
    assert.deepEqual(
      JSON.parse(after[0].unimed),
      JSON.parse(after[1].unimed),
      "a saída semântica permanece igual sem reserializar os bytes CRLF",
    );
  } finally {
    await Promise.all(
      roots.map((root) => rm(root, { recursive: true, force: true })),
    );
  }
});

test("generatedAt integra a baseline não gerenciada e divergência aborta byte a byte", async () => {
  await withFixture({ withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const path = join(root, "unihealth", "tools.json");
    const output = JSON.parse(await readFile(path, "utf8"));
    output.generatedAt = "2026-07-02T00:00:00+00:00";
    await writeJson(path, output);
    const mutated = await readOutputs(root);

    const result = runGenerator(root);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /objeto não gerenciado.*generatedAt|saída não gerenciada.*baseline/i,
    );
    assert.deepEqual(await readOutputs(root), mutated);
    assert.notDeepEqual(mutated, before);
  });
});

test("adulteração do baseline é fatal e não altera o conjunto canônico", async () => {
  await withFixture({ withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const path = join(root, "scripts", "portal-tools-unmanaged-baseline.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.portals.unimed.sourceSha256 = "0".repeat(64);
    await writeJson(path, manifest);

    const result = runGenerator(root);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /baseline.*adulterado|digest.*baseline/i,
    );
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("baseline e output recalculados não vencem a âncora externa versionada", async () => {
  await withFixture({ withBaseline: true }, async (root) => {
    const outputPath = join(root, "unimed", "tools.json");
    const output = JSON.parse(await readFile(outputPath, "utf8"));
    output.tools.push(externalTool("/p/injetado/", "Injetado"));
    output.totalTools = output.tools.length;
    await writeJson(outputPath, output);

    const baselinePath = join(
      root,
      "scripts",
      "portal-tools-unmanaged-baseline.json",
    );
    const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
    baseline.portals.unimed.unmanagedOutput = outputFor(
      "unimed",
      output.tools,
      output.generatedAt,
    );
    baseline.portals.unimed.unmanagedOutputSha256 = canonicalHash(
      baseline.portals.unimed.unmanagedOutput,
    );
    const { manifestSha256: _oldChecksum, ...unsigned } = baseline;
    baseline.manifestSha256 = canonicalHash(unsigned);
    await writeJson(baselinePath, baseline);
    const before = await readOutputs(root);

    const result = runGenerator(root);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /âncora externa.*diverge/i,
    );
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("rotas Documentos obfuscadas são canonicalizadas e rejeitadas", async (t) => {
  const routes = [
    "documentos/",
    "./documentos/",
    "/x/../documentos/",
    "\\documentos\\",
    "/%64ocumentos/",
    "/x/%2e%2e/documentos/",
    "/%2564ocumentos%252f",
  ];
  for (const route of routes) {
    await t.test(route, async () => {
      const portalState = {
        unimed: {
          extras: [
            {
              title: "Arquivo",
              href: route,
              created: "2026-06-01T00:00:00+00:00",
              lastModified: "2026-06-01T00:00:00+00:00",
            },
          ],
        },
      };
      await withFixture({ portalState, withBaseline: true }, async (root) => {
        const before = await readOutputs(root);
        const result = runGenerator(root);
        assert.notEqual(result.status, 0);
        assert.match(
          `${result.stdout}\n${result.stderr}`,
          /card Documentos manual/i,
        );
        assert.deepEqual(await readOutputs(root), before);
      });
    });
  }
});

test("rejeita symlink, junction ou reparse point antes de ler portal", async (t) => {
  await withFixture({ withBaseline: true }, async (root) => {
    const realPortal = join(root, "unimed-real");
    await rename(join(root, "unimed"), realPortal);
    try {
      await symlink(
        realPortal,
        join(root, "unimed"),
        process.platform === "win32" ? "junction" : "dir",
      );
    } catch (error) {
      if (["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) {
        t.skip(`plataforma não permitiu junction/symlink: ${error.code}`);
        return;
      }
      throw error;
    }

    const before = await readFile(join(realPortal, "tools.json"), "utf8");
    const result = runGenerator(root);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /symlink|junction|reparse point|redirecionamento de caminho/i,
    );
    assert.equal(
      await readFile(join(realPortal, "tools.json"), "utf8"),
      before,
    );
  });
});

test("falha injetada no meio da promoção restaura os três tools.json", async () => {
  const registry = {
    schemaVersion: 1,
    tenants: [{ portal: "unimed", enabled: true, href: "/documentos/" }],
  };
  const config = {
    ...DISABLED_CONFIG,
    enabled: true,
    apiBaseUrl: "https://documentos-api.grupocsv.com",
    enabledPortals: ["unimed"],
  };
  await withFixture({ config, registry, withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const result = runGenerator(root, {
      PORTAL_TOOLS_TEST_FAIL_AFTER_PROMOTIONS: "1",
    });

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /falha de promoção injetada/i,
    );
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("falha de rollback preserva backup e instruções de recuperação", async () => {
  const registry = {
    schemaVersion: 1,
    tenants: [{ portal: "unimed", enabled: true, href: "/documentos/" }],
  };
  const config = {
    ...DISABLED_CONFIG,
    enabled: true,
    apiBaseUrl: "https://documentos-api.grupocsv.com",
    enabledPortals: ["unimed"],
  };
  await withFixture({ config, registry, withBaseline: true }, async (root) => {
    const result = runGenerator(root, {
      PORTAL_TOOLS_TEST_FAIL_AFTER_PROMOTIONS: "1",
      PORTAL_TOOLS_TEST_FAIL_ROLLBACK_FOR: "unimed",
    });

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /rollback.*falhou.*backup.*preservado/i,
    );
    const recoveryDirs = (await readdir(root)).filter((name) =>
      name.startsWith(".portal-tools-backup-"),
    );
    assert.equal(recoveryDirs.length, 1);
    const recoveryDir = join(root, recoveryDirs[0]);
    assert.ok((await stat(join(recoveryDir, "unimed.tools.json"))).isFile());
    const recovery = JSON.parse(
      await readFile(join(recoveryDir, "RECOVERY.json"), "utf8"),
    );
    assert.equal(recovery.status, "rollback-incomplete");
    assert.ok(recovery.rollbackErrors.length >= 1);
  });
});

test("execuções concorrentes são serializadas e a segunda aborta sem escrita", async () => {
  await withFixture({ withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const first = spawnGenerator(root, {
      PORTAL_TOOLS_TEST_HOLD_LOCK_MS: "500",
    });
    await waitForPath(join(root, ".portal-tools.lock"));

    const second = runGenerator(root);
    assert.notEqual(second.status, 0);
    assert.match(`${second.stdout}\n${second.stderr}`, /geração concorrente/i);
    assert.deepEqual(await readOutputs(root), before);

    const firstResult = await collectProcess(first);
    assert.equal(
      firstResult.status,
      0,
      `${firstResult.stdout}\n${firstResult.stderr}`,
    );
    assert.deepEqual(await readOutputs(root), before);
  });
});

test("snapshot é recomparado imediatamente antes da promoção para fechar TOCTOU", async () => {
  await withFixture({ withBaseline: true }, async (root) => {
    const before = await readOutputs(root);
    const child = spawnGenerator(root, {
      PORTAL_TOOLS_TEST_HOLD_BEFORE_PROMOTION_MS: "750",
    });
    await waitForProcessOutput(child, /snapshot capturado/i);
    await writeFile(
      join(root, "unimed", "tools.json"),
      `${before.unimed}\n`,
      "utf8",
    );
    const result = await collectProcess(child);

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /snapshot de entrada mudou antes da promoção.*unimed\/tools\.json/i,
    );
    const after = await readOutputs(root);
    assert.equal(after.unimed, `${before.unimed}\n`);
    assert.equal(after.unihealth, before.unihealth);
    assert.equal(after.icds, before.icds);
  });
});

test("fontes e saída não dependem de datetime.now, mtime ou listagem não ordenada", async () => {
  const source = await readFile(GENERATOR, "utf8");
  assert.doesNotMatch(
    source,
    /datetime\.now|fromtimestamp|[gs]etmtime|os\.listdir/,
  );
  assert.match(source, /sorted\(/);
});

test("fontes reais mantêm quatro tenants isolados e três cards gerenciados de parceiros", async () => {
  const registry = JSON.parse(
    await readFile(
      join(REPO_ROOT, "scripts", "documentos-tenants.json"),
      "utf8",
    ),
  );
  const config = JSON.parse(
    await readFile(
      join(REPO_ROOT, "scripts", "documentos-runtime-config.json"),
      "utf8",
    ),
  );
  const baseline = JSON.parse(
    await readFile(
      join(REPO_ROOT, "scripts", "portal-tools-unmanaged-baseline.json"),
      "utf8",
    ),
  );
  const anchor = JSON.parse(
    await readFile(
      join(REPO_ROOT, "scripts", "portal-tools-unmanaged-baseline.anchor.json"),
      "utf8",
    ),
  );

  assert.deepEqual(
    registry.tenants,
    RUNTIME_PORTALS.map((portal) => ({
      portal,
      enabled: true,
      href: "/documentos/",
    })),
  );
  assert.equal(config.enabled, true);
  assert.equal(config.apiBaseUrl, "https://documentos-api.grupocsv.com");
  assert.deepEqual(config.enabledPortals, RUNTIME_PORTALS);
  assert.deepEqual(config.features, {
    favorites: true,
    offline: false,
    search: false,
    upload: true,
    viewer: true,
  });
  for (const portal of PORTALS) {
    const output = JSON.parse(
      await readFile(join(REPO_ROOT, portal, "tools.json"), "utf8"),
    );
    const managed = output.tools.filter(isDocumentosCandidate);
    assert.equal(
      managed.length,
      1,
      `um único card Documentos deve existir em ${portal}`,
    );
    assert.deepEqual(managed[0], {
      file: `/documentos/?portal=${portal}`,
      title: "Documentos",
      created: output.generatedAt,
      lastModified: output.generatedAt,
      external: true,
      managedBy: "hub-documentos",
    });
  }

  const { manifestSha256, ...unsigned } = baseline;
  assert.equal(manifestSha256, canonicalHash(unsigned));
  assert.equal(anchor.baselineManifestSha256, manifestSha256);
  assert.equal(anchor.authority, BASELINE_AUTHORITY);
  assert.equal(baseline.integrityAuthority, BASELINE_AUTHORITY);
  for (const portal of PORTALS) {
    const entry = baseline.portals[portal];
    assert.deepEqual(Object.keys(entry).sort(), [
      "sourceSha256",
      "unmanagedOutput",
      "unmanagedOutputSha256",
    ]);
    assert.deepEqual(Object.keys(entry.unmanagedOutput).sort(), [
      "generatedAt",
      "portal",
      "tools",
      "totalTools",
    ]);
    assert.equal(
      entry.unmanagedOutputSha256,
      canonicalHash(entry.unmanagedOutput),
    );
  }
  assert.doesNotMatch(
    JSON.stringify(baseline),
    /(?:[A-Za-z]:[\\/]|\/Users\/|mtime)/i,
  );
  assert.doesNotMatch(
    `${JSON.stringify(baseline)}${JSON.stringify(anchor)}`,
    /assinatura/i,
  );
});
