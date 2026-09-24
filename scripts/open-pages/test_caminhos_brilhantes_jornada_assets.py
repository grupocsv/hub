#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Testes de aceitação da seção de materiais da Jornada TEA."""

import os
import pathlib
import re
import subprocess
import unittest
import urllib.request


TARGET = os.environ.get(
    "CAMINHOS_HTML_TARGET",
    "https://open.grupocsv.com/caminhos-brilhantes/",
)
RELATORIO_PDF = pathlib.Path(__file__).parent / "assets" / "caminhos-brilhantes" / "relatorio-tecnico-jornada-tea.pdf"


def carregar_html(target):
    if target.startswith(("http://", "https://")):
        req = urllib.request.Request(target, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resposta:
            return resposta.read().decode("utf-8")
    return pathlib.Path(target).read_text(encoding="utf-8")


class JornadaAssetsAcceptanceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = carregar_html(TARGET)

    def test_mantem_acesso_a_pagina_interativa(self):
        self.assertIn('href="https://open.grupocsv.com/jornada-tea/"', self.html)
        self.assertIn("Abrir versão interativa", self.html)

    def test_oferece_imagem_em_alta_resolucao(self):
        self.assertIn('/caminhos-brilhantes/jornada-tea-diagrama-alta.png', self.html)
        self.assertIn("Ver desenho em alta", self.html)

    def test_oferece_pdf_a3_original(self):
        self.assertIn('/caminhos-brilhantes/jornada-tea-a3.pdf', self.html)
        self.assertIn("Baixar PDF A3", self.html)

    def test_incorpora_relatorio_tecnico(self):
        self.assertIn("Relatório Técnico da Jornada", self.html)
        self.assertRegex(
            self.html,
            r'<iframe[^>]+src="/caminhos-brilhantes/relatorio-tecnico-jornada-tea\.pdf#view=FitH"[^>]+title="Relatório Técnico da Jornada em PDF"',
        )
        self.assertIn("Abrir relatório em nova aba", self.html)
        self.assertIn("Baixar relatório técnico", self.html)

    def test_visualizador_tem_fallback_responsivo(self):
        self.assertIn('class="pdf-mobile-actions"', self.html)
        self.assertIn('@media(max-width:767px)', self.html)
        self.assertIn('.pdf-viewer-shell{display:none}', self.html)
        self.assertIn('.pdf-mobile-actions{display:flex}', self.html)

    def test_interface_nao_usa_termo_proibido(self):
        self.assertIsNone(re.search(r"dossi[eê]", self.html, re.IGNORECASE))

    def test_pdf_incorporado_nao_usa_termo_proibido(self):
        texto = subprocess.run(
            ["pdftotext", "-layout", str(RELATORIO_PDF), "-"],
            check=True,
            capture_output=True,
            text=True,
        ).stdout
        self.assertIsNone(re.search(r"dossi[eê]", texto, re.IGNORECASE))
        self.assertIn("RELATÓRIO TÉCNICO", texto)
        self.assertIn("O QUE ESTE RELATÓRIO NÃO RESPONDE", texto)


if __name__ == "__main__":
    unittest.main(verbosity=2)
