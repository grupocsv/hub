#!/usr/bin/env python3
"""Gera as copias para Open Pages (open.grupocsv.com) do Painel TEA e do
Data Set TEA, a partir das copias abertas que ja existem no Hub (/p/).

Estas duas paginas sao usadas por clientes (Unimed GV, ICDS, Neurosteps e
operadoras do Data Set) e saem do Hub, que passa a ser so interno. O login
de cada uma continua o mesmo: o painel usa o unimed-te-data com o
csv-open-auth; o Data Set usa as senhas por unidade do csv-auth.

Uso:
  python3 scripts/build-open-pages.py           # grava open-pages/
  python3 scripts/build-open-pages.py --check   # falha se open-pages/ estiver desatualizado
"""
import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "open-pages"
HUB = "https://hub.grupocsv.com"
OPEN = "https://open.grupocsv.com"


def painel_tea(html: str) -> str:
    html = html.replace(f'content="{HUB}/p/painel-tea/"', f'content="{OPEN}/painel-tea/"')
    # Icones ficam no Hub, em caminho publico.
    html = html.replace('href="/favicons/', f'href="{HUB}/favicons/')
    return html


def tea_dataset(html: str) -> str:
    html = html.replace(f"{HUB}/p/tea-dataset/", f"{OPEN}/tea-dataset/")
    html = html.replace("'/p/tea-dataset/", "'/tea-dataset/")
    html = html.replace('href="/p/tea-dataset/"', 'href="/tea-dataset/"')
    html = html.replace('href="/assets/favicons/', f'href="{HUB}/assets/favicons/')
    return html


PAGES = {
    "painel-tea": (ROOT / "p/painel-tea", painel_tea),
    "tea-dataset": (ROOT / "p/tea-dataset", tea_dataset),
}

# Restos que nao podem sobrar na copia: apontariam para o Hub fechado.
FORBIDDEN = [f"{HUB}/p/", "hub-auth.js", "'/p/tea-dataset", '"/p/tea-dataset']


def build() -> dict[str, dict[str, bytes]]:
    out: dict[str, dict[str, bytes]] = {}
    for slug, (src, transform) in PAGES.items():
        files: dict[str, bytes] = {}
        html = transform((src / "index.html").read_text(encoding="utf-8"))
        bad = [f for f in FORBIDDEN if f in html]
        if bad:
            raise SystemExit(f"{slug}: copia ainda contem {bad}")
        files["index.html"] = html.encode("utf-8")
        for extra in sorted(src.iterdir()):
            if extra.name != "index.html" and extra.is_file():
                files[extra.name] = extra.read_bytes()
        out[slug] = files
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    built = build()
    if args.check:
        stale = [
            f"{slug}/{name}"
            for slug, files in built.items()
            for name, data in files.items()
            if not (OUT / slug / name).is_file() or (OUT / slug / name).read_bytes() != data
        ]
        if stale:
            print("open-pages desatualizado; rode scripts/build-open-pages.py:", ", ".join(stale))
            return 1
        print("open-pages em dia.")
        return 0
    if OUT.exists():
        for slug in built:
            shutil.rmtree(OUT / slug, ignore_errors=True)
    for slug, files in built.items():
        (OUT / slug).mkdir(parents=True, exist_ok=True)
        for name, data in files.items():
            (OUT / slug / name).write_bytes(data)
        print(f"open-pages/{slug}: {len(files)} arquivo(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
