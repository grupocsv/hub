#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get(
    "CAMINHOS_QA_BASE_URL",
    "http://127.0.0.1:8765/caminhos-brilhantes/",
)
OUT = Path(__file__).resolve().parents[2] / "qa-output"
OUT.mkdir(exist_ok=True)


def medir(page):
    return page.evaluate(
        """() => ({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          objectDisplay: getComputedStyle(document.querySelector('.pdf-viewer-shell')).display,
          objectComputedHeight: getComputedStyle(document.querySelector('.pdf-viewer-shell')).height,
          objectMinHeight: getComputedStyle(document.querySelector('.pdf-viewer-shell')).minHeight,
          objectMaxHeight: getComputedStyle(document.querySelector('.pdf-viewer-shell')).maxHeight,
          mobileActionsDisplay: getComputedStyle(document.querySelector('.pdf-mobile-actions')).display,
          viewerHeight: document.querySelector('.pdf-viewer-shell').getBoundingClientRect().height,
          viewerWidth: document.querySelector('.pdf-viewer-shell').getBoundingClientRect().width,
          viewerClientHeight: document.querySelector('.pdf-viewer-shell').clientHeight,
          viewerOffsetHeight: document.querySelector('.pdf-viewer-shell').offsetHeight,
          reportTransform: getComputedStyle(document.querySelector('.report-viewer')).transform,
          sectionTransform: getComputedStyle(document.querySelector('.report-viewer').closest('section')).transform,
          cardWidth: document.querySelector('.dl-jornada').getBoundingClientRect().width,
          actionsWidth: document.querySelector('.dl-actions').getBoundingClientRect().width
        })"""
    )


def validar_assets(context):
    esperados = {
        "jornada-tea-diagrama-alta.png": "image/png",
        "jornada-tea-a3.pdf": "application/pdf",
        "relatorio-tecnico-jornada-tea.pdf": "application/pdf",
    }
    resultados = {}
    for nome, content_type in esperados.items():
        resposta = context.request.get(BASE_URL + nome)
        assert resposta.ok, (nome, resposta.status)
        recebido = resposta.headers.get("content-type", "")
        assert content_type in recebido, (nome, recebido)
        resultados[nome] = {
            "status": resposta.status,
            "content_type": recebido,
            "bytes": len(resposta.body()),
        }
    return resultados


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    erros_console = []
    page.on("console", lambda msg: erros_console.append(msg.text) if msg.type == "error" else None)
    page.goto(BASE_URL, wait_until="networkidle")
    page.locator("#jornada-materiais-titulo").scroll_into_view_if_needed()
    page.wait_for_timeout(500)

    assert page.get_by_role("link", name="Abrir versão interativa →").count() == 1
    assert page.get_by_role("link", name="Ver desenho em alta ↗").count() == 1
    assert page.get_by_role("link", name="Baixar PDF A3 ↓").count() == 1
    assert page.get_by_role("heading", name="Relatório Técnico da Jornada").count() == 1
    assert page.locator("iframe.pdf-viewer-shell").count() == 1

    desktop = medir(page)
    print("desktop", json.dumps(desktop, ensure_ascii=False))
    assert desktop["scrollWidth"] <= desktop["innerWidth"]
    assert desktop["bodyScrollWidth"] <= desktop["innerWidth"]
    assert desktop["objectDisplay"] != "none"
    assert desktop["viewerHeight"] >= 620
    page.locator("section:has(#jornada-materiais-titulo)").screenshot(path=str(OUT / "materiais-desktop.png"))

    assets = validar_assets(context)
    context.close()

    mobile_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
    mobile = mobile_context.new_page()
    erros_mobile = []
    mobile.on("console", lambda msg: erros_mobile.append(msg.text) if msg.type == "error" else None)
    mobile.goto(BASE_URL, wait_until="networkidle")
    mobile.locator("#jornada-materiais-titulo").scroll_into_view_if_needed()
    mobile.wait_for_timeout(500)

    medidas_mobile = medir(mobile)
    print("mobile", json.dumps(medidas_mobile, ensure_ascii=False))
    assert medidas_mobile["scrollWidth"] <= medidas_mobile["innerWidth"]
    assert medidas_mobile["bodyScrollWidth"] <= medidas_mobile["innerWidth"]
    assert medidas_mobile["objectDisplay"] == "none"
    assert medidas_mobile["mobileActionsDisplay"] == "flex"
    mobile_open = mobile.locator(".pdf-mobile-actions").get_by_role("link", name="Abrir relatório em nova aba ↗")
    mobile_download = mobile.locator(".pdf-mobile-actions").get_by_role("link", name="Baixar relatório técnico ↓")
    assert mobile_open.count() == 1 and mobile_open.is_visible()
    assert mobile_download.count() == 1 and mobile_download.is_visible()
    mobile.locator("section:has(#jornada-materiais-titulo)").screenshot(path=str(OUT / "materiais-mobile.png"))

    assert not erros_console, erros_console
    assert not erros_mobile, erros_mobile
    mobile_context.close()
    browser.close()

resultado = {
    "desktop": desktop,
    "mobile": medidas_mobile,
    "assets": assets,
    "console_errors_desktop": erros_console,
    "console_errors_mobile": erros_mobile,
}
(OUT / "qa-result.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(resultado, ensure_ascii=False, indent=2))
