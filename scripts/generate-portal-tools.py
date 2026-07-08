#!/usr/bin/env python3
"""
generate-portal-tools.py
Gera {portal}/tools.json para cada portal do Hub CSV.
Executado automaticamente no CI/CD (GitHub Actions) a cada push.

Para cada portal (unimed, unihealth, icds), escaneia os arquivos .html
(excluindo index.html), extrai o <title> e a data do último commit,
e gera um JSON ordenado do mais recente para o mais antigo.

Páginas podem ser excluídas do menu adicionando uma meta tag:
  <meta name="hub-menu" content="hidden">

Anotações manuais sobrevivem à regeneração via {portal}/tools-overrides.json
(opcional). Formato: objeto cujas chaves são o campo "file" da entrada gerada
(nome do .html do portal ou href de entrada vinda de extras.json) e cujos
valores são campos aplicados por cima da entrada gerada (merge raso — o
campo do override vence o extraído, inclusive "title"). Exemplo:
  {
    "arquivo.html": {"note": "...", "featured": true, "title": "..."}
  }
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

PORTALS = ["unimed", "unihealth", "icds"]
REPO_ROOT = sys.argv[1] if len(sys.argv) > 1 else "."


def get_title(filepath):
    """Extrai o conteúdo da tag <title> do arquivo HTML."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read(4096)  # Ler apenas o início
        match = re.search(r"<title>([^<]+)</title>", content)
        if match:
            title = match.group(1).strip()
            # Remover sufixos comuns como " | Unimed GV", " | Grupo CSV"
            title = re.sub(r"\s*\|\s*(Unimed|Grupo CSV|AxiaCare|ICDS).*$", "", title)
            return title
        return os.path.basename(filepath).replace(".html", "").replace("-", " ").title()
    except Exception:
        return os.path.basename(filepath).replace(".html", "").replace("-", " ").title()


def is_hidden(filepath):
    """Verifica se a página tem meta tag hub-menu=hidden."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read(4096)
        return bool(re.search(r'<meta\s+name="hub-menu"\s+content="hidden"', content))
    except Exception:
        return False


def get_last_commit_date(filepath):
    """Obtém a data do último commit do arquivo via git log."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%aI", "--", filepath],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )
        if result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    # Fallback: usar mtime do arquivo
    mtime = os.path.getmtime(filepath)
    return datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()


def get_first_commit_date(filepath):
    """Obtém a data do primeiro commit do arquivo (data de criação)."""
    try:
        result = subprocess.run(
            ["git", "log", "--diff-filter=A", "--format=%aI", "--", filepath],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )
        if result.stdout.strip():
            # Pegar a última linha (primeiro commit)
            lines = result.stdout.strip().split("\n")
            return lines[-1]
    except Exception:
        pass
    return get_last_commit_date(filepath)


def generate_portal_tools(portal):
    """Gera o tools.json para um portal específico."""
    portal_dir = os.path.join(REPO_ROOT, portal)
    if not os.path.isdir(portal_dir):
        print(f"  Diretório {portal}/ não encontrado, pulando.")
        return

    tools = []
    for filename in os.listdir(portal_dir):
        if not filename.endswith(".html"):
            continue
        if filename == "index.html":
            continue

        filepath = os.path.join(portal_dir, filename)

        # Verificar se está marcada como hidden
        if is_hidden(filepath):
            continue

        title = get_title(filepath)
        last_modified = get_last_commit_date(filepath)
        created = get_first_commit_date(filepath)

        tools.append(
            {
                "file": filename,
                "title": title,
                "created": created,
                "lastModified": last_modified,
            }
        )

    # Carregar extras.json (entradas manuais como links para /p/ ou URLs externas)
    extras_path = os.path.join(portal_dir, "extras.json")
    if os.path.isfile(extras_path):
        try:
            with open(extras_path, "r", encoding="utf-8") as f:
                extras = json.load(f)
            for extra in extras:
                # extras devem ter: title, href, lastModified (opcional)
                tools.append(
                    {
                        "file": extra.get("href", ""),
                        "title": extra.get("title", "Sem título"),
                        "created": extra.get("created", extra.get("lastModified", "2026-01-01T00:00:00+00:00")),
                        "lastModified": extra.get("lastModified", "2026-01-01T00:00:00+00:00"),
                        "external": True,
                    }
                )
        except Exception as e:
            print(f"  Aviso: erro ao ler {extras_path}: {e}")

    # Aplicar overrides manuais ({portal}/tools-overrides.json).
    # Somente chaves da whitelist entram no merge: um lastModified de tipo
    # errado num arquivo editado à mão quebraria a ordenação abaixo — e, como
    # o step é fail-fast, derrubaria o deploy inteiro.
    ALLOWED_OVERRIDE_KEYS = {"note", "featured", "title"}
    overrides_path = os.path.join(portal_dir, "tools-overrides.json")
    if os.path.isfile(overrides_path):
        try:
            with open(overrides_path, "r", encoding="utf-8") as f:
                overrides = json.load(f)
            for tool in tools:
                override = overrides.get(tool["file"])
                if isinstance(override, dict):
                    ignored = set(override) - ALLOWED_OVERRIDE_KEYS
                    if ignored:
                        print(f"  Aviso: chaves ignoradas no override de {tool['file']}: {sorted(ignored)} (permitidas: {sorted(ALLOWED_OVERRIDE_KEYS)})")
                    tool.update({k: v for k, v in override.items() if k in ALLOWED_OVERRIDE_KEYS})
        except Exception as e:
            print(f"  Aviso: erro ao ler {overrides_path}: {e}")

    # Ordenar por lastModified (mais recente primeiro)
    tools.sort(key=lambda t: t["lastModified"], reverse=True)

    output = {
        "portal": portal,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalTools": len(tools),
        "tools": tools,
    }

    output_path = os.path.join(portal_dir, "tools.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"  {portal}/tools.json: {len(tools)} ferramentas")


def main():
    os.chdir(REPO_ROOT)
    print("Gerando tools.json para portais...")
    for portal in PORTALS:
        generate_portal_tools(portal)
    print("Concluído.")


if __name__ == "__main__":
    main()
