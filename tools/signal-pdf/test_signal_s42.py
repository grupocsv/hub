#!/usr/bin/env python3
"""Aceitação editorial e estrutural do Signal™ S42/2026."""
import importlib.util
import re
import tempfile
import unittest
from pathlib import Path
from pypdf import PdfReader

SCRIPT = Path(__file__).with_name("signal-pdf-gen-s42.py")
if not SCRIPT.exists():
    SCRIPT = SCRIPT.with_name("signal-pdf-gen-s41.py")
spec = importlib.util.spec_from_file_location("signal_s42", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SignalS42Tests(unittest.TestCase):
    def test_edicao(self):
        self.assertEqual(module.SEMANA, "42")
        self.assertEqual(module.PERIODO, "12 a 16 de outubro de 2026")
        self.assertEqual(module.DATA_GERACAO, "23/10/2026")
        self.assertIn(("v4.20", "Dicionário Oficial"), module.METRICAS)
        self.assertIn(("50", "Movimentos no Dicionário"), module.METRICAS)
        self.assertEqual(len(module.FATOS), 6)
        self.assertEqual(len(module.OBSERVACOES), 2)

    def test_identidade(self):
        self.assertTrue(module.LOGO_PATH.endswith("grupo_csv_logo_negative.png"))
        self.assertTrue(Path(module.LOGO_PATH).is_file())
        self.assertEqual(module.CSV_BLUE, (25, 99, 150))
        self.assertEqual(module.CSV_GREEN, (45, 191, 127))

    def test_escopo_e_ressalvas(self):
        text = " ".join(f["titulo"] + " " + f["resumo"] for f in module.FATOS) + " ".join(module.OBSERVACOES)
        for required in ("5.137.650,01", "16,8%", "custos operacionais", "economia realizada", "Programa Cuidar", "26 a 30", "Pediakids", "aplicação dos testes", "Philips", "ratificou", "efetividade", "Ymunity", "440.751,40", "anuais", "quatro", "MINASPETRO", "Guias de Urgência"):
            self.assertIn(required, text)
        self.assertNotRegex(text, re.compile(r"Serpa Braz|CMS-CSV|Compass|Cloudflare|OpenClaw|Extensio|GitHub|Manus|\ufffd", re.I))

    def test_a4_unico_conteudo_legivel(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "Signal_S42_2026.pdf"
            module.build_signal_pdf(str(output))
            reader = PdfReader(output)
            self.assertEqual(len(reader.pages), 1)
            page = reader.pages[0]
            self.assertAlmostEqual(float(page.mediabox.width), 595.28, delta=1)
            self.assertAlmostEqual(float(page.mediabox.height), 841.89, delta=1)
            text = re.sub(r"\s+", " ", page.extract_text())
            for required in ("S42/2026", "v4.20", "5.137.650,01", "440.751,40", "Pediakids", "MINASPETRO", "Página 1"):
                self.assertIn(required, text)
            for fact in module.FATOS:
                self.assertIn(re.sub(r"\s+", " ", fact["resumo"]), text)
            blocks = []
            page.extract_text(visitor_text=lambda t, cm, tm, font, size: blocks.append((t, size)))
            body = [size for t, size in blocks if "custos operacionais" in t or "Philips" in t or "economia apurada" in t]
            self.assertTrue(body)
            self.assertGreaterEqual(min(body), 9.0)

    def test_cards_sem_extravasamento(self):
        pdf = module.SignalPDF()
        pdf.add_page()
        for fact in module.FATOS:
            pdf.draw_fact_card(fact, 12, 70, (pdf.w - 27) / 2, module.CARD_HEIGHT)
            self.assertLessEqual(pdf.get_y(), 70 + module.CARD_HEIGHT - 1)


if __name__ == "__main__":
    unittest.main()
