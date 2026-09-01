import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SHA256 = /^[a-f0-9]{64}$/u;
const COMMIT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u;
const WEB_ROUTE = /^\/compass\/edicoes\/(\d{4})\/(\d{3})\/compass$/u;
const PDF_LIMIT_BYTES = 4 * 1024 * 1024;

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertCommit(value, field) {
  if (!COMMIT.test(value)) throw new TypeError(`${field} inválido.`);
}

function assertSha256(value, field) {
  if (!SHA256.test(value)) throw new TypeError(`${field} inválido.`);
}

function parseInventory(text) {
  const rows = text.trim().split(/\r?\n/u);
  const header = rows.shift()?.split("\t");
  if (header?.join("|") !== "edition|html_bytes|pdf_bytes|pdf_pages") {
    throw new TypeError("Cabeçalho do inventário baseline inválido.");
  }
  return new Map(
    rows.map((row) => {
      const [edition, htmlBytes, pdfBytes, pdfPages] = row.split("\t");
      if (!/^\d{3}$/u.test(edition)) throw new TypeError("Edição baseline inválida.");
      const values = [htmlBytes, pdfBytes, pdfPages].map(Number);
      if (values.some((value) => !Number.isSafeInteger(value) || value <= 0)) {
        throw new TypeError(`Inventário baseline inválido para ${edition}.`);
      }
      return [
        edition,
        {
          htmlBytes: values[0],
          pdfBytes: values[1],
          pdfPages: values[2],
        },
      ];
    }),
  );
}

function parseChecksums(text) {
  const entries = new Map();
  for (const line of text.split(/\r?\n/u)) {
    if (!line.trim()) continue;
    const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/u);
    if (!match) throw new TypeError("Linha inválida no manifesto baseline.");
    entries.set(path.normalize(match[2]), match[1]);
  }
  return entries;
}

function checksumFor(checksums, filePath) {
  const normalized = path.normalize(filePath);
  const direct = checksums.get(normalized);
  if (direct) return direct;
  const suffix = [...checksums.entries()].find(([candidate]) =>
    candidate.endsWith(normalized),
  );
  if (!suffix) throw new TypeError(`Checksum baseline ausente para ${filePath}.`);
  return suffix[1];
}

async function verifyFile(filePath, expectedSha256, expectedBytes, label) {
  const [bytes, metadata] = await Promise.all([readFile(filePath), stat(filePath)]);
  if (metadata.size !== expectedBytes) {
    throw new TypeError(`${label}: tamanho diverge.`);
  }
  if (digest(bytes) !== expectedSha256) {
    throw new TypeError(`${label}: checksum diverge.`);
  }
  return bytes;
}

function baselineFiles(baselineRoot, number) {
  if (number !== "008") {
    return {
      html: path.join(baselineRoot, "production", number, "compass.html"),
      pdf: path.join(
        baselineRoot,
        "production",
        number,
        `compass_${number}_2026.pdf`,
      ),
    };
  }
  return {
    html: path.join(
      baselineRoot,
      "input-008/008-html/compass-008-2026/compass-008-2026.html",
    ),
    pdf: path.join(
      baselineRoot,
      "input-008/Compass-008-2026-Marcos-Temporais-Alta-e-Substituicao-do-Leito.pdf",
    ),
  };
}

function versionedSlug(publicSlug, releaseNumber, sha256) {
  const value = `${publicSlug}-v${releaseNumber}-${sha256.slice(0, 12)}`;
  if (value.length > 48) throw new TypeError("Slug público versionado excede 48 caracteres.");
  return value;
}

export async function buildReleasePlan({
  repoRoot,
  baselineRoot,
  sourceCommit,
  baselineCommit,
  expectedEditionNumbers = ["001", "002", "003", "004", "005", "006", "007", "008"],
}) {
  assertCommit(sourceCommit, "sourceCommit");
  assertCommit(baselineCommit, "baselineCommit");
  const catalogPath = path.join(repoRoot, "docs/compass/catalog.json");
  const inventoryPath = path.join(baselineRoot, "inventory.tsv");
  const checksumsPath = path.join(baselineRoot, "SHA256SUMS.txt");
  const [catalogBytes, inventoryText, checksumsText] = await Promise.all([
    readFile(catalogPath),
    readFile(inventoryPath, "utf8"),
    readFile(checksumsPath, "utf8"),
  ]);
  const catalog = JSON.parse(catalogBytes.toString("utf8"));
  const inventory = parseInventory(inventoryText);
  const checksums = parseChecksums(checksumsText);
  const expected = [...expectedEditionNumbers].sort();
  const actual = catalog.editions
    .map((edition) => String(edition.number).padStart(3, "0"))
    .sort();
  if (catalog.schemaVersion !== 2 || JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new TypeError("Catálogo não contém exatamente as edições esperadas.");
  }

  const baselineDate = path.basename(path.resolve(baselineRoot));
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(baselineDate)) {
    throw new TypeError("Data do diretório baseline inválida.");
  }
  const catalogSha256 = digest(catalogBytes);
  const baselineManifestSha256 = digest(Buffer.from(checksumsText, "utf8"));
  const editions = [];

  for (const number of expected) {
    const catalogEdition = catalog.editions.find(
      (edition) => String(edition.number).padStart(3, "0") === number,
    );
    const year = catalogEdition.year;
    const routeMatch = catalogEdition.routes.web.match(WEB_ROUTE);
    if (!routeMatch || routeMatch[1] !== String(year) || routeMatch[2] !== number) {
      throw new TypeError(`Edição ${number}: rota web não canônica.`);
    }
    const inventoryRow = inventory.get(number);
    if (!inventoryRow) throw new TypeError(`Edição ${number}: inventário ausente.`);
    const baseline = baselineFiles(baselineRoot, number);
    const baselineHtmlSha256 = checksumFor(checksums, baseline.html);
    const baselinePdfSha256 = checksumFor(checksums, baseline.pdf);
    await Promise.all([
      verifyFile(
        baseline.html,
        baselineHtmlSha256,
        inventoryRow.htmlBytes,
        `Edição ${number}: HTML baseline`,
      ),
      verifyFile(
        baseline.pdf,
        baselinePdfSha256,
        inventoryRow.pdfBytes,
        `Edição ${number}: PDF baseline`,
      ),
    ]);

    const editionRoot = path.join(repoRoot, "compass/edicoes", String(year), number);
    const releasePath = path.join(editionRoot, "release.json");
    const release = JSON.parse(await readFile(releasePath, "utf8"));
    const candidatePath = path.join(editionRoot, release.pdf.filename);
    assertSha256(release.sourceHash, `Edição ${number}: sourceHash`);
    assertSha256(release.pdf.sha256, `Edição ${number}: PDF SHA-256`);
    if (!Number.isSafeInteger(release.pdf.pages) || release.pdf.pages <= 0) {
      throw new TypeError(`Edição ${number}: páginas do PDF v2 ausentes.`);
    }
    await verifyFile(
      candidatePath,
      release.pdf.sha256,
      release.pdf.bytes,
      `Edição ${number}: checksum do PDF v2 diverge`,
    );
    if (release.pdf.bytes > PDF_LIMIT_BYTES) {
      throw new TypeError(`Edição ${number}: PDF v2 excede 4 MB.`);
    }
    const distHtmlPath = path.join(
      repoRoot,
      "docs/.vitepress/dist",
      catalogEdition.routes.web.slice(1) + ".html",
    );
    const candidateHtml = await readFile(distHtmlPath);
    const publicSlug = `compass-${number}-${year}`;
    const baselineSourceRef = `baseline:${baselineDate}:${number}:sha256:${baselinePdfSha256}`;

    editions.push({
      editionId: `compass-${year}-${number}`,
      editionNumber: number,
      publicationYear: year,
      title: catalogEdition.title,
      status: catalogEdition.status,
      publicSlug,
      webRoute: catalogEdition.routes.web,
      pdfDocumentId: `compass-pdf-${year}-${number}`,
      document: {
        title: `Compass™ ${number}/${year} — ${catalogEdition.title}`,
        classification: "public",
        indexingPolicy: "metadata_only",
      },
      versions: {
        baseline: {
          role: "golden-master",
          releaseId: `compass-${year}-${number}-release-1`,
          releaseNumber: 1,
          filePath: baseline.pdf,
          fileName: path.basename(baseline.pdf),
          sha256: baselinePdfSha256,
          bytes: inventoryRow.pdfBytes,
          pageCount: inventoryRow.pdfPages,
          webSha256: baselineHtmlSha256,
          catalogSha256: baselineManifestSha256,
          engineVersion: "legacy-frozen",
          templateVersion: "legacy-frozen",
          sourceCommit: baselineCommit,
          sourceType: "migration",
          sourceRef: baselineSourceRef,
          publicLinkSlug: versionedSlug(publicSlug, 1, baselinePdfSha256),
          allowDownload: true,
        },
        candidate: {
          role: "candidate-v2",
          releaseId: `compass-${year}-${number}-release-2`,
          releaseNumber: 2,
          filePath: candidatePath,
          fileName: release.pdf.filename,
          sha256: release.pdf.sha256,
          bytes: release.pdf.bytes,
          pageCount: release.pdf.pages,
          webSha256: digest(candidateHtml),
          catalogSha256,
          engineVersion: catalogEdition.engine.version,
          templateVersion: catalogEdition.engine.templateVersion,
          sourceCommit,
          sourceType: "upload",
          sourceRef: null,
          publicLinkSlug: versionedSlug(publicSlug, 2, release.pdf.sha256),
          allowDownload: true,
        },
      },
      activationOrder: ["baseline", "candidate"],
      rollback: {
        strategy: "reactivate-release-pointer",
        target: "baseline",
        preservesWebRoute: true,
        preservesVersionedLinks: true,
      },
    });
  }

  return {
    schemaVersion: 1,
    sourceCommit,
    baselineCommit,
    baselineDate,
    catalogSha256,
    baselineManifestSha256,
    maximumPdfBytes: PDF_LIMIT_BYTES,
    editions,
    remoteMutationAllowed: false,
    requiresExplicitAuthorization: true,
    n8nImpacted: false,
  };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new TypeError("Argumentos inválidos.");
    }
    result[key.slice(2)] = value;
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = ["repo-root", "baseline-root", "source-commit", "baseline-commit", "output"];
  for (const name of required) {
    if (!args[name]) throw new TypeError(`Argumento --${name} obrigatório.`);
  }
  const plan = await buildReleasePlan({
    repoRoot: path.resolve(args["repo-root"]),
    baselineRoot: path.resolve(args["baseline-root"]),
    sourceCommit: args["source-commit"],
    baselineCommit: args["baseline-commit"],
  });
  await writeFile(path.resolve(args.output), `${JSON.stringify(plan, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
