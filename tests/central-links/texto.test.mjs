import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const file of ["central-links.js", "central-links-sections.js"]) {
  test(`${file}: textos usam singular e plural sem terminações entre parênteses`, () => {
    const source = readFileSync(new URL(`../../admin/${file}`, import.meta.url), "utf8");
    const literals = source.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/gs) || [];
    assert.equal(literals.filter((text) => /\((?:s|ns)\)/.test(text)).length, 0);
  });
}
