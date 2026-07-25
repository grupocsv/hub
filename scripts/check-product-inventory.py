#!/usr/bin/env python3
"""Valida a consistência transversal do catálogo de produtos do Hub CSV."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "_infra" / "csv-core" / "produtos-grupo.json"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def infra_doc_path(route: str) -> Path:
    return ROOT / "docs" / f"{route.removeprefix('/').removesuffix('/')}.md"


def main() -> int:
    payload = json.loads(REGISTRY.read_text(encoding="utf-8"))
    products = payload.get("products", [])
    errors: list[str] = []

    expected_ids = [
        "compass",
        "signal",
        "cmm",
        "themis",
        "deck",
        "relay",
        "rtav",
        "panta",
        "discovery",
    ]
    ids = [product.get("id") for product in products]
    names = [product.get("name") for product in products]
    if ids != expected_ids:
        errors.append(f"IDs ou ordem canônica divergentes: {ids!r}")
    if len(ids) != len(set(ids)):
        errors.append("há IDs duplicados no inventário")
    if len(names) != len(set(names)):
        errors.append("há nomes duplicados no inventário")

    home = read("docs/index.md")
    infra = read("docs/_infra/index.md")
    config = read("docs/.vitepress/config.mts")
    nav = config.split("sidebar:", 1)[0]
    readme = read("README.md")
    taxonomy = read("_infra/csv-core/taxonomia-produtos.md")
    axia_sources = {
        "docs/axia/index.md": read("docs/axia/index.md"),
        "axia/index.html": read("axia/index.html"),
    }
    admin = read("admin/index.html")
    admin_mirror = read("docs/public/admin/index.html")

    product_tags = re.findall(r'<a\b[^>]*\bdata-product-id="[^"]+"[^>]*>[^<]+</a>', home)
    if len(product_tags) != len(products):
        errors.append(f"a grade principal deve ter {len(products)} produtos; encontrou {len(product_tags)}")

    for product in products:
        product_id = product["id"]
        marker = f'data-product-id="{product_id}"'
        if home.count(marker) != 1:
            errors.append(f"{product_id}: ausente ou duplicado na grade principal")
            continue

        tag = next((candidate for candidate in product_tags if marker in candidate), "")
        if f'href="{product["url"]}"' not in tag:
            errors.append(f"{product_id}: URL da grade diverge do inventário")
        if f'>{product["name"]}</a>' not in tag:
            errors.append(f"{product_id}: nome da grade diverge do inventário")
        if product["name"] not in infra or product["infra_doc"] not in infra:
            errors.append(f"{product_id}: ausente na Infra ou sem ficha técnica")
        if not infra_doc_path(product["infra_doc"]).is_file():
            errors.append(f"{product_id}: arquivo da ficha técnica não existe")

    if home.count('id="produtos-do-grupo"') != 1:
        errors.append("o catálogo principal precisa do identificador único produtos-do-grupo")
    if 'data-product-catalog="grupo-csv"' not in home:
        errors.append("a grade principal não está marcada como catálogo canônico")
    if 'id="ferramentas-grupo"' in home or ">Ferramentas do Grupo<" in home:
        errors.append("a dobra adicional rejeitada ainda existe")
    if re.search(r">\s*TNUMM\s*<", home):
        errors.append("TNUMM ainda aparece como identidade de produto na página inicial")
    if "repeat(3, minmax(0, 1fr))" not in home or (
        ".hero-group-btns.products { grid-template-columns: 1fr;" not in home
    ):
        errors.append("a grade homogênea 3 × 3 no desktop e 1 × 9 no mobile não está declarada")

    if "{ text: 'Produtos', link: '/#produtos-do-grupo' }" not in nav:
        errors.append("a navegação principal não aponta diretamente para o catálogo")
    if "text: 'Ferramentas'" in nav:
        errors.append("o submenu superior redundante Ferramentas ainda existe")
    nav_links = re.findall(r"link:\s*['\"]([^'\"]+)['\"]", nav)
    legacy_domain_present = any(
        urlparse(link).hostname == "tnumm.grupocsv.com"
        for link in nav_links
        if link.startswith(("https://", "http://"))
    )
    if "TNUMM" in nav or legacy_domain_present:
        errors.append("a navegação principal ainda usa a identidade antiga")

    allowed_axia = (
        ("Propostas Comerciais", "/axia/propostas.html"),
        ("Solicitação de Reembolso", "/axia/reembolso.html"),
        ("Solicitação de Emissão de NF", "/axia/nota-fiscal.html"),
    )
    for source_name, source in axia_sources.items():
        for title, href in allowed_axia:
            if source.count(title) != 1 or source.count(href) != 1:
                errors.append(f"{source_name}: operação própria ausente ou duplicada: {title}")
        for forbidden in ("RTAV™", "Discovery™"):
            if forbidden in source:
                errors.append(f"{source_name}: produto transversal duplicado: {forbidden}")

    if 'id="svc-cmm"' not in admin or "https://cmm.grupocsv.com/api/health" not in admin:
        errors.append("o Admin não monitora o health do CMM")
    if 'id="svc-themis"' not in admin or "https://themis.grupocsv.com/api/health" not in admin:
        errors.append("o Admin não monitora o health da Themis™")
    if admin != admin_mirror:
        errors.append("admin/index.html e docs/public/admin/index.html estão divergentes")

    required_infra = (
        "cmm.grupocsv.com",
        "tnumm-control",
        "a42b50a8-0665-43f6-a243-f77c01e7fe2c",
        "tnumm-evidence",
        "grupocsv/tnumm",
    )
    for value in required_infra:
        if value not in infra:
            errors.append(f"Infra incompleta para o CMM: {value}")

    required_themis_infra = (
        "themis.grupocsv.com",
        "themis-processing",
        "themis-private",
        "hstoxemjhpdltzwrmbkf",
        "axiacare/themis",
    )
    for value in required_themis_infra:
        if value not in infra:
            errors.append(f"Infra incompleta para a Themis™: {value}")

    if "https://cmm.grupocsv.com" not in readme or "| CMM |" not in readme:
        errors.append("README não registra o CMM e seu domínio canônico")
    if "https://themis.grupocsv.com" not in readme or "| Themis™ |" not in readme:
        errors.append("README não registra a Themis™ e seu domínio canônico")
    if "| `themis.grupocsv.com` | **WebApp** |" not in taxonomy:
        errors.append("a taxonomia não classifica a Themis™ como WebApp")
    if re.search(r"\*\*TNUMM\*\*|\|\s*TNUMM\s*\|", readme):
        errors.append("README ainda trata TNUMM como produto")

    if errors:
        print("Inventário de produtos: FALHOU", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        f"Inventário de produtos: OK ({len(products)} produtos; "
        "Hub, AxiaCare, Admin, Infra e README consistentes)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
