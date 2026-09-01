#!/usr/bin/env python3
"""Notificação temporária de Milestones do projeto Compass™ v2."""

from __future__ import annotations

import argparse
import html
import json
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

PROJECT_NAME = "Compass™ v2"
PRD_NAME = "compass-v2-transicao"
TABLE_NAME = "prd_milestones"
TO = ["guilherme@grupocsv.com"]
FROM_NAME = "Grupo CSV"
FROM_EMAIL = "guilherme@mail.grupocsv.com"
DEFAULT_CONFIG = Path.home() / "workspace" / "config.json"
DEFAULT_SECRET = Path.home() / ".config" / "compass-v2" / "secrets.json"


def load_config() -> dict:
    config_path = Path(os.environ.get("CSV_CONFIG_PATH", DEFAULT_CONFIG))
    if not config_path.exists():
        return {}
    return json.loads(config_path.read_text(encoding="utf-8"))


def get_settings() -> dict[str, str]:
    config = load_config()
    supabase = config.get("supabase", {}).get("csvbrain", {})
    csv_mail = config.get("csv_mail", {})
    local_secret_path = Path(os.environ.get("COMPASS_V2_SECRET_PATH", DEFAULT_SECRET))
    local_secrets = (
        json.loads(local_secret_path.read_text(encoding="utf-8"))
        if local_secret_path.exists()
        else {}
    )

    supabase_url = os.environ.get("SUPABASE_URL") or supabase.get("url", "")
    supabase_key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_KEY")
        or supabase.get("service_role_key", "")
        or supabase.get("key", "")
    )
    csv_mail_key = (
        os.environ.get("CSV_MAIL_API_KEY")
        or local_secrets.get("csv_mail_api_key", "")
        or csv_mail.get("api_key", "")
    )
    csv_mail_url = os.environ.get("CSV_MAIL_URL") or csv_mail.get("url", "https://mail-api.grupocsv.com")
    csv_mail_url = csv_mail_url.rstrip("/")
    if not csv_mail_url.endswith("/send-template"):
        csv_mail_url += "/send-template"

    missing = [
        name
        for name, value in (
            ("SUPABASE_URL", supabase_url),
            ("SUPABASE_KEY", supabase_key),
            ("CSV_MAIL_API_KEY", csv_mail_key),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(f"Configuração ausente: {', '.join(missing)}")

    return {
        "supabase_url": supabase_url,
        "supabase_key": supabase_key,
        "csv_mail_key": csv_mail_key,
        "csv_mail_url": csv_mail_url,
    }


def fetch_milestones(settings: dict[str, str], milestone_id: str | None = None) -> list[dict]:
    url = f"{settings['supabase_url'].rstrip('/')}/rest/v1/{TABLE_NAME}"
    headers = {
        "apikey": settings["supabase_key"],
        "Authorization": f"Bearer {settings['supabase_key']}",
    }
    params = {
        "prd_name": f"eq.{PRD_NAME}",
        "select": "milestone_id,title,description,status,criteria,started_at,completed_at",
        "order": "id.asc",
        "limit": "20",
    }
    if milestone_id:
        params["milestone_id"] = f"eq.{milestone_id}"

    response = requests.get(url, headers=headers, params=params, timeout=20)
    response.raise_for_status()
    return response.json()


def build_status_html(milestones: list[dict], event: str | None = None) -> str:
    now = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%d/%m/%Y %H:%M")
    status_map = {
        "pending": ("Pendente", "#64748b"),
        "in_progress": ("Em andamento", "#d97706"),
        "completed": ("Concluído", "#059669"),
        "blocked": ("Bloqueado", "#dc2626"),
    }

    event_html = ""
    if event:
        event_html = (
            '<p style="background:#0d264c;color:#fff;padding:12px 16px;border-radius:8px;'
            f'font-weight:700;font-size:16px;margin-bottom:20px;">{html.escape(event)}</p>'
        )

    rows: list[str] = []
    for milestone in milestones:
        criteria = milestone.get("criteria") or []
        done_count = sum(1 for criterion in criteria if criterion.get("done"))
        total = len(criteria)
        percentage = int((done_count / total) * 100) if total else 0
        label, color = status_map.get(milestone.get("status"), ("Indefinido", "#64748b"))
        criteria_html = "".join(
            (
                '<div style="font-size:13px;color:#374151;padding:3px 0;">'
                f"{'&#9745;' if criterion.get('done') else '&#9744;'} "
                f"{html.escape(criterion.get('desc') or criterion.get('text') or '')}</div>"
            )
            for criterion in criteria
        )
        rows.append(
            f"""
            <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <strong style="font-size:15px;color:#0f172a;">{html.escape(milestone['milestone_id'])}: {html.escape(milestone['title'])}</strong>
                <span style="background:{color};color:#fff;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">{label}</span>
              </div>
              <div style="font-size:13px;color:#64748b;margin-top:5px;">{html.escape(milestone.get('description') or '')}</div>
              <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;margin-top:10px;">
                <div style="background:{color};border-radius:4px;height:8px;width:{percentage}%;"></div>
              </div>
              <div style="font-size:12px;color:#94a3b8;margin-top:4px;">{done_count}/{total} critérios ({percentage}%)</div>
              <div style="margin-top:9px;border-top:1px solid #f1f5f9;padding-top:8px;">{criteria_html}</div>
            </div>
            """
        )

    total_criteria = sum(len(milestone.get("criteria") or []) for milestone in milestones)
    done_criteria = sum(
        sum(1 for criterion in (milestone.get("criteria") or []) if criterion.get("done"))
        for milestone in milestones
    )
    overall = int((done_criteria / total_criteria) * 100) if total_criteria else 0

    return f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;">
      {event_html}
      <h2 style="color:#0f172a;font-size:20px;margin-bottom:4px;">{PROJECT_NAME} — acompanhamento por Milestones</h2>
      <p style="color:#64748b;font-size:13px;margin-top:0;">Atualizado em {now}</p>
      <div style="background:#f8fafc;border-radius:10px;padding:14px 16px;margin-bottom:18px;">
        <div style="font-size:13px;color:#64748b;">Progresso geral</div>
        <div style="font-size:26px;font-weight:800;color:#0f172a;">{overall}%</div>
        <div style="background:#e2e8f0;border-radius:4px;height:10px;width:100%;margin-top:5px;">
          <div style="background:#1d7ab5;border-radius:4px;height:10px;width:{overall}%;"></div>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">{done_criteria}/{total_criteria} critérios concluídos</div>
      </div>
      {''.join(rows)}
      <p style="font-size:11px;color:#94a3b8;margin-top:20px;border-top:1px solid #e2e8f0;padding-top:12px;">
        Ferramenta temporária de gestão do projeto {PROJECT_NAME}. Estado: Supabase csv-brain / {TABLE_NAME} / {PRD_NAME}.
      </p>
    </div>
    """


def build_subject(milestones: list[dict], event: str | None) -> str:
    if event:
        return f"{PROJECT_NAME} | {event}"
    active = next((item for item in milestones if item.get("status") == "in_progress"), None)
    if active:
        criteria = active.get("criteria") or []
        done = sum(1 for criterion in criteria if criterion.get("done"))
        return f"{PROJECT_NAME} | {active['milestone_id']} em andamento ({done}/{len(criteria)})"
    if milestones and all(item.get("status") == "completed" for item in milestones):
        return f"{PROJECT_NAME} | Projeto concluído"
    return f"{PROJECT_NAME} | Status do PRD"


def send_email(settings: dict[str, str], subject: str, body_html: str) -> dict:
    payload = {
        "to": TO,
        "subject": subject,
        "html": body_html,
        "from_name": FROM_NAME,
        "from_email": FROM_EMAIL,
        "tags": [
            {"name": "source", "value": "compass-v2"},
            {"name": "project", "value": "hub-csv"},
        ],
    }
    response = requests.post(
        settings["csv_mail_url"],
        headers={
            "Authorization": f"Bearer {settings['csv_mail_key']}",
            "Content-Type": "application/json",
            "User-Agent": "csv-mail-client/1.0",
        },
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def main() -> None:
    parser = argparse.ArgumentParser(description="Notificação de status do Compass™ v2")
    parser.add_argument("--milestone")
    parser.add_argument("--event")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    settings = get_settings()
    milestones = fetch_milestones(settings, args.milestone)
    if not milestones:
        raise SystemExit("Nenhum Milestone encontrado para o projeto.")

    subject = build_subject(milestones, args.event)
    body_html = build_status_html(milestones, args.event)
    if args.dry_run:
        print(subject)
        print(body_html)
        return

    result = send_email(settings, subject, body_html)
    message_id = result.get("id") or result.get("message_id") or result.get("data", {}).get("id") or "não informado"
    print(f"E-mail enviado: {subject}; id={message_id}")


if __name__ == "__main__":
    main()
