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
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "open-pages"
HUB = "https://hub.grupocsv.com"
OPEN = "https://open.grupocsv.com"


PAINEL_ABERTA = "const paginaAberta = () => window.location.pathname.includes('/p/painel-tea/');"
PAINEL_ABERTA_OPEN = (
    "const paginaAberta = () => window.location.pathname.includes('/p/painel-tea/')\n"
    "    || (window.location.hostname === 'open.grupocsv.com'"
    " && window.location.pathname.startsWith('/painel-tea'));"
)


def painel_tea(html: str) -> str:
    # O painel so mostra o login proprio (csv-open-auth) na copia aberta.
    # A fonte unimed/tea.html fica intocada (baseline do catalogo do portal);
    # a deteccao do endereco da Open Page entra so nesta copia.
    if html.count(PAINEL_ABERTA) != 1:
        raise SystemExit("painel-tea: deteccao da copia aberta nao encontrada em p/painel-tea/index.html")
    html = html.replace(PAINEL_ABERTA, PAINEL_ABERTA_OPEN)
    html = html.replace(f'content="{HUB}/p/painel-tea/"', f'content="{OPEN}/painel-tea/"')
    # Icones e imagem de previa vao junto da pagina: nada depende do Hub.
    html = html.replace('href="/favicons/', 'href="/painel-tea/')
    html = html.replace(f'content="{HUB}/og/og_unimed.png"', f'content="{OPEN}/painel-tea/og.png"')
    return html


def tea_dataset(html: str) -> str:
    html = html.replace(f"{HUB}/p/tea-dataset/", f"{OPEN}/tea-dataset/")
    html = html.replace("'/p/tea-dataset/", "'/tea-dataset/")
    html = html.replace('href="/p/tea-dataset/"', 'href="/tea-dataset/"')
    html = html.replace('href="/assets/favicons/', 'href="/tea-dataset/')
    # Logos com endereco do Hub passam a arquivos ao lado da pagina.
    for src_path, name in DATASET_LOGOS.items():
        html = html.replace(f'"/{src_path}"', f'"/tea-dataset/{name}"')
    # og_icds.png nunca existiu no Hub (previa quebrada hoje). Sem imagem
    # propria, as Open Pages usam o card generico do Grupo CSV.
    for tag in (
        f'  <meta property="og:image" content="{HUB}/og/og_icds.png">\n',
        f'  <meta name="twitter:image" content="{HUB}/og/og_icds.png">\n',
    ):
        if html.count(tag) != 1:
            raise SystemExit(f"tea-dataset: marcacao esperada nao encontrada: {tag.strip()}")
        html = html.replace(tag, "")
    # O navegador ignora este cabecalho; fica a origem certa para quem le o codigo.
    html = html.replace(f"'Origin': '{HUB}'", f"'Origin': '{OPEN}'")
    return html


FAVICONS = ["favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png"]
DATASET_LOGOS = {
    "visual-identity/icds/logo/png/icds_horizontal_sem_fundo_negativo.png": "icds_horizontal_sem_fundo_negativo.png",
    "visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_negative_transparent.png": "grupo-csv_logo_horizontal_full-color_negative_transparent.png",
    "visual-identity/axiacare/logo/svg/axiacare_logo_horizontal_monochrome_negative.svg": "axiacare_logo_horizontal_monochrome_negative.svg",
    "visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_positive.png": "axiacare_logo_horizontal_full-color_positive.png",
}
PUBLIC = ROOT / "docs/public"
# Arquivos copiados do Hub para junto de cada pagina (nome final -> origem).
EXTRA_FILES = {
    "painel-tea": {
        **{n: PUBLIC / "favicons" / n for n in FAVICONS},
        "og.png": PUBLIC / "og/og_unimed.png",
    },
    "tea-dataset": {
        **{n: ROOT / "assets/favicons" / n for n in FAVICONS},
        **{name: PUBLIC / src for src, name in DATASET_LOGOS.items()},
    },
}


PAGES = {
    "painel-tea": (ROOT / "p/painel-tea", painel_tea),
    "tea-dataset": (ROOT / "p/tea-dataset", tea_dataset),
}

# Restos que nao podem sobrar na copia: apontariam para o Hub fechado.
FORBIDDEN = [HUB, "hub-auth.js", "'/p/tea-dataset", '"/p/tea-dataset', '"/visual-identity/', '"/favicons/', '"/assets/']


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
        for name, origin in EXTRA_FILES[slug].items():
            if name in files:
                raise SystemExit(f"{slug}: nome repetido {name}")
            files[name] = origin.read_bytes()
        # Todo arquivo citado pela pagina com /{slug}/nome precisa existir aqui.
        for ref in set(re.findall(rf'["\']/{slug}/([A-Za-z0-9._-]+\.(?:png|svg|ico|jpg|webp))', html)):
            if ref not in files:
                raise SystemExit(f"{slug}: a pagina cita /{slug}/{ref}, que nao foi copiado")
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
