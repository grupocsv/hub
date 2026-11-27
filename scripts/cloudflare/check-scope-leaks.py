#!/usr/bin/env python3
"""Confere que nenhum build por escopo leva paginas, busca ou codigo de
outro escopo. Roda sobre a pasta com dist-main, dist-infra, dist-founder e
dist-public. Sai com erro ao primeiro vazamento encontrado em cada escopo.
"""
import json
import re
import sys
from pathlib import Path

SCOPES = ["main", "infra", "founder", "public"]
SCOPE_ASSETS = {
    "main": "assets",
    "infra": "_infra/_static",
    "founder": "founder/_static",
    "public": "_public/_static",
}
KEY_PREFIX = {"infra": ["infra_"], "founder": ["founder_"], "public": ["compass_", "signal_"]}
PATH_OWNER = {"_infra": "infra", "founder": "founder", "compass": "public", "signal": "public"}


def key_owner(key: str) -> str:
    for scope, prefixes in KEY_PREFIX.items():
        if any(key.startswith(p) for p in prefixes):
            return scope
    return "main"


def path_owner(path: str) -> str:
    return PATH_OWNER.get(path.lstrip("/").split("/")[0], "main")


def search_ids(assets: Path) -> list[str]:
    ids: list[str] = []
    for f in assets.glob("chunks/@localSearchIndex*.js"):
        m = re.search(r"const \w+='(.*)';export", f.read_text(encoding="utf-8"), re.S)
        if not m:
            raise ValueError(f"indice de busca em formato inesperado: {f}")
        raw = m.group(1).encode("utf-8").decode("unicode_escape").encode("latin-1").decode("utf-8")
        ids.extend(json.loads(raw)["documentIds"].values())
    return ids


def check(root: Path) -> list[str]:
    errors: list[str] = []
    keys = {s: set(json.loads((root / f"dist-{s}/hashmap.json").read_text())) for s in SCOPES}
    for scope in SCOPES:
        dist = root / f"dist-{scope}"
        assets = dist / SCOPE_ASSETS[scope]
        wrong = sorted(k for k in keys[scope] if key_owner(k) != scope)
        if wrong:
            errors.append(f"{scope}: paginas de outro escopo no build: {wrong[:5]}")
        ids = search_ids(assets)
        # A unica pagina do fundador usa layout proprio e fica fora da busca.
        if not ids and scope != "founder":
            errors.append(f"{scope}: indice de busca vazio ou ausente")
        foreign_ids = sorted({i.split("#")[0] for i in ids if path_owner(i) != scope})
        if foreign_ids:
            errors.append(f"{scope}: busca com paginas de outro escopo: {foreign_ids[:5]}")
        blob = "".join(
            p.read_text(encoding="utf-8", errors="ignore")
            for p in assets.rglob("*")
            if p.is_file() and p.suffix in {".js", ".css", ".json"}
        )
        for other in SCOPES:
            if other == scope:
                continue
            hits = sorted(
                k for k in keys[other]
                if re.search(r"(?<![\w-])" + re.escape(k) + r"\.", blob)
            )
            if hits:
                errors.append(f"{scope}: codigo de paginas do escopo {other}: {hits[:5]}")
    return errors


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "docs/.vitepress")
    errors = check(root)
    for e in errors:
        print(f"::error::{e}")
    if not errors:
        print("Nenhum vazamento entre escopos.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
