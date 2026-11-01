"""Inventário local privado, sem alterar a origem nem chamar serviços externos."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import unicodedata
from datetime import datetime, timezone


SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".md"}
BLOCK_SIZE = 1024 * 1024
VERSION_SUFFIX = re.compile(
    r"(?:[\s_.-]+|\s*\()(?:v|ver|versao|rev|revisao|r)[\s_.-]*"
    r"\d+(?:[._-]\d+)*\)?$",
    re.IGNORECASE,
)


def is_link_or_reparse(path: Path, info: os.stat_result | None = None) -> bool:
    info = info or path.lstat()
    return stat.S_ISLNK(info.st_mode) or bool(
        getattr(info, "st_file_attributes", 0)
        & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    )


def check_ancestors(path: Path) -> None:
    """Rejeita links/junctions existentes em qualquer parte do caminho."""
    for item in [*reversed(path.parents), path]:
        if item.exists() or item.is_symlink():
            if is_link_or_reparse(item):
                raise ValueError("caminho_com_link_ou_reparse")


def is_within(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def prepare_paths(source: str | Path, output: str | Path) -> tuple[Path, Path]:
    root_input = Path(source).absolute()
    target_input = Path(output).absolute()
    check_ancestors(root_input)
    check_ancestors(target_input)
    root = root_input.resolve(strict=True)
    if not root.is_dir():
        raise ValueError("origem_nao_e_pasta")
    if not target_input.parent.is_dir():
        raise ValueError("pasta_de_saida_deve_existir")
    target = target_input.parent.resolve(strict=True) / target_input.name
    if is_within(target, root):
        raise ValueError("saida_dentro_da_origem")
    if target.exists() or target.is_symlink():
        raise ValueError("saida_ja_existe")
    for parent in [target.parent, *target.parent.parents]:
        if (parent / ".git").exists():
            raise ValueError("saida_dentro_de_repositorio_git")
    return root, target


def stable_hash(path: Path, root: Path) -> tuple[str, int]:
    check_ancestors(path)
    if not is_within(path.resolve(strict=True), root):
        raise ValueError("arquivo_fora_da_origem")
    before = path.lstat()
    if is_link_or_reparse(path, before) or not stat.S_ISREG(before.st_mode):
        raise ValueError("arquivo_nao_regular")
    digest = hashlib.sha256()
    read_size = 0
    with path.open("rb") as stream:
        opened = os.fstat(stream.fileno())
        if (before.st_dev, before.st_ino) != (opened.st_dev, opened.st_ino):
            raise ValueError("arquivo_alterado_durante_leitura")
        for block in iter(lambda: stream.read(BLOCK_SIZE), b""):
            digest.update(block)
            read_size += len(block)
        after_open = os.fstat(stream.fileno())
    check_ancestors(path)
    after = path.lstat()
    snapshots = [before, opened, after_open, after]
    signatures = {
        (item.st_dev, item.st_ino, item.st_size, item.st_mtime_ns)
        for item in snapshots
    }
    if len(signatures) != 1 or read_size != before.st_size:
        raise ValueError("arquivo_alterado_durante_leitura")
    if not is_within(path.resolve(strict=True), root):
        raise ValueError("arquivo_fora_da_origem")
    return digest.hexdigest(), read_size


def candidate_key(relative_path: str) -> str:
    path = Path(relative_path)
    normalized = unicodedata.normalize("NFKD", path.stem.casefold())
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    stem = VERSION_SUFFIX.sub("", normalized).strip(" _.-")
    return f"{path.parent.as_posix().casefold()}/{stem}"


def inventory(root: Path) -> dict:
    files: list[dict] = []
    issues: list[dict] = []
    pending = [root]
    while pending:
        directory = pending.pop()
        relative_dir = directory.relative_to(root).as_posix()
        try:
            check_ancestors(directory)
            if not is_within(directory.resolve(strict=True), root):
                raise ValueError("pasta_fora_da_origem")
            with os.scandir(directory) as entries:
                children = sorted(entries, key=lambda item: item.name.casefold())
        except (OSError, ValueError) as error:
            issues.append({"path": relative_dir, "code": "pasta_nao_lida", "error_type": type(error).__name__})
            continue
        for entry in children:
            path = Path(entry.path)
            relative = path.relative_to(root).as_posix()
            try:
                info = entry.stat(follow_symlinks=False)
                if is_link_or_reparse(path, info):
                    issues.append({"path": relative, "code": "link_ou_reparse_ignorado"})
                elif stat.S_ISDIR(info.st_mode):
                    pending.append(path)
                elif stat.S_ISREG(info.st_mode):
                    sha256, size = stable_hash(path, root)
                    extension = path.suffix.casefold()
                    files.append({
                        "path": relative,
                        "size_bytes": size,
                        "sha256": sha256,
                        "extension": extension,
                        "extension_supported": extension in SUPPORTED_EXTENSIONS,
                    })
                else:
                    issues.append({"path": relative, "code": "entrada_nao_regular_ignorada"})
            except (OSError, ValueError) as error:
                code = str(error) if isinstance(error, ValueError) else "arquivo_nao_lido"
                issues.append({"path": relative, "code": code, "error_type": type(error).__name__})

    files.sort(key=lambda item: item["path"].casefold())
    issues.sort(key=lambda item: item["path"].casefold())
    hashes: dict[str, list[str]] = {}
    candidates: dict[str, list[dict]] = {}
    for item in files:
        hashes.setdefault(item["sha256"], []).append(item["path"])
        candidates.setdefault(candidate_key(item["path"]), []).append(item)
    return {
        "schema_version": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": str(root),
        "scope": "arquivos locais regulares; sem seguir links ou pontos de reanalise",
        "scope_complete": not issues,
        "content_included": False,
        "central_compared": False,
        "upload_performed": False,
        "file_count": len(files),
        "total_bytes": sum(item["size_bytes"] for item in files),
        "files": files,
        "duplicate_groups": [
            {"sha256": sha256, "paths": paths}
            for sha256, paths in sorted(hashes.items()) if len(paths) > 1
        ],
        "version_candidates": [
            {"key": key, "paths": [item["path"] for item in items], "status": "heuristica_nao_confirmada"}
            for key, items in sorted(candidates.items())
            if len(items) > 1 and len({item["sha256"] for item in items}) > 1
        ],
        "issues": issues,
    }


def run(source: str | Path, output: str | Path) -> dict:
    root, target = prepare_paths(source, output)
    result = inventory(root)
    # Revalida a saída depois da leitura; não sobrescreve arquivo existente.
    _, target = prepare_paths(root, target)
    with target.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(result, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, help="Pasta local a inventariar, sem alterações")
    parser.add_argument("--output", required=True, help="JSON privado novo, fora da origem e fora de Git")
    args = parser.parse_args()
    try:
        result = run(args.source, args.output)
    except (OSError, ValueError) as error:
        code = str(error) if isinstance(error, ValueError) else type(error).__name__
        print(json.dumps({"ok": False, "error": code}, ensure_ascii=False), file=sys.stderr)
        return 1
    print(json.dumps({
        "ok": True,
        "scope_complete": result["scope_complete"],
        "file_count": result["file_count"],
        "total_bytes": result["total_bytes"],
        "issue_count": len(result["issues"]),
        "upload_performed": False,
    }, ensure_ascii=False))
    return 0 if result["scope_complete"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
