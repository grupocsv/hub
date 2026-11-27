#!/usr/bin/env python3
"""Monta o artefato do Cloudflare a partir do artefato do Pages e dos
quatro builds por escopo (main, infra, founder, public).

Regras:
- Arquivo do artefato do Pages que o VitePress gerou e ninguem alterou
  depois (mesmo sha256 do manifesto do build padrao) e trocado pela versao
  do build do seu escopo.
- Qualquer outro arquivo do artefato do Pages (modulos estaticos, assets do
  repositorio, PDFs, paginas copiadas por cima) fica exatamente como esta.
- De cada build por escopo entram so a pasta de arquivos do escopo e as
  paginas .html que pertencem a ele. Arquivos de docs/public vem do main.

O script falha se algum arquivo do VitePress ficar sem substituto, se um
arquivo estatico mudar, ou se uma pagina de um escopo carregar o JavaScript
de outro escopo.
"""
import argparse
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

SCOPES_FILE = Path(__file__).resolve().parents[2] / "docs/.vitepress/scopes.json"
_SCOPES = json.loads(SCOPES_FILE.read_text(encoding="utf-8"))
SCOPE_OWNED: dict = _SCOPES["owned"]
SCOPE_ASSETS: dict = _SCOPES["assets"]
SCOPES: list = _SCOPES["order"]
# Pasta dos chunks do build padrao (GitHub Pages).
DEFAULT_ASSETS: str = _SCOPES["default_assets"]
# Pastas de JavaScript e CSS geradas pelo VitePress em cada escopo.
VP_CODE = re.compile(r'(?:src|href)="(/[^"]*?/(?:chunks|app\.[^"/]+\.js|style\.[^"/]+\.css)[^"]*)"')


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def owner_of(rel: str) -> str:
    first = rel.lstrip("/").split("/")[0]
    for scope, dirs in SCOPE_OWNED.items():
        if first in dirs:
            return scope
    for scope, assets in SCOPE_ASSETS.items():
        if first == assets.split("/")[0] and assets.startswith("_"):
            return scope
    return "main"


def in_assets(rel: str, scope: str) -> bool:
    return rel.startswith(SCOPE_ASSETS[scope] + "/")


def wanted_from_scope(rel: str, scope: str) -> bool:
    """Arquivo do build `scope` que vai para o artefato final."""
    if in_assets(rel, scope):
        return True
    if any(in_assets(rel, other) for other in SCOPES if other != scope):
        return False
    if rel.endswith(".html"):
        return owner_of(rel) == scope
    # Demais arquivos (docs/public, hashmap.json, vp-icons.css) vem do main.
    return scope == "main"


def assemble(pages: Path, manifest: dict, scope_dirs: dict, out: Path) -> dict:
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    report = {"kept_static": 0, "replaced_vitepress": 0, "from_scope": {}, "errors": []}

    kept: set[str] = set()
    dropped: set[str] = set()
    for p in sorted(pages.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(pages).as_posix()
        if manifest.get(rel) == sha256(p):
            dropped.add(rel)
            continue
        target = out / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, target)
        kept.add(rel)
    report["kept_static"] = len(kept)

    placed: set[str] = set()
    for scope in SCOPES:
        root = scope_dirs[scope]
        count = 0
        for p in sorted(root.rglob("*")):
            if not p.is_file():
                continue
            rel = p.relative_to(root).as_posix()
            if not wanted_from_scope(rel, scope):
                continue
            if rel in kept:
                # Arquivo estatico copiado por cima no Pages: vale o estatico.
                continue
            if rel in placed:
                report["errors"].append(f"arquivo vindo de dois escopos: {rel}")
                continue
            target = out / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, target)
            placed.add(rel)
            count += 1
        report["from_scope"][scope] = count

    # Paginas e arquivos do VitePress padrao sem substituto. Os chunks do
    # build padrao em /assets/ tem nomes com hash e sao trocados pelos dos
    # escopos, por isso nao contam.
    vp_assets = DEFAULT_ASSETS + "/"
    missing = sorted(
        r for r in dropped if r not in placed and not r.startswith(vp_assets)
    )
    for r in missing:
        report["errors"].append(f"arquivo do VitePress sem substituto: {r}")
    report["replaced_vitepress"] = len(dropped)

    # Arquivos estaticos identicos ao artefato do Pages.
    for rel in kept:
        if sha256(out / rel) != sha256(pages / rel):
            report["errors"].append(f"arquivo estatico alterado: {rel}")

    # Cada pagina do VitePress carrega so o codigo do proprio escopo.
    for rel in sorted(placed):
        if not rel.endswith(".html"):
            continue
        scope = owner_of(rel)
        own = "/" + SCOPE_ASSETS[scope] + "/"
        html = (out / rel).read_text(encoding="utf-8", errors="ignore")
        for ref in VP_CODE.findall(html):
            if not ref.startswith(own):
                report["errors"].append(f"{rel} carrega codigo de outro escopo: {ref}")
                break
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--pages", required=True, type=Path, help="artefato final do Pages")
    ap.add_argument("--manifest", required=True, type=Path, help="saida do vp-manifest.py")
    ap.add_argument("--scopes", required=True, type=Path, help="pasta com dist-main, dist-infra...")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--report", type=Path)
    args = ap.parse_args()

    manifest = json.loads(args.manifest.read_text())
    scope_dirs = {s: args.scopes / f"dist-{s}" for s in SCOPES}
    for s, d in scope_dirs.items():
        if not d.is_dir():
            print(f"build do escopo {s} ausente: {d}", file=sys.stderr)
            return 1
    report = assemble(args.pages, manifest, scope_dirs, args.out)
    text = json.dumps(report, indent=2, ensure_ascii=False)
    if args.report:
        args.report.write_text(text)
    print(text)
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
