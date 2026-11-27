import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "check_scope_leaks", Path(__file__).resolve().parents[2] / "scripts/cloudflare/check-scope-leaks.py"
)
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)

PAGES = {
    "main": ["index.md", "axia_index.md"],
    "infra": ["infra_index.md"],
    "founder": ["founder_index.md"],
    "public": ["compass_index.md", "compliance_index.md"],
    "unimed": ["unimed_index.md"],
    "unihealth": ["unihealth_index.md"],
    "icds": ["icds_index.md"],
}
DOCS = {
    "main": ["/", "/axia/"],
    "infra": ["/_infra/"],
    "founder": [],
    "public": ["/compass/", "/compliance/"],
    "unimed": [],
    "unihealth": [],
    "icds": [],
}


def make(root: Path, leak_into_main: bool = False, leak_between_portals: bool = False) -> None:
    for scope, keys in PAGES.items():
        dist = root / f"dist-{scope}"
        assets = dist / mod.SCOPE_ASSETS[scope]
        (assets / "chunks").mkdir(parents=True)
        hashmap = {k: "h" for k in keys}
        ids = list(DOCS[scope])
        code = "".join(f"import('./{k}.h.js');" for k in keys)
        if scope == "main" and leak_into_main:
            hashmap["infra_index.md"] = "h"
            ids.append("/_infra/#segredo")
            code += "import('./infra_index.md.h.js');"
        if scope == "unimed" and leak_between_portals:
            hashmap["unihealth_index.md"] = "h"
            code += "import('./unihealth_index.md.h.js');"
        (dist / "hashmap.json").write_text(json.dumps(hashmap))
        index = json.dumps({"documentIds": {str(i): d for i, d in enumerate(ids)}})
        (assets / "chunks/@localSearchIndexroot.h.js").write_text(f"const e='{index}';export{{e as default}};")
        (assets / "app.h.js").write_text(code)


class CheckScopeLeaksTest(unittest.TestCase):
    def test_every_configured_scope_is_covered(self):
        self.assertEqual(sorted(PAGES), sorted(mod.SCOPES))

    def test_clean_scopes_pass(self):
        with tempfile.TemporaryDirectory() as t:
            make(Path(t))
            self.assertEqual(mod.check(Path(t)), [])

    def test_infra_page_in_main_is_reported(self):
        with tempfile.TemporaryDirectory() as t:
            make(Path(t), leak_into_main=True)
            errors = mod.check(Path(t))
            self.assertTrue(any("main: paginas de outro escopo" in e for e in errors))
            self.assertTrue(any("main: busca com paginas de outro escopo" in e for e in errors))
            self.assertTrue(any("main: codigo de paginas do escopo infra" in e for e in errors))

    def test_other_portal_page_in_a_portal_is_reported(self):
        with tempfile.TemporaryDirectory() as t:
            make(Path(t), leak_between_portals=True)
            errors = mod.check(Path(t))
            self.assertTrue(any("unimed: paginas de outro escopo" in e for e in errors))
            self.assertTrue(any("unimed: codigo de paginas do escopo unihealth" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
