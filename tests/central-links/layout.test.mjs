import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerRule = `
@media (max-width: 390px) {
  .topbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .topbar-actions {
    flex-wrap: wrap;
  }
}`;
const compact = (value) => value.replace(/\s+/g, "");

test("H4: a quebra do cabeçalho pertence ao estilo geral do Admin", async () => {
  for (const prefix of ["admin", "docs/public/admin"]) {
    const html = await readFile(
      new URL(`../../${prefix}/index.html`, import.meta.url),
      "utf8",
    );
    const css = await readFile(
      new URL(`../../${prefix}/central-links.css`, import.meta.url),
      "utf8",
    );
    const inline = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || "";
    assert.ok(
      compact(inline).includes(compact(headerRule)),
      `${prefix}: a regra do cabeçalho deve estar no estilo geral.`,
    );
    assert.doesNotMatch(css, /\.topbar(?:-actions)?\b/);
  }
});
