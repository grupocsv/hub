#!/usr/bin/env python3
"""
Reconcilia exclusivamente o card gerenciado do Hub Documentos.

A Fase 9.7 não é um gerador geral de catálogos. HTML, ``extras.json``,
``tools-overrides.json`` e o objeto não gerenciado completo de cada
``tools.json`` precisam coincidir com a baseline versionada. Qualquer
divergência encerra a execução sem escrita e exige um fluxo separado,
explicitamente autorizado, para regenerar o catálogo geral.

O checksum interno detecta corrupção acidental. A âncora externa também
versionada impede que baseline e outputs sejam recalculados isoladamente.
Git e revisão obrigatória, declarados nos dois artefatos, são a autoridade.
O checksum local não fornece autenticidade por si só.
"""

from __future__ import annotations

import hashlib
import json
import os
import posixpath
import re
import shutil
import stat
import sys
import tempfile
import time
import uuid
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit


PORTALS = ("unimed", "unihealth", "icds")
DOCUMENTOS_ROUTE = "/documentos/"
DOCUMENTOS_TITLE = "Documentos"
DOCUMENTOS_MANAGER = "hub-documentos"
ALLOWED_API_ORIGIN = "https://hub.grupocsv.com"
BASELINE_PURPOSE = (
    "Congela integralmente a base não gerenciada; a Fase 9.7 apenas "
    "reconcilia o card Documentos."
)
BASELINE_AUTHORITY = (
    "Git e revisão obrigatória são a âncora de autoridade; "
    "manifestSha256 é apenas checksum de integridade."
)
HEX_SHA256 = re.compile(r"^[0-9a-f]{64}$")
CANONICAL_PORTAL = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
REGISTRY_KEYS = frozenset(("schemaVersion", "tenants"))
TENANT_KEYS = frozenset(("portal", "enabled", "href"))
CONFIG_KEYS = frozenset(
    ("schemaVersion", "enabled", "apiBaseUrl", "enabledPortals", "features")
)
REQUIRED_FEATURE_KEYS = frozenset(("favorites", "offline", "upload", "viewer"))
FEATURE_KEYS = REQUIRED_FEATURE_KEYS | frozenset(("search",))
OUTPUT_KEYS = frozenset(("portal", "generatedAt", "totalTools", "tools"))
OVERRIDE_KEYS = frozenset(("note", "featured", "title"))
BASELINE_KEYS = frozenset(
    (
        "schemaVersion",
        "purpose",
        "integrityAuthority",
        "portals",
        "manifestSha256",
    )
)
BASELINE_ENTRY_KEYS = frozenset(
    ("sourceSha256", "unmanagedOutput", "unmanagedOutputSha256")
)
ANCHOR_KEYS = frozenset(("schemaVersion", "authority", "baselineManifestSha256"))
TEST_FIXTURE_MARKER = "hub-portal-tools-fixture-v1\n"
FILE_ATTRIBUTE_REPARSE_POINT = getattr(
    stat,
    "FILE_ATTRIBUTE_REPARSE_POINT",
    0x400,
)


class GenerationError(RuntimeError):
    """Erro contratual que deve encerrar a geração antes da promoção."""


def fail(message: str) -> None:
    raise GenerationError(message)


def is_record(value: object) -> bool:
    return isinstance(value, dict)


def assert_only_keys(value: dict, allowed: frozenset[str], context: str) -> None:
    unexpected = sorted(set(value) - allowed)
    if unexpected:
        fail(f"Campo não permitido {context}: {unexpected[0]}.")


def canonical_json(value: object) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def canonical_hash(value: object) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def normalized_html_source(source: str) -> str:
    """Canonicaliza somente EOL do HTML usado pelo descriptor versionado."""
    return source.replace("\r\n", "\n").replace("\r", "\n")


def bytes_hash(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def validate_iso_date(value: object, context: str) -> str:
    if not isinstance(value, str) or not value:
        fail(f"Data inválida {context}.")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        fail(f"Data inválida {context}.")
    if parsed.tzinfo is None:
        fail(f"Data sem fuso horário {context}.")
    return value


def is_redirection(file_stat: os.stat_result) -> bool:
    return stat.S_ISLNK(file_stat.st_mode) or bool(
        getattr(file_stat, "st_file_attributes", 0) & FILE_ATTRIBUTE_REPARSE_POINT
    )


def lexical_absolute(path: Path) -> Path:
    return Path(os.path.abspath(os.fspath(path)))


def is_within(root: Path, path: Path) -> bool:
    try:
        return os.path.commonpath((os.fspath(root), os.fspath(path))) == os.fspath(root)
    except ValueError:
        return False


def assert_safe_root(root: Path) -> Path:
    lexical = lexical_absolute(root)
    try:
        root_stat = os.lstat(lexical)
    except FileNotFoundError:
        fail(f"Raiz do repositório ausente: {lexical}.")
    if is_redirection(root_stat):
        fail(f"Raiz usa symlink, junction ou reparse point: {lexical}.")
    if not stat.S_ISDIR(root_stat.st_mode):
        fail(f"Raiz do repositório inválida: {lexical}.")
    resolved = lexical.resolve(strict=True)
    if resolved != lexical.resolve(strict=False):
        fail(f"Raiz do repositório não é canônica: {lexical}.")
    return resolved


def assert_safe_path(
    root: Path,
    path: Path,
    description: str,
    *,
    expected: str | None = None,
    required: bool = True,
) -> Path:
    lexical = lexical_absolute(path)
    if not is_within(root, lexical):
        fail(f"{description} fora da raiz autorizada: {lexical}.")
    try:
        relative = lexical.relative_to(root)
    except ValueError:
        fail(f"{description} fora da raiz autorizada: {lexical}.")

    current = root
    missing = False
    final_stat: os.stat_result | None = None
    for part in relative.parts:
        current = current / part
        try:
            current_stat = os.lstat(current)
        except FileNotFoundError:
            missing = True
            break
        if is_redirection(current_stat):
            fail(
                f"{description} usa symlink, junction, reparse point ou "
                f"redirecionamento de caminho: {current}."
            )
        final_stat = current_stat

    if missing:
        if required:
            fail(f"{description} ausente: {lexical}.")
        return lexical

    resolved = lexical.resolve(strict=True)
    if not is_within(root, resolved) or resolved != lexical:
        fail(f"{description} resolve fora da raiz autorizada: {lexical}.")
    if expected == "file" and (
        final_stat is None or not stat.S_ISREG(final_stat.st_mode)
    ):
        fail(f"{description} não é arquivo regular: {lexical}.")
    if expected == "dir" and (
        final_stat is None or not stat.S_ISDIR(final_stat.st_mode)
    ):
        fail(f"{description} não é diretório regular: {lexical}.")
    return lexical


def decode_text(source: bytes, path: Path, description: str) -> str:
    try:
        return source.decode("utf-8")
    except UnicodeError as error:
        fail(f"Não foi possível ler {description}: {path}: {error}.")


def test_hook(root: Path, name: str) -> str | None:
    value = os.environ.get(name)
    if value is None:
        return None
    marker = assert_safe_path(
        root,
        root / ".portal-tools-test-fixture",
        "Marcador de fixture de teste",
        expected="file",
    )
    try:
        marker_value = marker.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as error:
        fail(f"Não foi possível validar o marcador de teste: {error}.")
    if marker_value != TEST_FIXTURE_MARKER:
        fail("Hook de teste recusado fora de uma fixture isolada.")
    return value


def parse_json_text(source: str, path: Path) -> object:
    try:
        return json.loads(source)
    except (json.JSONDecodeError, UnicodeError):
        fail(f"JSON inválido em {path}.")


class InputSnapshot:
    """Registra bytes e listagens usados e os revalida antes da promoção."""

    def __init__(self, root: Path):
        self.root = root
        self.files: dict[Path, tuple[bool, str | None]] = {}
        self.listings: dict[Path, tuple[str, ...]] = {}

    def read_bytes(
        self,
        relative: Path,
        description: str,
        *,
        required: bool = True,
    ) -> bytes | None:
        path = assert_safe_path(
            self.root,
            self.root / relative,
            description,
            expected="file",
            required=required,
        )
        if not path.exists():
            self.files[relative] = (False, None)
            return None
        try:
            source = path.read_bytes()
        except OSError as error:
            fail(f"Não foi possível ler {description}: {path}: {error}.")
        self.files[relative] = (True, bytes_hash(source))
        return source

    def read_text(
        self,
        relative: Path,
        description: str,
        *,
        required: bool = True,
    ) -> str | None:
        source = self.read_bytes(relative, description, required=required)
        return (
            decode_text(source, self.root / relative, description)
            if source is not None
            else None
        )

    def read_json(
        self,
        relative: Path,
        description: str,
        *,
        required: bool = True,
    ) -> object | None:
        source = self.read_text(relative, description, required=required)
        return (
            parse_json_text(source, self.root / relative)
            if source is not None
            else None
        )

    def list_html(self, portal: str) -> list[Path]:
        relative = Path(portal)
        directory = assert_safe_path(
            self.root,
            self.root / relative,
            f"Diretório do portal {portal}",
            expected="dir",
        )
        names: list[str] = []
        html: list[Path] = []
        try:
            entries = sorted(directory.iterdir(), key=lambda item: item.name)
        except OSError as error:
            fail(f"Não foi possível listar o portal {portal}: {error}.")
        for entry in entries:
            safe_entry = assert_safe_path(
                self.root,
                entry,
                f"Entrada do portal {portal}",
            )
            entry_stat = os.lstat(safe_entry)
            kind = (
                "file"
                if stat.S_ISREG(entry_stat.st_mode)
                else "dir"
                if stat.S_ISDIR(entry_stat.st_mode)
                else "other"
            )
            names.append(f"{entry.name}:{kind}")
            if (
                kind == "file"
                and entry.suffix == ".html"
                and entry.name != "index.html"
            ):
                html.append(Path(portal) / entry.name)
        self.listings[relative] = tuple(names)
        return html

    def _current_listing(self, relative: Path) -> tuple[str, ...]:
        directory = assert_safe_path(
            self.root,
            self.root / relative,
            f"Diretório monitorado {relative.as_posix()}",
            expected="dir",
        )
        result = []
        for entry in sorted(directory.iterdir(), key=lambda item: item.name):
            safe_entry = assert_safe_path(
                self.root,
                entry,
                f"Entrada monitorada {relative.as_posix()}",
            )
            entry_stat = os.lstat(safe_entry)
            kind = (
                "file"
                if stat.S_ISREG(entry_stat.st_mode)
                else "dir"
                if stat.S_ISDIR(entry_stat.st_mode)
                else "other"
            )
            result.append(f"{entry.name}:{kind}")
        return tuple(result)

    def assert_unchanged(self) -> None:
        for relative, (existed, expected_digest) in self.files.items():
            path = assert_safe_path(
                self.root,
                self.root / relative,
                f"Entrada monitorada {relative.as_posix()}",
                expected="file",
                required=existed,
            )
            if not existed:
                if path.exists():
                    fail(
                        "Snapshot de entrada mudou antes da promoção: "
                        f"{relative.as_posix()} foi criado."
                    )
                continue
            try:
                current_digest = bytes_hash(path.read_bytes())
            except OSError as error:
                fail(f"Não foi possível revalidar {relative.as_posix()}: {error}.")
            if current_digest != expected_digest:
                fail(
                    "Snapshot de entrada mudou antes da promoção: "
                    f"{relative.as_posix()} divergiu."
                )
        for relative, expected_listing in self.listings.items():
            if self._current_listing(relative) != expected_listing:
                fail(
                    "Snapshot de entrada mudou antes da promoção: listagem de "
                    f"{relative.as_posix()} divergiu."
                )


def validate_registry(value: object) -> dict[str, dict]:
    if not is_record(value):
        fail("Registro declarativo de tenants inválido.")
    assert_only_keys(value, REGISTRY_KEYS, "no registro de tenants")
    if value.get("schemaVersion") != 1 or not isinstance(value.get("tenants"), list):
        fail("Schema do registro declarativo de tenants inválido.")

    registry: dict[str, dict] = {}
    for entry in value["tenants"]:
        if not is_record(entry):
            fail("Entrada de tenant inválida.")
        assert_only_keys(entry, TENANT_KEYS, "na entrada de tenant")
        portal = entry.get("portal")
        if not isinstance(portal, str) or not CANONICAL_PORTAL.fullmatch(portal):
            fail("Portal inválido no registro de tenants.")
        if portal not in PORTALS:
            fail(f"Tenant desconhecido no registro: {portal}.")
        if portal in registry:
            fail(f"Portal duplicado no registro: {portal}.")
        if not isinstance(entry.get("enabled"), bool):
            fail(f"Estado inválido do portal {portal}.")
        if entry.get("href") != DOCUMENTOS_ROUTE:
            fail(f"Rota divergente no portal {portal}.")
        registry[portal] = dict(entry)
    return registry


def validate_runtime_config(value: object, registry: dict[str, dict]) -> set[str]:
    if not is_record(value):
        fail("Configuração pública inválida.")
    assert_only_keys(value, CONFIG_KEYS, "na configuração pública")
    if value.get("schemaVersion") != 1:
        fail("Versão do schema da configuração pública inválida.")
    if not isinstance(value.get("enabled"), bool):
        fail("Estado global da aplicação inválido.")
    api_base = value.get("apiBaseUrl")
    if api_base is not None and (not isinstance(api_base, str) or not api_base):
        fail("Base pública da API inválida.")
    if api_base is not None:
        try:
            parsed_api = urlsplit(api_base)
        except ValueError:
            fail("Base pública da API inválida.")
        if (
            parsed_api.scheme != "https"
            or parsed_api.netloc != "hub.grupocsv.com"
            or parsed_api.username
            or parsed_api.password
            or parsed_api.path not in ("", "/")
            or parsed_api.query
            or parsed_api.fragment
            or f"{parsed_api.scheme}://{parsed_api.netloc}" != ALLOWED_API_ORIGIN
        ):
            fail("Base pública da API fora da origem HTTPS permitida.")

    features = value.get("features")
    if not is_record(features):
        fail("Objeto de features inválido.")
    assert_only_keys(features, FEATURE_KEYS, "em features")
    if not REQUIRED_FEATURE_KEYS.issubset(features):
        fail("Objeto de features incompleto.")
    for feature, enabled in features.items():
        if not isinstance(enabled, bool):
            fail(f"Feature pública inválida: {feature}.")
    if features["offline"]:
        fail("A feature offline permanece indisponível nesta fase.")

    enabled_portals_value = value.get("enabledPortals")
    if not isinstance(enabled_portals_value, list):
        fail("Lista enabledPortals inválida.")
    enabled_portals: set[str] = set()
    for portal in enabled_portals_value:
        if not isinstance(portal, str) or portal not in PORTALS:
            fail(f"Portal inválido em enabledPortals: {portal}.")
        if portal in enabled_portals:
            fail(f"Portal duplicado em enabledPortals: {portal}.")
        enabled_portals.add(portal)

    registry_enabled = {
        portal for portal, entry in registry.items() if entry["enabled"]
    }
    if enabled_portals != registry_enabled:
        fail(
            "enabledPortals diverge dos tenants habilitados no registro "
            f"(runtime={sorted(enabled_portals)}, registro={sorted(registry_enabled)})."
        )
    if enabled_portals and not value["enabled"]:
        fail("Aplicação desabilitada não pode conter enabledPortals.")
    if value["enabled"] and api_base is None:
        fail("Aplicação habilitada exige base pública da API.")
    return enabled_portals


def canonical_route_path(value: object) -> str | None:
    if not isinstance(value, str) or not value:
        return None
    candidate = value.replace("\\", "/")
    try:
        for _ in range(4):
            decoded = unquote(candidate, errors="strict")
            if decoded == candidate:
                break
            candidate = decoded.replace("\\", "/")
        parsed = urlsplit(candidate)
    except (UnicodeError, ValueError):
        return None
    path = parsed.path.replace("\\", "/")
    if not path.startswith("/"):
        path = f"/{path}"
    normalized = posixpath.normpath(re.sub(r"/+", "/", path))
    if normalized != "/" and normalized.endswith("/"):
        normalized = normalized.rstrip("/")
    return normalized


def is_documentos_candidate(tool: object) -> bool:
    if not is_record(tool):
        return False
    title = tool.get("title")
    return (
        tool.get("managedBy") == DOCUMENTOS_MANAGER
        or (
            isinstance(title, str)
            and title.strip().casefold() == DOCUMENTOS_TITLE.casefold()
        )
        or canonical_route_path(tool.get("file")) == DOCUMENTOS_ROUTE.rstrip("/")
    )


def validate_extras(value: object | None, portal: str) -> None:
    if value is None:
        return
    if not isinstance(value, list):
        fail(f"extras.json do portal {portal} deve conter uma lista.")
    for index, entry in enumerate(value):
        if not is_record(entry):
            fail(f"Entrada {index} de extras.json do portal {portal} é inválida.")
        title = entry.get("title")
        href = entry.get("href")
        if not isinstance(title, str) or not title.strip():
            fail(f"Título inválido em extras.json do portal {portal}.")
        if not isinstance(href, str) or not href:
            fail(f"href inválido em extras.json do portal {portal}.")
        modified = validate_iso_date(
            entry.get("lastModified"),
            f"em extras.json do portal {portal}",
        )
        if "created" in entry:
            validate_iso_date(
                entry["created"],
                f"em extras.json do portal {portal}",
            )
        else:
            entry["created"] = modified
        if is_documentos_candidate(
            {"file": href, "title": title, "managedBy": entry.get("managedBy")}
        ):
            fail(f"Card Documentos manual em extras.json do portal {portal}.")


def validate_overrides(value: object | None, portal: str) -> None:
    if value is None:
        return
    if not is_record(value):
        fail(f"tools-overrides.json do portal {portal} deve conter um objeto.")
    for file_name, override in value.items():
        if not isinstance(file_name, str) or not file_name:
            fail(f"Chave inválida em tools-overrides.json do portal {portal}.")
        if not is_record(override):
            fail(f"Override inválido para {file_name} no portal {portal}.")
        assert_only_keys(
            override,
            OVERRIDE_KEYS,
            f"no override de {file_name} do portal {portal}",
        )
        if "title" in override and (
            not isinstance(override["title"], str) or not override["title"].strip()
        ):
            fail(f"Título inválido no override de {file_name} do portal {portal}.")
        if override.get("title", "").strip().casefold() == DOCUMENTOS_TITLE.casefold():
            fail(f"Card Documentos manual em override do portal {portal}.")
        if is_documentos_candidate({"file": file_name}):
            fail(f"Card Documentos manual em override do portal {portal}.")
        if "featured" in override and not isinstance(override["featured"], bool):
            fail(f"featured inválido no override de {file_name} do portal {portal}.")
        if "note" in override and not isinstance(override["note"], str):
            fail(f"note inválida no override de {file_name} do portal {portal}.")


def load_source_descriptor(snapshot: InputSnapshot, portal: str) -> dict:
    html = []
    for relative in snapshot.list_html(portal):
        source = snapshot.read_text(relative, "página HTML")
        assert source is not None
        html.append(
            {
                "file": relative.name,
                "source": normalized_html_source(source),
            }
        )

    extras = snapshot.read_json(
        Path(portal) / "extras.json",
        f"extras do portal {portal}",
        required=False,
    )
    overrides = snapshot.read_json(
        Path(portal) / "tools-overrides.json",
        f"overrides do portal {portal}",
        required=False,
    )
    validate_extras(extras, portal)
    validate_overrides(overrides, portal)
    return {"extras": extras, "html": html, "overrides": overrides}


def validate_managed_card(tool: dict, portal: str) -> None:
    expected_file = f"{DOCUMENTOS_ROUTE}?portal={portal}"
    if tool.get("managedBy") != DOCUMENTOS_MANAGER:
        fail(f"Card Documentos manual em tools.json do portal {portal}.")
    if (
        tool.get("file") != expected_file
        or tool.get("title") != DOCUMENTOS_TITLE
        or tool.get("external") is not True
    ):
        fail(f"Card Documentos gerenciado divergente no portal {portal}.")
    parsed = urlsplit(tool["file"])
    if parsed.fragment or parse_qs(parsed.query, keep_blank_values=True) != {
        "portal": [portal]
    }:
        fail(f"Rota do card Documentos divergente no portal {portal}.")
    validate_iso_date(tool.get("created"), f"no card Documentos do portal {portal}")
    validate_iso_date(
        tool.get("lastModified"),
        f"no card Documentos do portal {portal}",
    )


def validate_output(value: object, portal: str) -> tuple[dict, list[dict], list[dict]]:
    if not is_record(value):
        fail(f"tools.json inválido no portal {portal}.")
    assert_only_keys(value, OUTPUT_KEYS, f"em {portal}/tools.json")
    if value.get("portal") != portal:
        fail(f"Portal divergente em {portal}/tools.json.")
    generated_at = validate_iso_date(
        value.get("generatedAt"),
        f"em {portal}/tools.json",
    )
    tools = value.get("tools")
    if not isinstance(tools, list) or not all(is_record(tool) for tool in tools):
        fail(f"Lista de ferramentas inválida em {portal}/tools.json.")
    if (
        not isinstance(value.get("totalTools"), int)
        or isinstance(value.get("totalTools"), bool)
        or value["totalTools"] != len(tools)
    ):
        fail(f"totalTools divergente em {portal}/tools.json.")

    managed = []
    unmanaged = []
    seen_files: set[str] = set()
    for tool in tools:
        file_name = tool.get("file")
        title = tool.get("title")
        if (
            not isinstance(file_name, str)
            or not file_name
            or not isinstance(title, str)
            or not title.strip()
        ):
            fail(f"Ferramenta inválida em {portal}/tools.json.")
        if file_name in seen_files:
            if is_documentos_candidate(tool):
                fail(f"Card Documentos duplicado em tools.json do portal {portal}.")
            fail(f"Ferramenta duplicada em {portal}/tools.json: {file_name}.")
        seen_files.add(file_name)
        validate_iso_date(
            tool.get("created"),
            f"na ferramenta {file_name} do portal {portal}",
        )
        validate_iso_date(
            tool.get("lastModified"),
            f"na ferramenta {file_name} do portal {portal}",
        )
        if is_documentos_candidate(tool):
            if tool.get("managedBy") != DOCUMENTOS_MANAGER:
                fail(f"Card Documentos manual em tools.json do portal {portal}.")
            managed.append(tool)
        else:
            unmanaged.append(tool)
    if len(managed) > 1:
        fail(f"Card Documentos duplicado em tools.json do portal {portal}.")
    if managed:
        validate_managed_card(managed[0], portal)
    return {**value, "generatedAt": generated_at}, unmanaged, managed


def validate_baseline(value: object, anchor: object) -> dict[str, dict]:
    if not is_record(value):
        fail("Baseline não gerenciado inválido.")
    assert_only_keys(value, BASELINE_KEYS, "no baseline não gerenciado")
    if (
        value.get("schemaVersion") != 2
        or value.get("purpose") != BASELINE_PURPOSE
        or value.get("integrityAuthority") != BASELINE_AUTHORITY
        or not is_record(value.get("portals"))
        or set(value["portals"]) != set(PORTALS)
    ):
        fail("Schema do baseline não gerenciado inválido.")
    checksum = value.get("manifestSha256")
    if not isinstance(checksum, str) or not HEX_SHA256.fullmatch(checksum):
        fail("Checksum do baseline não gerenciado inválido.")
    unsigned = {key: item for key, item in value.items() if key != "manifestSha256"}
    if canonical_hash(unsigned) != checksum:
        fail("Baseline adulterado: checksum do manifest diverge.")

    if not is_record(anchor):
        fail("Âncora externa do baseline inválida.")
    assert_only_keys(anchor, ANCHOR_KEYS, "na âncora externa do baseline")
    if (
        set(anchor) != ANCHOR_KEYS
        or anchor.get("schemaVersion") != 1
        or anchor.get("authority") != BASELINE_AUTHORITY
    ):
        fail("Schema da âncora externa do baseline inválido.")
    anchored_checksum = anchor.get("baselineManifestSha256")
    if not isinstance(anchored_checksum, str) or not HEX_SHA256.fullmatch(
        anchored_checksum
    ):
        fail("Checksum da âncora externa do baseline inválido.")
    if anchored_checksum != checksum:
        fail(
            "Âncora externa do baseline diverge do manifest; "
            "a alteração exige revisão Git obrigatória."
        )

    validated: dict[str, dict] = {}
    for portal, entry in value["portals"].items():
        if not is_record(entry):
            fail(f"Entrada inválida no baseline do portal {portal}.")
        assert_only_keys(entry, BASELINE_ENTRY_KEYS, f"no baseline do portal {portal}")
        if set(entry) != BASELINE_ENTRY_KEYS:
            fail(f"Entrada incompleta no baseline do portal {portal}.")
        source_checksum = entry.get("sourceSha256")
        output_checksum = entry.get("unmanagedOutputSha256")
        if (
            not isinstance(source_checksum, str)
            or not HEX_SHA256.fullmatch(source_checksum)
            or not isinstance(output_checksum, str)
            or not HEX_SHA256.fullmatch(output_checksum)
        ):
            fail(f"Checksum inválido no baseline do portal {portal}.")
        unmanaged_output, unmanaged, managed = validate_output(
            entry.get("unmanagedOutput"),
            portal,
        )
        if managed:
            fail(f"Baseline do portal {portal} contém card gerenciado.")
        if unmanaged_output["totalTools"] != len(unmanaged):
            fail(f"totalTools inválido no baseline do portal {portal}.")
        if canonical_hash(unmanaged_output) != output_checksum:
            fail(f"Checksum do objeto não gerenciado diverge no portal {portal}.")
        validated[portal] = {
            "sourceSha256": source_checksum,
            "unmanagedOutput": unmanaged_output,
            "unmanagedOutputSha256": output_checksum,
        }
    return validated


def unmanaged_output_for(
    portal: str,
    current_output: dict,
    unmanaged: list[dict],
) -> dict:
    return {
        "portal": portal,
        "generatedAt": current_output["generatedAt"],
        "totalTools": len(unmanaged),
        "tools": unmanaged,
    }


def documentos_card(portal: str, timestamp: str) -> dict:
    return {
        "file": f"{DOCUMENTOS_ROUTE}?portal={portal}",
        "title": DOCUMENTOS_TITLE,
        "created": timestamp,
        "lastModified": timestamp,
        "external": True,
        "managedBy": DOCUMENTOS_MANAGER,
    }


def reconcile_documentos_card(
    portal: str,
    base_output: dict,
    unmanaged: list[dict],
    managed: list[dict],
    enabled: bool,
) -> dict:
    """Reconcilia somente o card Documentos sobre a base congelada."""
    if managed and not enabled:
        fail(f"Card Documentos presente em tenant desabilitado: {portal}.")

    tools = list(unmanaged)
    if enabled:
        tools.insert(
            0,
            documentos_card(portal, base_output["generatedAt"]),
        )
    return {
        "portal": portal,
        "generatedAt": base_output["generatedAt"],
        "totalTools": len(tools),
        "tools": tools,
    }


def render_output(value: dict) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


def validate_staged_outputs(
    root: Path,
    stage: Path,
    expected: dict[str, str],
) -> None:
    for portal in PORTALS:
        path = assert_safe_path(
            root,
            stage / portal / "tools.json",
            f"tools.json em staging do portal {portal}",
            expected="file",
        )
        try:
            source = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as error:
            fail(f"Não foi possível ler staging do portal {portal}: {error}.")
        if source != expected[portal]:
            fail(f"Saída divergente no staging do portal {portal}.")
        validate_output(parse_json_text(source, path), portal)


def write_recovery_manifest(
    root: Path,
    backup: Path,
    promoted: list[str],
    backed_up: list[str],
    rollback_errors: list[str],
) -> None:
    manifest = {
        "status": "rollback-incomplete",
        "promoted": promoted,
        "backedUp": backed_up,
        "rollbackErrors": rollback_errors,
        "instruction": (
            "Preserve este diretório. Restaure manualmente cada "
            "<portal>.tools.json somente após revisão do incidente."
        ),
    }
    path = assert_safe_path(
        root,
        backup / "RECOVERY.json",
        "Manifest de recuperação",
        required=False,
    )
    path.write_text(render_output(manifest), encoding="utf-8", newline="\n")


def exact_current_outputs(root: Path) -> dict[str, str]:
    current = {}
    for portal in PORTALS:
        path = assert_safe_path(
            root,
            root / portal / "tools.json",
            f"tools.json do portal {portal}",
            expected="file",
        )
        try:
            with path.open("r", encoding="utf-8", newline="") as source:
                current[portal] = source.read()
        except (OSError, UnicodeError) as error:
            fail(f"Não foi possível revalidar tools.json do portal {portal}: {error}.")
    return current


def promote_outputs(
    root: Path,
    snapshot: InputSnapshot,
    candidates: dict[str, str],
    expected_current: dict[str, str],
) -> bool:
    hold_before_promotion = test_hook(
        root,
        "PORTAL_TOOLS_TEST_HOLD_BEFORE_PROMOTION_MS",
    )
    if hold_before_promotion is not None:
        delay_ms = int(hold_before_promotion)
        if delay_ms < 0 or delay_ms > 5_000:
            fail("Atraso de teste antes da promoção fora do limite.")
        print("Teste interno: snapshot capturado; promoção aguardando.", flush=True)
        time.sleep(delay_ms / 1000)

    snapshot.assert_unchanged()
    current = exact_current_outputs(root)
    if current != expected_current:
        fail("Snapshot dos tools.json divergiu imediatamente antes da promoção.")
    if all(current[portal] == candidates[portal] for portal in PORTALS):
        return False

    stage = Path(tempfile.mkdtemp(prefix=".portal-tools-stage-", dir=root))
    backup = root / f".portal-tools-backup-{uuid.uuid4().hex}"
    promoted: list[str] = []
    backed_up: list[str] = []
    rollback_incomplete = False
    try:
        assert_safe_path(root, stage, "Diretório de staging", expected="dir")
        for portal in PORTALS:
            stage_portal = stage / portal
            stage_portal.mkdir()
            path = stage_portal / "tools.json"
            path.write_text(candidates[portal], encoding="utf-8", newline="\n")
        validate_staged_outputs(root, stage, candidates)

        snapshot.assert_unchanged()
        if exact_current_outputs(root) != expected_current:
            fail("Snapshot dos tools.json divergiu imediatamente antes da promoção.")

        backup.mkdir()
        assert_safe_path(root, backup, "Diretório de backup", expected="dir")
        for portal in PORTALS:
            target = assert_safe_path(
                root,
                root / portal / "tools.json",
                f"tools.json do portal {portal}",
                expected="file",
            )
            os.replace(target, backup / f"{portal}.tools.json")
            backed_up.append(portal)

        injected_after = test_hook(
            root,
            "PORTAL_TOOLS_TEST_FAIL_AFTER_PROMOTIONS",
        )
        fail_after = int(injected_after) if injected_after is not None else None
        for portal in PORTALS:
            staged = assert_safe_path(
                root,
                stage / portal / "tools.json",
                f"tools.json staged do portal {portal}",
                expected="file",
            )
            target = assert_safe_path(
                root,
                root / portal / "tools.json",
                f"Destino do portal {portal}",
                required=False,
            )
            os.replace(staged, target)
            promoted.append(portal)
            if fail_after is not None and len(promoted) == fail_after:
                raise GenerationError("Falha de promoção injetada para teste.")
    except Exception as original_error:
        rollback_errors = []
        injected_rollback = test_hook(
            root,
            "PORTAL_TOOLS_TEST_FAIL_ROLLBACK_FOR",
        )
        for portal in reversed(promoted):
            if portal == injected_rollback:
                rollback_errors.append(
                    f"{portal}: falha de rollback injetada antes da remoção"
                )
                continue
            target = root / portal / "tools.json"
            try:
                safe_target = assert_safe_path(
                    root,
                    target,
                    f"Destino promovido do portal {portal}",
                    expected="file",
                )
                safe_target.unlink()
            except Exception as rollback_error:
                rollback_errors.append(f"{portal}: {rollback_error}")

        for portal in reversed(backed_up):
            saved = backup / f"{portal}.tools.json"
            if portal == injected_rollback:
                if not any(item.startswith(f"{portal}:") for item in rollback_errors):
                    rollback_errors.append(
                        f"{portal}: falha de rollback injetada antes da restauração"
                    )
                continue
            try:
                safe_saved = assert_safe_path(
                    root,
                    saved,
                    f"Backup do portal {portal}",
                    expected="file",
                )
                destination = assert_safe_path(
                    root,
                    root / portal / "tools.json",
                    f"Destino de restauração do portal {portal}",
                    required=False,
                )
                if os.path.lexists(destination):
                    fail(
                        f"Destino de restauração do portal {portal} está ocupado; "
                        "o backup foi preservado."
                    )
                os.replace(safe_saved, destination)
            except Exception as rollback_error:
                rollback_errors.append(f"{portal}: {rollback_error}")

        if rollback_errors:
            rollback_incomplete = True
            try:
                write_recovery_manifest(
                    root,
                    backup,
                    promoted,
                    backed_up,
                    rollback_errors,
                )
            except Exception as manifest_error:
                rollback_errors.append(f"manifesto: {manifest_error}")
            raise GenerationError(
                f"{original_error} Rollback falhou; backup de recuperação "
                f"preservado em {backup}. Detalhes: {'; '.join(rollback_errors)}"
            ) from original_error
        raise
    finally:
        shutil.rmtree(stage, ignore_errors=True)
        if not rollback_incomplete:
            shutil.rmtree(backup, ignore_errors=True)
    return True


@contextmanager
def generation_lock(root: Path):
    lock_path = assert_safe_path(
        root,
        root / ".portal-tools.lock",
        "Lock de geração",
        required=False,
    )
    token = uuid.uuid4().hex
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY
    if hasattr(os, "O_BINARY"):
        flags |= os.O_BINARY
    try:
        descriptor = os.open(lock_path, flags, 0o600)
    except FileExistsError:
        fail(
            "Geração concorrente detectada: .portal-tools.lock já existe; "
            "nenhuma escrita foi iniciada."
        )
    try:
        payload = json.dumps({"pid": os.getpid(), "token": token}).encode("utf-8")
        os.write(descriptor, payload)
        os.fsync(descriptor)
    finally:
        os.close(descriptor)

    try:
        hold_ms = test_hook(root, "PORTAL_TOOLS_TEST_HOLD_LOCK_MS")
        if hold_ms is not None:
            delay_ms = int(hold_ms)
            if delay_ms < 0 or delay_ms > 5_000:
                fail("Atraso de teste do lock fora do limite.")
            time.sleep(delay_ms / 1000)
        yield
    finally:
        try:
            safe_lock = assert_safe_path(
                root,
                lock_path,
                "Lock de geração",
                expected="file",
            )
            current = json.loads(safe_lock.read_text(encoding="utf-8"))
            if current.get("token") == token:
                safe_lock.unlink()
        except (GenerationError, OSError, UnicodeError, json.JSONDecodeError):
            pass


def generate(root: Path) -> tuple[int, bool]:
    with generation_lock(root):
        snapshot = InputSnapshot(root)
        registry = validate_registry(
            snapshot.read_json(
                Path("scripts") / "documentos-tenants.json",
                "Registro declarativo de tenants",
            )
        )
        enabled_portals = validate_runtime_config(
            snapshot.read_json(
                Path("scripts") / "documentos-runtime-config.json",
                "Configuração pública do Hub Documentos",
            ),
            registry,
        )
        baseline_value = snapshot.read_json(
            Path("scripts") / "portal-tools-unmanaged-baseline.json",
            "Baseline não gerenciado",
        )
        anchor_value = snapshot.read_json(
            Path("scripts") / "portal-tools-unmanaged-baseline.anchor.json",
            "Âncora externa do baseline",
        )
        baseline = validate_baseline(baseline_value, anchor_value)

        candidates: dict[str, str] = {}
        current_sources: dict[str, str] = {}
        for portal in PORTALS:
            descriptor = load_source_descriptor(snapshot, portal)
            if canonical_hash(descriptor) != baseline[portal]["sourceSha256"]:
                fail(
                    f"Fonte não gerenciada diverge do baseline em {portal}; "
                    "a regeneração geral exige fluxo separado e autorizado."
                )

            output_relative = Path(portal) / "tools.json"
            current_source = snapshot.read_text(
                output_relative,
                f"tools.json do portal {portal}",
            )
            assert current_source is not None
            current_sources[portal] = current_source
            current_output, unmanaged, managed = validate_output(
                parse_json_text(current_source, root / output_relative),
                portal,
            )
            if managed and portal not in enabled_portals:
                fail(f"Card Documentos presente em tenant desabilitado: {portal}.")

            unmanaged_output = unmanaged_output_for(
                portal,
                current_output,
                unmanaged,
            )
            expected_unmanaged = baseline[portal]["unmanagedOutput"]
            if (
                unmanaged_output != expected_unmanaged
                or canonical_hash(unmanaged_output)
                != baseline[portal]["unmanagedOutputSha256"]
            ):
                fail(
                    f"Saída não gerenciada diverge do baseline em {portal} "
                    "(portal, generatedAt, totalTools ou tools); a regeneração "
                    "geral exige fluxo separado e autorizado."
                )

            reconciled = reconcile_documentos_card(
                portal,
                expected_unmanaged,
                unmanaged,
                managed,
                portal in enabled_portals,
            )
            candidates[portal] = (
                current_source
                if reconciled == current_output
                else render_output(reconciled)
            )

        changed = promote_outputs(
            root,
            snapshot,
            candidates,
            current_sources,
        )
        return len(enabled_portals), changed


def root_from_args(args: list[str]) -> Path:
    if len(args) > 1:
        fail("Uso: python scripts/generate-portal-tools.py [raiz-do-repositório].")
    return assert_safe_root(Path(args[0] if args else "."))


def main() -> int:
    try:
        enabled_count, changed = generate(root_from_args(sys.argv[1:]))
    except (GenerationError, OSError, ValueError) as error:
        print(f"Erro ao gerar portal tools: {error}", file=sys.stderr)
        return 1
    state = "conjunto promovido" if changed else "sem reescrita"
    print(f"Portal tools validado: {enabled_count} cards Documentos; {state}.")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
