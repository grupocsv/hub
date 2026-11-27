#!/usr/bin/env python3
"""Trava do Access: so deixa publicar o Hub se a porta estiver fechada de fato.

Le as aplicacoes do Cloudflare Access da conta (o token precisa de leitura
de aplicacoes e politicas do Access) e recusa a publicacao quando:

- nenhuma aplicacao autohospedada protege a raiz do endereco (host ou host/*);
- alguma politica que deixa entrar inclui "todo mundo", qualquer token de
  servico, uma faixa de IP, um grupo, uma lista ou qualquer regra que a
  trava nao saiba ler;
- alguma politica libera um dominio de e-mail fora da lista permitida
  (dominios publicos como gmail.com nunca entram);
- alguma politica de passagem livre (bypass) cobre um caminho que nao esta
  na lista de caminhos publicos, ou a raiz.

A lista permitida fica em cloudflare/hub-access-policy.json. Na duvida, a
trava recusa.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

API = "https://api.cloudflare.com/client/v4"
POLICY_FILE = Path(__file__).resolve().parents[2] / "cloudflare/hub-access-policy.json"

# Regras de "quem entra" que a trava aceita, desde que nominais.
NAMED_RULES = {"email", "email_domain", "service_token"}


def destinations(app: dict) -> list[str]:
    out = [app.get("domain") or ""]
    out += app.get("self_hosted_domains") or []
    out += [d.get("uri", "") for d in app.get("destinations") or [] if d.get("type", "public") == "public"]
    return [d.strip().lower() for d in out if d]


def path_on_host(dest: str, host: str) -> str | None:
    """Caminho que a destinacao cobre no host, ou None se for outro host."""
    if dest == host or dest.startswith(host + "/"):
        path = dest[len(host):] or "/"
        if path.endswith("/*"):
            path = path[:-2] or "/"
        if len(path) > 1 and path.endswith("/"):
            path = path[:-1]
        return path or "/"
    return None


def app_paths(app: dict, host: str) -> list[str]:
    return [p for p in (path_on_host(d, host) for d in destinations(app)) if p is not None]


def rule_problems(rule: dict, allowed_domains: set[str]) -> list[str]:
    if len(rule) != 1:
        return [f"regra em formato inesperado: {sorted(rule)}"]
    kind, value = next(iter(rule.items()))
    if kind not in NAMED_RULES:
        return [f"regra '{kind}' nao e aceita (abre a porta ou nao da para conferir)"]
    if kind == "email_domain":
        domain = str((value or {}).get("domain", "")).lower().lstrip("@")
        if domain not in allowed_domains:
            return [f"dominio de e-mail fora da lista: {domain or '(vazio)'}"]
    if kind == "email" and not (value or {}).get("email"):
        return ["regra de e-mail sem endereco"]
    if kind == "service_token" and not (value or {}).get("token_id"):
        return ["regra de token de servico sem token nominal"]
    return []


def public_path(path: str, public_paths: list[str]) -> bool:
    if path == "/":
        return False
    return any(path == p or path.startswith(p.rstrip("/") + "/") for p in public_paths)


def app_problems(app: dict, host: str, policy: dict) -> list[str]:
    name = app.get("name") or app.get("id") or "?"
    allowed = {d.lower() for d in policy["allowed_email_domains"]}
    paths = app_paths(app, host)
    policies = app.get("policies")
    if policies is None:
        return [f"{name}: a API nao trouxe as politicas; sem como conferir"]
    problems: list[str] = []
    for pol in policies:
        decision = (pol.get("decision") or "").lower()
        rules = list(pol.get("include") or [])
        if decision == "bypass":
            for path in paths:
                if not public_path(path, policy["public_paths"]):
                    problems.append(f"{name}: passagem livre em caminho que nao e publico: {path}")
            continue
        if decision == "deny":
            continue
        if decision not in {"allow", "non_identity"}:
            problems.append(f"{name}: decisao desconhecida: {decision or '(vazia)'}")
            continue
        if not rules:
            problems.append(f"{name}: politica '{pol.get('name', '?')}' sem regra de inclusao")
        for rule in rules:
            problems += [f"{name}: {p}" for p in rule_problems(rule, allowed)]
    return problems


def evaluate(apps: list[dict], host: str, policy: dict) -> tuple[list[str], list[str]]:
    """Devolve (aplicacoes que protegem a raiz, problemas)."""
    host = host.lower()
    mine = [a for a in apps if a.get("type") == "self_hosted" and app_paths(a, host)]
    roots = [
        a for a in mine
        if "/" in app_paths(a, host)
        and any((p.get("decision") or "").lower() in {"allow", "non_identity"} for p in a.get("policies") or [])
    ]
    problems: list[str] = []
    if not roots:
        problems.append(f"nenhuma aplicacao do Access protege a raiz de {host}")
    for app in mine:
        problems += app_problems(app, host, policy)
    return [a.get("name") or a.get("id") for a in roots], problems


def fetch_apps(account_id: str, token: str) -> list[dict]:
    apps: list[dict] = []
    page = 1
    while True:
        req = urllib.request.Request(
            f"{API}/accounts/{account_id}/access/apps?per_page=100&page={page}",
            headers={"Authorization": f"Bearer {token}"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.load(resp)
        if not body.get("success"):
            raise RuntimeError(f"API do Access recusou a leitura: {body.get('errors')}")
        apps += body.get("result") or []
        info = body.get("result_info") or {}
        if page >= int(info.get("total_pages") or 1):
            return apps
        page += 1


def main() -> int:
    if len(sys.argv) != 3:
        print("uso: check-access-gate.py <account_id> <host>", file=sys.stderr)
        return 2
    account_id, host = sys.argv[1], sys.argv[2]
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    if not token:
        print("::error::CLOUDFLARE_API_TOKEN ausente", file=sys.stderr)
        return 1
    policy = json.loads(POLICY_FILE.read_text(encoding="utf-8"))
    roots, problems = evaluate(fetch_apps(account_id, token), host, policy)
    for p in problems:
        print(f"::error::{p}")
    if problems:
        print(f"Publicacao cancelada: a porta de {host} nao esta fechada como deveria.")
        return 1
    print(f"Access protege {host}: {', '.join(roots)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
