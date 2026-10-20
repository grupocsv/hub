#!/usr/bin/env python3
"""Aceitação editorial e estrutural do Signal™ S41/2026."""
import importlib.util
import re
import tempfile
import unittest
from pathlib import Path
from pypdf import PdfReader

SCRIPT = Path(__file__).with_name("signal-pdf-gen-s41.py")
if not SCRIPT.exists():
    SCRIPT = SCRIPT.with_name("signal-pdf-gen-s40.py")
spec = importlib.util.spec_from_file_location("signal_s41", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SignalS41Tests(unittest.TestCase):
    def test_edicao(self):
        self.assertEqual(module.SEMANA, "41")
        self.assertEqual(module.PERIODO, "5 a 9 de outubro de 2026")
        self.assertEqual(module.DATA_GERACAO, "17/10/2026")
        self.assertIn(("v4.19", "Dicionário Oficial"), module.METRICAS)
        self.assertEqual(len(module.FATOS), 6)
        self.assertEqual(len(module.OBSERVACOES), 1)

    def test_identidade(self):
        self.assertTrue(module.LOGO_PATH.endswith("grupo_csv_logo_negative.png"))
        self.assertTrue(Path(module.LOGO_PATH).is_file())
        self.assertEqual(module.CSV_BLUE, (25, 99, 150))
        self.assertEqual(module.CSV_GREEN, (45, 191, 127))

    def test_escopo_e_ressalvas(self):
        text = " ".join(f["titulo"] + " " + f["resumo"] for f in module.FATOS) + " ".join(module.OBSERVACOES)
        for required in ("SWOT", "Hi!", "Lotus", "Endocrinologia Pediátrica", "PPE-15", "Guias de Urgência", "auditorias", "PDGC", "não", "diagnóstico"):
            self.assertIn(required, text)
        self.assertNotRegex(text, re.compile(r"Serpa Braz|CMS-CSV|Compass|Cloudflare|OpenClaw|Extensio|GitHub|Manus", re.I))

    def test_a4_unico_conteudo_legivel(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "Signal_S41_2026.pdf"
            module.build_signal_pdf(str(output))
            reader = PdfReader(output)
            self.assertEqual(len(reader.pages), 1)
            page = reader.pages[0]
            self.assertAlmostEqual(float(page.mediabox.width), 595.28, delta=1)
            self.assertAlmostEqual(float(page.mediabox.height), 841.89, delta=1)
            text = re.sub(r"\s+", " ", page.extract_text())
            for required in ("S41/2026", "v4.19", "SWOT", "PPE-15", "Lotus", "PDGC", "Página 1"):
                self.assertIn(required, text)
            blocks = []
            page.extract_text(visitor_text=lambda t, cm, tm, font, size: blocks.append((t, size)))
            body = [size for t, size in blocks if "Lotus" in t or "diagnóstico" in t]
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
