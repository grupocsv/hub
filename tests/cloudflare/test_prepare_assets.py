import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "prepare_assets", Path(__file__).resolve().parents[2] / "scripts/cloudflare/prepare-assets.py"
)
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


class PrepareAssetsTest(unittest.TestCase):
    def test_moves_oversized_to_redirects_and_skips_cname(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "dist"
            (src / "assets").mkdir(parents=True)
            (src / "index.html").write_text("ok")
            (src / "CNAME").write_text("hub.grupocsv.com")
            big = src / "assets" / "big.pdf"
            with big.open("wb") as fh:
                fh.seek(mod.MAX_FILE_BYTES)
                fh.write(b"\0")
            out = Path(tmp) / "out"
            report = mod.prepare(src, out, "https://assets.example/hub/")
            self.assertTrue((out / "index.html").exists())
            self.assertFalse((out / "CNAME").exists())
            self.assertFalse((out / "assets" / "big.pdf").exists())
            self.assertEqual(
                (out / "_redirects").read_text().strip(),
                "/assets/big.pdf https://assets.example/hub/assets/big.pdf 302",
            )
            self.assertEqual(report["files"], 2)
            self.assertEqual(report["oversized_redirected"][0]["path"], "/assets/big.pdf")
            self.assertTrue(report["within_file_limit"])

    def test_keeps_existing_redirects(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "dist"
            src.mkdir()
            (src / "_redirects").write_text("/old /new 301\n")
            out = Path(tmp) / "out"
            report = mod.prepare(src, out, "https://assets.example/hub")
            self.assertEqual((out / "_redirects").read_text(), "/old /new 301\n")
            self.assertEqual(report["files"], 1)


class ExtraRedirectsTest(unittest.TestCase):
    def test_hub_rules_come_first_and_keep_oversized(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "dist"
            (src / "assets").mkdir(parents=True)
            (src / "index.html").write_text("ok")
            big = src / "assets" / "big.pdf"
            with big.open("wb") as fh:
                fh.seek(mod.MAX_FILE_BYTES)
                fh.write(b"\0")
            rules = Path(tmp) / "rules"
            rules.write_text("# comentario\n\n/p/x https://open.example/x/ 302\n")
            out = Path(tmp) / "out"
            report = mod.prepare(src, out, "https://assets.example/hub", mod.read_extra_redirects(rules))
            self.assertEqual(
                (out / "_redirects").read_text().splitlines(),
                ["/p/x https://open.example/x/ 302", "/assets/big.pdf https://assets.example/hub/assets/big.pdf 302"],
            )
            self.assertEqual(report["extra_redirects"], 1)

    def test_rejects_malformed_rule(self):
        with tempfile.TemporaryDirectory() as tmp:
            rules = Path(tmp) / "rules"
            rules.write_text("p/x https://open.example/x/\n")
            with self.assertRaises(SystemExit):
                mod.read_extra_redirects(rules)

    def test_repository_rules_are_valid(self):
        rules = mod.read_extra_redirects(Path(__file__).resolve().parents[2] / "cloudflare/hub-redirects")
        self.assertIn("/p/tea-dataset/* https://open.grupocsv.com/tea-dataset/:splat 302", rules)
        for rule in rules:
            self.assertTrue(rule.split()[1].startswith("https://open.grupocsv.com/"), rule)


if __name__ == "__main__":
    unittest.main()
