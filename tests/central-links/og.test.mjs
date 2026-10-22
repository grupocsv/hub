import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";

const root = new URL("../../", import.meta.url);
const read = (path, encoding) => readFileSync(new URL(path, root), encoding);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const originalHash =
  "265a006468bfead510e88de73288cdc3ea63c86cc4b74f99a72f8bae3d35cac2";
const imageUrl = "https://hub.grupocsv.com/og/og_hub-v2.jpg";

function jpegFrame(bytes) {
  assert.equal(
    bytes.readUInt16BE(0),
    0xffd8,
    "A imagem deve começar com o marcador JPEG.",
  );
  for (let offset = 2; offset + 4 <= bytes.length; ) {
    assert.equal(bytes[offset], 0xff, "Marcador JPEG inválido.");
    const marker = bytes[offset + 1];
    const size = bytes.readUInt16BE(offset + 2);
    assert.ok(
      size >= 2 && offset + 2 + size <= bytes.length,
      "Segmento JPEG inválido.",
    );
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      const channels = bytes[offset + 9];
      return {
        width: bytes.readUInt16BE(offset + 7),
        height: bytes.readUInt16BE(offset + 5),
        precision: bytes[offset + 4],
        sampling: Array.from(
          { length: channels },
          (_, channel) => bytes[offset + 11 + channel * 3],
        ),
      };
    }
    assert.notEqual(
      marker,
      0xda,
      "O cabeçalho SOF deve aparecer antes dos dados da imagem.",
    );
    offset += size + 2;
  }
  assert.fail("Cabeçalho SOF não encontrado no JPEG.");
}

test("T22: prévia é JPEG 1200 × 630, RGB 4:4:4 e menor que 300 KB", () => {
  const image = read("docs/public/og/og_hub-v2.jpg");
  assert.ok(image.length < 300_000, "A prévia deve ter menos de 300 KB.");
  assert.deepEqual(jpegFrame(image), {
    width: 1200,
    height: 630,
    precision: 8,
    sampling: [0x11, 0x11, 0x11],
  });
});

test("T22: PNG original permanece byte a byte igual", () => {
  assert.equal(sha256(read("docs/public/og/og_hub.png")), originalHash);
});

test("T22: JPEG é exatamente o arquivo cuja qualidade SSIM foi medida", () => {
  const reference = JSON.parse(
    read("tests/central-links/og-reference.json", "utf8"),
  );
  assert.equal(reference.original_sha256, originalHash);
  assert.equal(
    reference.jpeg_sha256,
    sha256(read("docs/public/og/og_hub-v2.jpg")),
  );
  assert.ok(
    reference.ssim >= 0.99 && reference.ssim <= 1,
    "O SSIM medido deve ser de pelo menos 0,99.",
  );
  assert.equal(reference.generator, "sharp 0.34.5");
  assert.deepEqual(reference.options, {
    quality: 97,
    chromaSubsampling: "4:4:4",
  });
  assert.ok(
    reference.method.length > 30,
    "A referência deve explicar o método da medição.",
  );
});

test("T22: configuração global declara a prévia JPEG e o tipo correto", () => {
  const config = read("docs/.vitepress/config.mts", "utf8");
  for (const property of ["og:image", "twitter:image"]) {
    const declaration = config.match(
      new RegExp(
        `\\['meta', \\{ (?:property|name): '${property}', content: '([^']+)' \\}\\]`,
      ),
    );
    assert.equal(
      declaration?.[1],
      imageUrl,
      `${property} deve apontar para a prévia JPEG.`,
    );
  }
  assert.match(
    config,
    /\['meta', \{ property: 'og:image:type', content: 'image\/jpeg' \}\]/,
  );
});

test("T22: página inicial declara a prévia JPEG e o tipo correto", () => {
  const frontmatter = read("docs/index.md", "utf8").match(
    /^---\n([\s\S]*?)\n---/,
  );
  assert.ok(frontmatter, "A página inicial deve manter seu frontmatter.");
  const { head } = parse(frontmatter[1]);
  const tags = new Map(
    head
      .filter(([tag]) => tag === "meta")
      .map(([, attributes]) => [
        attributes.property || attributes.name,
        attributes.content,
      ]),
  );
  assert.equal(tags.get("og:image"), imageUrl);
  assert.equal(tags.get("twitter:image"), imageUrl);
  assert.equal(tags.get("og:image:type"), "image/jpeg");
});
