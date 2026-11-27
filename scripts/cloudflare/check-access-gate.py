#!/usr/bin/env python3
"""Trava do Hub de teste: so deixa publicar se o Cloudflare Access ja
protege a raiz do endereco.

Le as aplicacoes do Access da conta (precisa da permissao de leitura de
aplicacoes e politicas do Access no token) e sai com erro se nenhuma
aplicacao autohospedada cobrir o endereco inteiro (host ou host/*) com ao
menos uma politica que nao seja de passagem livre (bypass).
"""
import json
import os
import sys
import urllib.request

API = "https://api.cloudflare.com/client/v4"


def destinations(app: dict) -> list[str]:
    out = [app.get("domain") or ""]
    out += app.get("self_hosted_domains") or []
    out += [d.get("uri", "") for d in app.get("destinations") or [] if d.get("type", "public") == "public"]
    return [d.strip().lower() for d in out if d]


def covers_root(app: dict, host: str) -> bool:
    if app.get("type") != "self_hosted":
        return False
    host = host.lower()
    if not any(d in (host, f"{host}/", f"{host}/*") for d in destinations(app)):
        return False
    policies = app.get("policies") or []
    return any((p.get("decision") or "") != "bypass" for p in policies)


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
    apps = fetch_apps(account_id, token)
    hits = [a.get("name") for a in apps if covers_root(a, host)]
    if not hits:
        print(f"::error::nenhuma aplicacao do Access protege {host}; publicacao cancelada")
        return 1
    print(f"Access protege {host}: {', '.join(hits)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
