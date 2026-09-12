#!/usr/bin/env python3
"""Valida o escopo editorial Unimed da edição mais recente do Signal™."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIGNAL_ROOT = ROOT / "signal" / "edicoes"

FORBIDDEN_INTERNAL_TOPICS = {
    "CMS-CSV": r"\bCMS[-–— ]?CSV\b",
    "Compass": r"\bCompass(?:™)?\b",
    "OpenClaw": r"\bOpenClaw\b",
    "Extensio": r"\bExtensio\b",
    "Agent Context Bridge": r"\bAgent Context Bridge\b|\bACB\b",
    "Cloudflare": r"\bCloudflare\b",
    "GitHub": r"\bGitHub\b",
    "Worker/Workers": r"\bWorkers?\b",
    "VPS/VPS-CSV": r"\bVPS(?:-CSV)?\b",
    "D1/R2": r"\bD1\b|\bR2\b",
    "deploy/pull request": r"\bdeploy\b|\bpull request\b",
}

INSTITUTIONAL_ANCHORS = re.compile(
    r"Unimed|Unihealth|Escritório de Valor|\bEVS\b|operadora|beneficiário|paciente|"
    r"médic[oa]s?|assistencial|cuidado|Ymunity|\bDRG\b|\bRMBV\b|PPE-15|\bTEA\b|"
    r"Assessment 2iM|Hi! Healthcare|\bVPD\b",
    re.IGNORECASE,
)


def edition_key(path: Path) -> tuple[int, int]:
    year = int(path.parent.name)
    match = re.fullmatch(r"S(\d{2})", path.name)
    if not match:
        return (0, 0)
    return (year, int(match.group(1)))


def latest_edition() -> Path:
    editions = [
        path
        for path in SIGNAL_ROOT.glob("*/S??")
        if path.is_dir() and re.fullmatch(r"S\d{2}", path.name)
    ]
    if not editions:
        raise SystemExit("Nenhuma edição do Signal foi encontrada.")
    return max(editions, key=edition_key)


def editorial_body(markdown: str) -> str:
    match = re.search(
        r"^## Fatos [Ee]stratégicos.*?(?=^## (?:PDF|Documentos e recursos)|\Z)",
        markdown,
        flags=re.MULTILINE | re.DOTALL,
    )
    if not match:
        raise SystemExit("Seções editoriais do Signal não foram localizadas.")
    return match.group(0)


def main() -> int:
    edition = latest_edition()
    signal_path = edition / "signal.md"
    metadata_path = edition / "metadata.yml"
    markdown = signal_path.read_text(encoding="utf-8")
    metadata = metadata_path.read_text(encoding="utf-8")
    body = editorial_body(markdown)

    errors: list[str] = []
    if not re.search(r"^scope:\s*[\"']?unimed[\"']?\s*$", metadata, re.MULTILINE | re.IGNORECASE):
        errors.append(f"{metadata_path}: campo obrigatório `scope: unimed` ausente.")

    for label, pattern in FORBIDDEN_INTERNAL_TOPICS.items():
        if re.search(pattern, body, flags=re.IGNORECASE):
            errors.append(f"{signal_path}: assunto interno proibido no escopo Unimed: {label}.")

    facts = re.findall(r"^\d+\.\s+\*\*.*$", body, flags=re.MULTILINE)
    if not 5 <= len(facts) <= 7:
        errors.append(f"{signal_path}: esperados 5 a 7 fatos estratégicos; encontrados {len(facts)}.")

    for position, fact in enumerate(facts, start=1):
        if not INSTITUTIONAL_ANCHORS.search(fact):
            errors.append(
                f"{signal_path}: fato {position} não contém âncora institucional Unimed/Unihealth/EVS."
            )

    if errors:
        print("VALIDAÇÃO DE ESCOPO SIGNAL: FALHA", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"VALIDAÇÃO DE ESCOPO SIGNAL: APROVADA ({edition.parent.name}/{edition.name})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
