#!/usr/bin/env python3
"""Aceitação editorial, estrutural e de legibilidade do Signal™ S40/2026."""
import importlib.util
import re
import tempfile
import unittest
from pathlib import Path
from pypdf import PdfReader

SCRIPT = Path(__file__).with_name("signal-pdf-gen-s40.py")
if not SCRIPT.exists():
    SCRIPT = SCRIPT.with_name("signal-pdf-gen-s39.py")
spec = importlib.util.spec_from_file_location("signal_s40", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SignalS40Tests(unittest.TestCase):
    def test_edicao_aprovada(self):
        self.assertEqual(module.SEMANA, "40")
        self.assertEqual(module.PERIODO, "28 de setembro a 2 de outubro de 2026")
        self.assertEqual(module.DATA_GERACAO, "10/10/2026")
        self.assertIn(("v4.17", "Dicionário Oficial"), module.METRICAS)
        self.assertEqual(len(module.FATOS), 6)
        self.assertEqual(len(module.OBSERVACOES), 2)
        self.assertTrue(module.LOGO_PATH.endswith("grupo_csv_logo_negative.png"))
        self.assertTrue(Path(module.LOGO_PATH).is_file())
        self.assertEqual(module.CSV_BLUE, (25, 99, 150))
        self.assertEqual(module.CSV_GREEN, (45, 191, 127))

    def test_escopo_e_estagios(self):
        text = " ".join(f["titulo"] + " " + f["resumo"] for f in module.FATOS) + " ".join(module.OBSERVACOES)
        for required in ("Lotus", "SIAUSP", "DRG", "PPE-15", "Hi!", "PNGPPD", "não", "pendente"):
            self.assertIn(required, text)
        self.assertNotRegex(text, re.compile(r"Serpa Braz|CMS-CSV|Compass|Cloudflare|OpenClaw|Extensio|GitHub", re.I))

    def test_pdf_a4_unico_e_numeros(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "Signal_S40_2026.pdf"
            module.build_signal_pdf(str(output))
            reader = PdfReader(output)
            self.assertEqual(len(reader.pages), 1)
            page = reader.pages[0]
            self.assertAlmostEqual(float(page.mediabox.width), 595.28, delta=1)
            self.assertAlmostEqual(float(page.mediabox.height), 841.89, delta=1)
            text = re.sub(r"\s+", " ", page.extract_text())
            for required in ("S40/2026", "80,00", "160,00", "60 indicadores", "81,9%", "3.700,1", "96,26%", "118", "656", "18%", "9,8%", "9,93", "8,22", "20", "Página 1"):
                self.assertIn(required, text)
            blocks = []
            page.extract_text(visitor_text=lambda t, cm, tm, font, size: blocks.append((t, size)))
            body = [size for t, size in blocks if "Lotus" in t or "contestação" in t]
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
