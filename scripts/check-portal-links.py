#!/usr/bin/env python3
"""
check-portal-links.py
Guard-rail de links mortos nos portais do Hub CSV.

Verifica três coisas:
1. Para cada portal (unimed, unihealth, icds, axia, medvalor, thera) que
   tenha index.html na raiz, extrai todos os href de <a> locais terminando
   em .html — relativos (resolvidos contra o diretório do portal) e
   absolutos iniciando com "/" (resolvidos contra a raiz do repositório) —
   e confere se o arquivo existe. Esquemas externos (http(s)://, mailto:,
   tel:, //host) e âncoras "#" são ignorados.
2. O mesmo para os índices VitePress servidos em produção
   (docs/{portal}/index.md) — são eles que o deploy publica por cima dos
   index.html estáticos, então a superfície REAL também precisa de cobertura.
   Hrefs de template JS (contendo "${") são ignorados.
3. Para cada entrada de p/registry.json com campo origin_page, confere se
   o arquivo {origin_portal}/{origin_page} existe.

Sai com código 1 listando cada link morto; código 0 se tudo ok.
Executado no CI (deploy.yml) antes do build. Sem dependências externas.

Uso: python3 scripts/check-portal-links.py [raiz-do-repo]
"""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

REPO_ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent)

PORTALS = ["unimed", "unihealth", "icds", "axia", "medvalor", "thera"]
REGISTRY_PATH = REPO_ROOT / "p" / "registry.json"


class AnchorHrefParser(HTMLParser):
    """Coleta os valores de href de todas as tags <a> do documento."""

    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        for name, value in attrs:
            if name == "href" and value:
                self.hrefs.append(value)


def local_html_path(href):
    """
    Classifica um href local que termina em .html.

    Retorna ("rel", caminho) para relativo, ("abs", caminho-sem-barra) para
    absoluto local iniciando com "/", ou None para tudo que não é link local
    de página (esquemas externos, âncoras, templates JS, não-.html).
    """
    href = href.strip()
    if not href or href.startswith("#") or "${" in href:
        return None
    parts = urlsplit(href)
    if parts.scheme or parts.netloc:
        # http(s)://, mailto:, tel:, //host/... etc.
        return None
    path = unquote(parts.path)
    if not path.endswith(".html"):
        return None
    if path.startswith("/"):
        return ("abs", path.lstrip("/"))
    return ("rel", path)


def resolve_target(kind, path, base_dir):
    """Resolve o caminho de um href contra o portal (rel) ou a raiz (abs)."""
    return (REPO_ROOT / path) if kind == "abs" else (base_dir / path)


def check_hrefs(hrefs, base_dir, source_label):
    """Confere a existência dos alvos locais de uma lista de hrefs."""
    errors = []
    for href in hrefs:
        classified = local_html_path(href)
        if classified is None:
            continue
        kind, path = classified
        target = resolve_target(kind, path, base_dir)
        if not target.is_file():
            shown = path if kind == "abs" else f"{base_dir.name}/{path}"
            errors.append(
                f'{source_label}: href="{href}" aponta para {shown}, que não existe'
            )
    return errors


def check_portal_index(portal):
    """Verifica os hrefs locais do index.html estático de um portal."""
    portal_dir = REPO_ROOT / portal
    index_path = portal_dir / "index.html"
    if not index_path.is_file():
        return []
    parser = AnchorHrefParser()
    parser.feed(index_path.read_text(encoding="utf-8"))
    return check_hrefs(parser.hrefs, portal_dir, f"{portal}/index.html")


def check_portal_docs_index(portal):
    """
    Verifica os hrefs dos índices VitePress (docs/{portal}/index.md) — a
    versão servida em produção. O .md mistura HTML, Vue e JS; extraímos os
    href="..." por regex (o filtro de "${" descarta os de template JS).
    """
    md_path = REPO_ROOT / "docs" / portal / "index.md"
    if not md_path.is_file():
        return []
    content = md_path.read_text(encoding="utf-8")
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', content)
    return check_hrefs(hrefs, REPO_ROOT / portal, f"docs/{portal}/index.md")


def check_registry():
    """Verifica se cada origin_page do p/registry.json existe no repositório."""
    errors = []
    if not REGISTRY_PATH.is_file():
        return errors

    try:
        data = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"p/registry.json: JSON inválido ({exc})"]

    for i, page in enumerate(data.get("pages", [])):
        origin_page = page.get("origin_page")
        if not origin_page:
            continue
        origin_portal = page.get("origin_portal", "")
        target = REPO_ROOT / origin_portal / origin_page if origin_portal else REPO_ROOT / origin_page
        if not target.is_file():
            slug = page.get("slug", f"entrada #{i}")
            rel = f"{origin_portal}/{origin_page}" if origin_portal else origin_page
            errors.append(
                f'p/registry.json ({slug}): origin_page "{origin_page}" '
                f"aponta para {rel}, que não existe"
            )
    return errors


def main():
    errors = []
    for portal in PORTALS:
        errors.extend(check_portal_index(portal))
        errors.extend(check_portal_docs_index(portal))
    errors.extend(check_registry())

    if errors:
        print(f"ERRO: {len(errors)} link(s) morto(s) encontrado(s):")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("OK: nenhum link morto nos portais nem no p/registry.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
