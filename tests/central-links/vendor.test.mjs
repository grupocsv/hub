import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");
const vendor = resolve(root, "admin/vendor");

test("QR Code tem biblioteca local, licença e espelho de publicação íntegro", () => {
  for (const name of [
    "qrcode-generator-1.4.4.js",
    "qrcode-generator-LICENSE",
    "README.md",
  ]) {
    const file = resolve(vendor, name);
    assert.ok(existsSync(file), `Arquivo obrigatório: ${name}`);
    assert.deepEqual(
      readFileSync(file),
      readFileSync(resolve(root, "docs/public/admin/vendor", name)),
    );
  }
  const license = readFileSync(
    resolve(vendor, "qrcode-generator-LICENSE"),
    "utf8",
  );
  assert.match(license, /MIT|Permission is hereby granted/);
  const readme = readFileSync(resolve(vendor, "README.md"), "utf8");
  assert.match(readme, /qrcode-generator.*1\.4\.4/s);
  assert.match(
    readme,
    /https:\/\/registry\.npmjs\.org\/qrcode-generator\/-\/qrcode-generator-1\.4\.4\.tgz/,
  );
  for (const name of [
    "qrcode-generator-1.4.4.js",
    "qrcode-generator-LICENSE",
  ]) {
    const hash = createHash("sha256")
      .update(readFileSync(resolve(vendor, name)))
      .digest("hex");
    assert.ok(readme.includes(hash), `SHA-256 documentado: ${name}`);
  }
});

test("biblioteca funciona sem dependências e representa o endereço público em matriz e SVG", () => {
  assert.ok(
    existsSync(resolve(vendor, "qrcode-generator-1.4.4.js")),
    "Biblioteca QR ausente",
  );
  const context = vm.createContext({});
  vm.runInContext(
    readFileSync(resolve(vendor, "qrcode-generator-1.4.4.js"), "utf8"),
    context,
  );
  assert.equal(typeof context.qrcode, "function");
  const qr = context.qrcode(0, "M");
  qr.addData("https://csv.online/conteudo");
  qr.make();
  assert.ok(qr.getModuleCount() >= 21);
  assert.equal(qr.isDark(0, 0), true);
  assert.equal(qr.isDark(1, 1), false);
  assert.match(
    qr.createSvgTag({ cellSize: 8, margin: 32, scalable: true }),
    /^<svg /,
  );
  const other = context.qrcode(0, "M");
  other.addData("https://example.com/destino");
  other.make();
  assert.notEqual(
    qr.createSvgTag(),
    other.createSvgTag(),
    "Endereço público e destino devem produzir símbolos diferentes",
  );
});
