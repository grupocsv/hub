import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createHash } from "node:crypto";

import { buildReleasePlan } from "../../scripts/compass-v2/release-plan.mjs";

const COMMIT = "a".repeat(40);
const BASELINE_COMMIT = "b".repeat(40);

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "compass-release-plan-"));
  const repoRoot = path.join(root, "hub");
  const baselineRoot = path.join(root, "baseline", "2026-08-31");
  const editionRoot = path.join(repoRoot, "compass/edicoes/2026/001");
  const distRoot = path.join(
    repoRoot,
    "docs/.vitepress/dist/compass/edicoes/2026/001",
  );
  await Promise.all([
    mkdir(editionRoot, { recursive: true }),
    mkdir(distRoot, { recursive: true }),
    mkdir(path.join(baselineRoot, "production/001"), { recursive: true }),
  ]);

  const baselineHtml = "<html>legado</html>";
  const baselinePdf = "%PDF baseline";
  const candidatePdf = "%PDF candidate";
  const candidateHtml = "<html>v2</html>";
  await Promise.all([
    writeFile(path.join(baselineRoot, "production/001/compass.html"), baselineHtml),
    writeFile(
      path.join(baselineRoot, "production/001/compass_001_2026.pdf"),
      baselinePdf,
    ),
    writeFile(path.join(editionRoot, "compass_001_2026.pdf"), candidatePdf),
    writeFile(path.join(distRoot, "compass.html"), candidateHtml),
  ]);

  const catalog = {
    schemaVersion: 2,
    total: 1,
    editions: [
      {
        id: "001-2026",
        number: 1,
        year: 2026,
        slug: "001",
        title: "Edição de teste",
        status: "Publicado",
        engine: { version: "2.0.0", templateVersion: "2.0.0" },
        routes: {
          web: "/compass/edicoes/2026/001/compass",
          pdf: "/compass/edicoes/2026/001/compass_001_2026.pdf",
        },
      },
    ],
  };
  const release = {
    schemaVersion: 1,
    editionId: "001-2026",
    editionSlug: "001",
    year: 2026,
    engine: { name: "compass-v2", renderer: "playwright-chromium" },
    sourceHash: sha256("fonte v2"),
    pdf: {
      filename: "compass_001_2026.pdf",
      sha256: sha256(candidatePdf),
      bytes: Buffer.byteLength(candidatePdf),
      pages: 11,
    },
  };
  await mkdir(path.join(repoRoot, "docs/compass"), { recursive: true });
  await Promise.all([
    writeFile(path.join(repoRoot, "docs/compass/catalog.json"), JSON.stringify(catalog)),
    writeFile(path.join(editionRoot, "release.json"), JSON.stringify(release)),
    writeFile(
      path.join(baselineRoot, "inventory.tsv"),
      `edition\thtml_bytes\tpdf_bytes\tpdf_pages\n001\t${Buffer.byteLength(baselineHtml)}\t${Buffer.byteLength(baselinePdf)}\t7\n`,
    ),
    writeFile(
      path.join(baselineRoot, "SHA256SUMS.txt"),
      `${sha256(baselineHtml)}  ${path.join(baselineRoot, "production/001/compass.html")}\n${sha256(baselinePdf)}  ${path.join(baselineRoot, "production/001/compass_001_2026.pdf")}\n`,
    ),
  ]);

  return { repoRoot, baselineRoot, candidatePdf };
}

test("gera plano bifásico verificável com baseline, candidato e rollback por ponteiro", async () => {
  const { repoRoot, baselineRoot } = await fixture();
  const plan = await buildReleasePlan({
    repoRoot,
    baselineRoot,
    sourceCommit: COMMIT,
    baselineCommit: BASELINE_COMMIT,
    expectedEditionNumbers: ["001"],
  });

  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.sourceCommit, COMMIT);
  assert.equal(plan.editions.length, 1);
  const edition = plan.editions[0];
  assert.equal(edition.editionId, "compass-2026-001");
  assert.equal(edition.webRoute, "/compass/edicoes/2026/001/compass");
  assert.equal(edition.publicSlug, "compass-001-2026");
  assert.equal(edition.pdfDocumentId, "compass-pdf-2026-001");
  assert.equal("pdfDocumentExternalRef" in edition, false);
  assert.equal(edition.versions.baseline.sourceType, "migration");
  assert.match(edition.versions.baseline.sourceRef, /^baseline:2026-08-31:/u);
  assert.equal(edition.versions.baseline.releaseNumber, 1);
  assert.equal(edition.versions.candidate.releaseNumber, 2);
  assert.equal(edition.versions.baseline.pageCount, 7);
  assert.equal(edition.versions.candidate.pageCount, 11);
  assert.equal(edition.versions.candidate.sourceType, "upload");
  assert.match(edition.versions.candidate.publicLinkSlug, /^compass-001-2026-v2-/u);
  assert.ok(edition.versions.candidate.publicLinkSlug.length <= 48);
  assert.deepEqual(edition.activationOrder, ["baseline", "candidate"]);
  assert.deepEqual(edition.rollback, {
    strategy: "reactivate-release-pointer",
    target: "baseline",
    preservesWebRoute: true,
    preservesVersionedLinks: true,
  });
  assert.doesNotMatch(JSON.stringify(plan), /token|secret|object_key/iu);
});

test("falha fechado quando o PDF v2 diverge do manifesto", async () => {
  const { repoRoot, baselineRoot } = await fixture();
  await writeFile(
    path.join(repoRoot, "compass/edicoes/2026/001/compass_001_2026.pdf"),
    "%PDF adulterado",
  );

  await assert.rejects(
    buildReleasePlan({
      repoRoot,
      baselineRoot,
      sourceCommit: COMMIT,
      baselineCommit: BASELINE_COMMIT,
      expectedEditionNumbers: ["001"],
    }),
    /checksum do PDF v2 diverge/u,
  );
});

test("falha fechado para rota não canônica ou commit inválido", async () => {
  const { repoRoot, baselineRoot } = await fixture();
  const catalogPath = path.join(repoRoot, "docs/compass/catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  catalog.editions[0].routes.web = "/compass/edicoes/2026/001/";
  await writeFile(catalogPath, JSON.stringify(catalog));

  await assert.rejects(
    buildReleasePlan({
      repoRoot,
      baselineRoot,
      sourceCommit: "curto",
      baselineCommit: BASELINE_COMMIT,
      expectedEditionNumbers: ["001"],
    }),
    /sourceCommit inválido/u,
  );
  await assert.rejects(
    buildReleasePlan({
      repoRoot,
      baselineRoot,
      sourceCommit: COMMIT,
      baselineCommit: BASELINE_COMMIT,
      expectedEditionNumbers: ["001"],
    }),
    /rota web não canônica/u,
  );
});
