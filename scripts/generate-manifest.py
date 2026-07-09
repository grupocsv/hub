#!/usr/bin/env python3
"""
Gera o manifest.json do Hub CSV automaticamente.

Percorre o repositório para descobrir todos os ativos de conhecimento,
calcula hashes SHA256 e atribui prioridades com base na localização.

Executado automaticamente pelo GitHub Actions a cada deploy.
"""

import json
import hashlib
import os
import re
import sys
from datetime import datetime, timezone

# Diretório raiz do repositório (pode ser passado como argumento)
REPO_ROOT = sys.argv[1] if len(sys.argv) > 1 else "."

# Regras de prioridade por caminho (menor número = maior prioridade)
PRIORITY_RULES = [
    ("llms.txt",                          0, "entrypoint"),
    ("completeness-checklist.md",         1, "meta"),
    ("docs/_infra/csv-core/definition",   2, "core"),
    ("docs/_infra/csv-core/identity",     3, "core"),
    ("docs/_infra/assets/logo-usage",     4, "core"),
    ("docs/_infra/axiacare/",             5, "mandate"),
    ("docs/_infra/medvalor/",             6, "mandate"),
    ("docs/_infra/thera/",                7, "mandate"),
    ("docs/_infra/csv-core/",             8, "core"),
    ("docs/_infra/assets/",               9, "assets"),
    ("docs/_infra/standards/",           10, "standards"),
    ("docs/_infra/",                     11, "infra"),
    ("skills/",                          12, "skill"),
    ("docs/_infra/public-pages",         13, "infra"),
    ("p/registry.json",                 14, "registry"),
]

# Arquivos e diretórios a ignorar
IGNORE_PATTERNS = [
    "node_modules",
    ".git",
    ".vitepress",
    "scripts/",
    "manifest.json",
    "package",
    ".github",
]

# Descrições automáticas por tag
TAG_DESCRIPTIONS = {
    "entrypoint": "Ponto de entrada para agentes de IA com instruções iniciais e links para os artefatos de conhecimento.",
    "meta": "Artefato de meta-governança para consumo estruturado por agentes de IA.",
    "core": "Documento fundamental do ecossistema Grupo CSV.",
    "mandate": "Mandato institucional que define escopo de atuação e relação com o ecossistema.",
    "assets": "Catálogo ou guia de assets visuais do ecossistema.",
    "standards": "Padrão ou diretriz de compliance e governança.",
    "infra": "Documento de infraestrutura cognitiva do Hub.",
    "skill": "Instrucao operacional para agentes de IA.",
    "registry": "Catalogo estruturado de ativos do ecossistema.",
}

# ============================================================
# TAXONOMIA DE PRODUTOS DIGITAIS
# Classificação oficial dos ativos HTML do ecossistema Hub.
# Referência: _infra/csv-core/taxonomia-produtos.md
#
# Fonte primária: meta tags nas próprias páginas —
#   <meta name="hub-category" content="webapp|tool|dashboard|static">
#   <meta name="hub-entity" content="Nome da Entidade">
# Este dicionário é apenas FALLBACK para páginas que ainda não
# declaram as meta tags (período de transição). Ao adicionar as
# meta tags a uma página, a entrada correspondente pode ser removida.
# ============================================================
PRODUCT_TAXONOMY = {
    # WebApps — Soluções de negócio completas com back-end
    "p/tea-dataset/index.html":       {"category": "webapp",       "entity": "ICDS",       "title": "Data Set TEA"},
    "axia/propostas.html":            {"category": "webapp",       "entity": "AxiaCare",   "title": "Gerador de Propostas"},

    # Ferramentas — Tarefas específicas, escopo limitado
    "axia/nota-fiscal.html":          {"category": "tool",         "entity": "AxiaCare",   "title": "Gerador de Nota Fiscal"},
    "axia/reembolso.html":            {"category": "tool",         "entity": "AxiaCare",   "title": "Solicitação de Reembolso"},
    "unihealth/calc-plantao.html":    {"category": "tool",         "entity": "Unihealth",  "title": "Calculadora de Plantão"},
    "admin/index.html":               {"category": "tool",         "entity": "Grupo CSV",  "title": "Painel Administrativo"},
    "icds/slides.html":               {"category": "tool",         "entity": "ICDS",       "title": "Gerador de Apresentações"},

    # Painéis BI — Visualização e análise de dados
    "unimed/cuidadocoordenado.html":  {"category": "dashboard",    "entity": "Unimed GV",  "title": "Cuidado Coordenado"},
    "unimed/gce.html":                {"category": "dashboard",    "entity": "Unimed GV",  "title": "GCE"},
    "unimed/tea.html":                {"category": "dashboard",    "entity": "Unimed GV",  "title": "TEA"},
    "unimed/ped-amb.html":            {"category": "dashboard",    "entity": "Unimed GV",  "title": "Pediatria Ambulatorial"},
    "unimed/vivapleno.html":          {"category": "dashboard",    "entity": "Unimed GV",  "title": "Viva Pleno"},
    "unimed/drg.html":                {"category": "tool",         "entity": "Unimed GV",  "title": "DRG Brasil Analytics"},
    "unihealth/opme.html":            {"category": "dashboard",    "entity": "Unihealth",  "title": "OPME"},
    "unihealth/repasse.html":         {"category": "dashboard",    "entity": "Unihealth",  "title": "Repasse"},
    "unihealth/retornopa.html":       {"category": "dashboard",    "entity": "Unihealth",  "title": "Retorno PA"},

    # Páginas Estáticas — Conteúdo informativo
    "axia/index.html":                {"category": "static",       "entity": "AxiaCare",   "title": "AxiaCare (landing)"},
    "medvalor/index.html":            {"category": "static",       "entity": "MedValor",   "title": "MedValor (landing)"},
    "thera/index.html":               {"category": "static",       "entity": "Thera",      "title": "Thera (landing)"},
    "icds/index.html":                {"category": "static",       "entity": "ICDS",       "title": "ICDS (landing)"},
    "founder/index.html":             {"category": "static",       "entity": "Grupo CSV",  "title": "Fundador"},
    "deck/index.html":                {"category": "static",       "entity": "Grupo CSV",  "title": "Deck Institucional"},
    "unimed/index.html":              {"category": "static",       "entity": "Unimed GV",  "title": "Unimed GV (landing)"},
    "unihealth/index.html":           {"category": "static",       "entity": "Unihealth",  "title": "Unihealth (landing)"},
    "p/index.html":                   {"category": "static",       "entity": "Grupo CSV",  "title": "Índice de Produtos"},
}

CATEGORY_DESCRIPTIONS = {
    "webapp": "Aplicação web completa com autenticação, persistência e lógica de negócio.",
    "tool": "Ferramenta focada em tarefa específica com escopo limitado.",
    "dashboard": "Painel de visualização e análise de dados.",
    "static": "Página estática com conteúdo informativo.",
}


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def get_meta_content(filepath, name):
    """Extrai o content de uma meta tag do HTML.

    Parser tolerante: aceita atributos em qualquer ordem (name/content ou
    content/name), aspas simples ou duplas, e atributos interpostos. Lê até
    128 KB para cobrir <head> longos (páginas do hub chegam a ~19 KB de head)
    — uma tag colocada antes do </head> nunca é perdida por truncação.
    """
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read(131072)
        n = re.escape(name)
        for pattern in (
            r'<meta\b[^>]*\bname\s*=\s*["\']%s["\'][^>]*\bcontent\s*=\s*["\']([^"\']+)["\']' % n,
            r'<meta\b[^>]*\bcontent\s*=\s*["\']([^"\']+)["\'][^>]*\bname\s*=\s*["\']%s["\']' % n,
        ):
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
    except Exception:
        pass
    return None


def get_html_title(filepath):
    """Extrai o conteúdo da tag <title> do HTML, sem sufixos institucionais."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read(131072)
        match = re.search(r"<title>([^<]+)</title>", content)
        if match:
            title = match.group(1).strip()
            title = re.sub(r"\s*\|\s*(Unimed|Grupo CSV|AxiaCare|ICDS).*$", "", title)
            return title
    except Exception:
        pass
    return None


# Diretórios que não contêm páginas de produto (não escanear por meta tags)
HTML_SCAN_EXCLUDE_DIRS = {"node_modules", "docs", "scripts"}


def discover_product_pages(repo_root):
    """Descobre páginas .html dos portais classificadas via meta tags.

    Fonte primária da taxonomia: as meta tags hub-category/hub-entity
    declaradas nas próprias páginas. O dicionário PRODUCT_TAXONOMY serve
    de fallback (título/entidade) para campos ausentes e para páginas
    ainda sem meta tags (tratadas em main()).
    """
    pages = {}
    for root, dirs, files in os.walk(repo_root):
        dirs[:] = sorted(
            d for d in dirs
            if d not in HTML_SCAN_EXCLUDE_DIRS and not d.startswith(".")
        )
        for f in sorted(files):
            if not f.endswith(".html"):
                continue
            fpath = os.path.join(root, f)
            rel = os.path.relpath(fpath, repo_root)
            if should_ignore(rel):
                continue
            category = get_meta_content(fpath, "hub-category")
            if not category:
                continue
            fallback = PRODUCT_TAXONOMY.get(rel, {})
            pages[rel] = {
                "category": category,
                "entity": get_meta_content(fpath, "hub-entity")
                or fallback.get("entity", "Grupo CSV"),
                "title": get_html_title(fpath)
                or fallback.get("title")
                or make_title(rel),
            }
    return pages


def should_ignore(rel_path):
    for pattern in IGNORE_PATTERNS:
        if pattern in rel_path:
            return True
    return False


def get_priority_and_tag(rel_path):
    for prefix, priority, tag in PRIORITY_RULES:
        if prefix in rel_path:
            return priority, tag
    return 99, "other"


def make_id(rel_path):
    """Gera um ID legível a partir do caminho relativo."""
    name = rel_path.replace("docs/_infra/", "").replace("docs/", "")
    name = name.replace("/", "-").replace(".md", "").replace(".txt", "").replace(".html", "")
    name = name.strip("-")
    return name


def make_title(rel_path):
    """Gera um título legível a partir do nome do arquivo."""
    basename = os.path.basename(rel_path)
    name = basename.replace(".md", "").replace(".txt", "").replace(".html", "")
    return name.replace("-", " ").replace("_", " ").title()


def to_served_url(rel_path):
    """Converte o caminho do repositório para a URL realmente servida no site.

    Antes o manifest publicava o caminho cru do repo (ex.:
    /docs/_infra/csv-core/definition.md), que dá 404 no site: o VitePress serve
    o conteúdo de docs/ SEM o prefixo 'docs/' e com .md convertido para .html
    (cleanUrls desativado). Os arquivos copiados crus na raiz do dist pelo
    deploy (llms.txt, completeness-checklist.md, p/registry.json) mantêm o
    caminho direto.
    """
    RAW_ROOT_FILES = {"llms.txt", "completeness-checklist.md", "p/registry.json"}
    if rel_path in RAW_ROOT_FILES:
        return "/" + rel_path
    # Conteúdo do VitePress: docs/**.md -> /**.html (sem 'docs/')
    if rel_path.startswith("docs/") and rel_path.endswith(".md"):
        served = rel_path[len("docs/"):]
        served = served[:-3] + ".html"
        return "/" + served
    return "/" + rel_path


def discover_assets(repo_root):
    """Descobre todos os arquivos .md e .txt relevantes no repositório."""
    assets = []

    # 1. Arquivos raiz de IA
    for fname in ["llms.txt", "completeness-checklist.md"]:
        fpath = os.path.join(repo_root, fname)
        if os.path.isfile(fpath):
            assets.append(fname)

    # 2. Todos os .md dentro de docs/_infra/
    infra_dir = os.path.join(repo_root, "docs", "_infra")
    if os.path.isdir(infra_dir):
        for root, dirs, files in os.walk(infra_dir):
            for f in sorted(files):
                if f.endswith(".md"):
                    rel = os.path.relpath(os.path.join(root, f), repo_root)
                    if not should_ignore(rel):
                        assets.append(rel)

    # 3. Skills: NÃO incluídas no manifest público. A pasta skills/ não é
    # copiada para o dist (não é servida no site — daria 404) e um dos arquivos
    # (buscar-api-keys.md) aponta o local do cofre de chaves; publicá-la para
    # "resolver" o 404 seria expor conteúdo interno. Mantida fora do índice.

    # 4. Documentacao avulsa (docs/*.md na raiz de docs/)
    docs_dir = os.path.join(repo_root, "docs")
    if os.path.isdir(docs_dir):
        for f in sorted(os.listdir(docs_dir)):
            if f.endswith(".md") and f != "index.md":
                rel = os.path.join("docs", f)
                if not should_ignore(rel):
                    assets.append(rel)

    # 5. Registry de paginas publicas
    registry_path = os.path.join(repo_root, "p", "registry.json")
    if os.path.isfile(registry_path):
        assets.append(os.path.join("p", "registry.json"))

    return assets


def main():
    repo_root = os.path.abspath(REPO_ROOT)
    os.chdir(repo_root)

    discovered = discover_assets(repo_root)

    knowledge_assets = []
    for rel_path in discovered:
        priority, tag = get_priority_and_tag(rel_path)
        file_hash = sha256_file(rel_path)

        asset = {
            "id": make_id(rel_path),
            "priority": priority,
            "title": make_title(rel_path),
            "path": to_served_url(rel_path),
            "sha256": file_hash,
            "description": TAG_DESCRIPTIONS.get(tag, "Documento do Hub CSV."),
            "tags": [tag],
        }
        knowledge_assets.append(asset)

    # Ordenar por prioridade
    knowledge_assets.sort(key=lambda a: (a["priority"], a["path"]))

    # Descobrir e classificar ativos HTML pela taxonomia.
    # Fonte primária: meta tags hub-category/hub-entity nas páginas;
    # PRODUCT_TAXONOMY entra como fallback para páginas sem meta tags.
    product_pages = discover_product_pages(repo_root)
    for rel_path, meta in PRODUCT_TAXONOMY.items():
        if rel_path in product_pages:
            continue
        if os.path.isfile(os.path.join(repo_root, rel_path)):
            product_pages[rel_path] = meta

    product_assets = []
    for rel_path, meta in sorted(product_pages.items()):
        fpath = os.path.join(repo_root, rel_path)
        file_hash = sha256_file(fpath)
        product_assets.append({
            "id": make_id(rel_path),
            "title": meta["title"],
            "path": f"/{rel_path}",
            "sha256": file_hash,
            "category": meta["category"],
            "entity": meta["entity"],
            "description": CATEGORY_DESCRIPTIONS.get(meta["category"], "Ativo digital do Hub CSV."),
        })

    manifest = {
        "manifestVersion": "2.0.0",
        "lastUpdated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totalAssets": len(knowledge_assets),
        "totalProducts": len(product_assets),
        "knowledgeAssets": knowledge_assets,
        "productAssets": product_assets,
    }

    output_path = os.path.join(repo_root, "manifest.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"manifest.json gerado com {len(knowledge_assets)} ativos de conhecimento e {len(product_assets)} produtos digitais.")


if __name__ == "__main__":
    main()
