import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load(name, rel):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


overlay = load("overlay_scopes", "scripts/cloudflare/overlay-scopes.py")
vpman = load("vp_manifest", "scripts/cloudflare/vp-manifest.py")


def write(root: Path, rel: str, text: str) -> None:
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)


def page(assets: str) -> str:
    return f'<script type="module" src="/{assets}/app.X.js"></script><link href="/{assets}/style.X.css">'


class OverlayScopesTest(unittest.TestCase):
    def build(self, tmp: Path, infra_assets="_infra/_static"):
        vp = tmp / "vp"  # build padrao (o de hoje)
        write(vp, "index.html", page("assets"))
        write(vp, "_infra/index.html", page("assets"))
        write(vp, "founder/index.html", page("assets"))
        write(vp, "compass/index.html", page("assets"))
        write(vp, "unimed/index.html", page("assets"))
        write(vp, "assets/app.OLD.js", "tudo junto: _infra founder compass")
        write(vp, "robots.txt", "User-agent: *")
        manifest = vpman.build_manifest(vp)

        pages = tmp / "pages"  # artefato final do Pages
        for p in vp.rglob("*"):
            if p.is_file():
                write(pages, p.relative_to(vp).as_posix(), p.read_text())
        write(pages, "assets/logo.png", "repo")          # assets do repositorio
        write(pages, "admin/index.html", "admin estatico")
        write(pages, "founder/index.html", page("assets"))  # restaurado igual
        write(pages, "founder/carta.html", "estatico do fundador")

        scopes = tmp / "scopes"
        write(scopes, "dist-main/index.html", page("_main/_static"))
        write(scopes, "dist-main/_infra/index.html", "nao deveria entrar")
        write(scopes, "dist-main/_main/_static/app.M.js", "main")
        write(scopes, "dist-main/robots.txt", "User-agent: *")
        write(scopes, "dist-infra/_infra/index.html", page(infra_assets))
        write(scopes, "dist-infra/_infra/_static/app.I.js", "infra")
        write(scopes, "dist-infra/assets/logo.png", "copia de docs/public")
        write(scopes, "dist-founder/founder/index.html", page("founder/_static"))
        write(scopes, "dist-founder/founder/_static/app.F.js", "founder")
        write(scopes, "dist-public/compass/index.html", page("_public/_static"))
        write(scopes, "dist-public/_public/_static/app.P.js", "public")
        write(pages, "unimed/index.html", page("assets"))
        write(pages, "unimed/drg.html", "estatico do portal")
        write(scopes, "dist-unimed/unimed/index.html", page("unimed/_static"))
        write(scopes, "dist-unimed/unimed/_static/app.U.js", "unimed")
        for portal in ("unihealth", "icds"):
            (scopes / f"dist-{portal}").mkdir(parents=True)
        dirs = {s: scopes / f"dist-{s}" for s in overlay.SCOPES}
        return pages, manifest, dirs

    def test_assembles_scopes_and_keeps_static_files(self):
        with tempfile.TemporaryDirectory() as t:
            tmp = Path(t)
            pages, manifest, dirs = self.build(tmp)
            out = tmp / "out"
            report = overlay.assemble(pages, manifest, dirs, out)
            self.assertEqual(report["errors"], [])
            self.assertFalse((out / "assets/app.OLD.js").exists())
            self.assertEqual((out / "assets/logo.png").read_text(), "repo")
            self.assertEqual((out / "admin/index.html").read_text(), "admin estatico")
            self.assertEqual((out / "founder/carta.html").read_text(), "estatico do fundador")
            self.assertIn("/_infra/_static/", (out / "_infra/index.html").read_text())
            self.assertIn("/founder/_static/", (out / "founder/index.html").read_text())
            self.assertIn("/_public/_static/", (out / "compass/index.html").read_text())
            self.assertTrue((out / "_public/_static/app.P.js").exists())
            self.assertEqual((out / "robots.txt").read_text(), "User-agent: *")
            self.assertIn("/unimed/_static/", (out / "unimed/index.html").read_text())
            self.assertEqual((out / "unimed/drg.html").read_text(), "estatico do portal")
            self.assertTrue((out / "_main/_static/app.M.js").exists())

    def test_fails_when_page_loads_code_of_another_scope(self):
        with tempfile.TemporaryDirectory() as t:
            tmp = Path(t)
            pages, manifest, dirs = self.build(tmp, infra_assets="assets")
            report = overlay.assemble(pages, manifest, dirs, tmp / "out")
            self.assertTrue(any("_infra/index.html" in e for e in report["errors"]))

    def test_fails_when_vitepress_page_has_no_replacement(self):
        with tempfile.TemporaryDirectory() as t:
            tmp = Path(t)
            pages, manifest, dirs = self.build(tmp)
            (dirs["public"] / "compass/index.html").unlink()
            report = overlay.assemble(pages, manifest, dirs, tmp / "out")
            self.assertIn("arquivo do VitePress sem substituto: compass/index.html", report["errors"])


if __name__ == "__main__":
    unittest.main()
