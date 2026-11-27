#!/usr/bin/env python3
"""Prepara o artefato do Hub para os arquivos estaticos da Cloudflare (Workers).

Copia o build publicado (o mesmo que vai ao GitHub Pages) para um diretorio de
saida, tira os arquivos acima do limite por arquivo da Cloudflare (25 MiB),
escreve um _redirects que manda esses caminhos para o bucket de assets e gera
um relatorio JSON com contagem e tamanho. Nao publica nada.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_FILES_FREE = 20_000
SKIP_NAMES = {"CNAME", ".nojekyll"}


def prepare(src: Path, out: Path, redirect_base: str) -> dict:
    if not src.is_dir():
        raise SystemExit(f"diretorio de origem inexistente: {src}")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    oversized: list[dict] = []
    copied = 0
    total = 0
    for path in sorted(p for p in src.rglob("*") if p.is_file()):
        rel = path.relative_to(src).as_posix()
        if path.name in SKIP_NAMES and path.parent == src:
            continue
        size = path.stat().st_size
        if size > MAX_FILE_BYTES:
            oversized.append({"path": "/" + rel, "bytes": size})
            continue
        dest = out / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)
        copied += 1
        total += size
    redirects = out / "_redirects"
    existed = redirects.exists()
    lines = redirects.read_text(encoding="utf-8").splitlines() if existed else []
    for item in oversized:
        lines.append(f"{item['path']} {redirect_base.rstrip('/')}{item['path']} 302")
    if lines:
        redirects.write_text("\n".join(lines) + "\n", encoding="utf-8")
        if not existed:
            copied += 1
    return {
        "files": copied,
        "bytes": total,
        "max_files_free_plan": MAX_FILES_FREE,
        "max_file_bytes": MAX_FILE_BYTES,
        "within_file_limit": copied <= MAX_FILES_FREE,
        "oversized_redirected": oversized,
        "redirect_base": redirect_base,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", default="docs/.vitepress/dist")
    parser.add_argument("--out", default="dist-cloudflare")
    parser.add_argument("--redirect-base", default="https://assets.grupocsv.com/hub")
    parser.add_argument("--report", default="cloudflare-assets-report.json")
    args = parser.parse_args(argv)
    report = prepare(Path(args.src), Path(args.out), args.redirect_base)
    Path(args.report).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["within_file_limit"] else 1


if __name__ == "__main__":
    sys.exit(main())
