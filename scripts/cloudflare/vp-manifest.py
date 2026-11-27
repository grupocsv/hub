#!/usr/bin/env python3
"""Grava a lista dos arquivos que o VitePress gerou (caminho e sha256).

Roda logo depois do build padrao e antes da copia dos modulos estaticos.
O overlay-scopes.py usa essa lista para saber, no artefato final do Pages,
quais arquivos vieram do VitePress (e serao trocados pelos builds por
escopo) e quais vieram dos modulos estaticos (e ficam como estao).
"""
import hashlib
import json
import sys
from pathlib import Path


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def build_manifest(root: Path) -> dict:
    return {
        p.relative_to(root).as_posix(): sha256(p)
        for p in sorted(root.rglob("*"))
        if p.is_file()
    }


def main() -> int:
    if len(sys.argv) != 3:
        print("uso: vp-manifest.py <dist do VitePress> <saida.json>", file=sys.stderr)
        return 2
    root, out = Path(sys.argv[1]), Path(sys.argv[2])
    manifest = build_manifest(root)
    out.write_text(json.dumps(manifest, indent=0, sort_keys=True))
    print(f"{len(manifest)} arquivos do VitePress registrados em {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
