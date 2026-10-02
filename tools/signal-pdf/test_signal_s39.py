#!/usr/bin/env python3
"""Testes de aceitação da edição S39/2026 do Signal™."""
import importlib.util
import re
import tempfile
import unittest
from pathlib import Path
from pypdf import PdfReader

SCRIPT = Path(__file__).with_name("signal-pdf-gen-s39.py")
spec = importlib.util.spec_from_file_location("signal_s39", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SignalS39Tests(unittest.TestCase):
    def test_edicao_e_escopo_aprovados(self):
        self.assertEqual(module.SEMANA, "39")
        self.assertEqual(module.PERIODO, "21 a 25 de setembro de 2026")
        self.assertEqual(module.DATA_GERACAO, "02/10/2026")
        self.assertEqual(module.CSV_BLUE, (25, 99, 150))
        self.assertEqual(module.CSV_GREEN, (45, 191, 127))
        self.assertTrue(module.LOGO_PATH.endswith("grupo_csv_logo_negative.png"))
        self.assertTrue(Path(module.LOGO_PATH).is_file())
        self.assertEqual(len(module.FATOS), 6)
        self.assertEqual(len(module.OBSERVACOES), 2)
        self.assertIn(("v4.15", "Dicionário Oficial"), module.METRICAS)
        titles = " ".join(f["titulo"] for f in module.FATOS).lower()
        for required in ("ressonância", "opme", "parto", "tea", "câncer de mama", "medicina interna"):
            self.assertIn(required, titles)
        editorial = " ".join(f["titulo"] + " " + f["resumo"] for f in module.FATOS) + " ".join(module.OBSERVACOES)
        for prohibited in (r"\bSerpa Braz\b", r"\bCMS-CSV\b", r"\bCompass\b", r"\bCloudflare\b", r"\bOpenClaw\b"):
            self.assertNotRegex(editorial, re.compile(prohibited, re.I))

    def test_pdf_contem_todos_os_fatos_sem_paginas_extras(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "Signal_S39_2026.pdf"
            module.build_signal_pdf(str(output))
            reader = PdfReader(str(output))
            self.assertEqual(len(reader.pages), 1)
            page = reader.pages[0]
            self.assertAlmostEqual(float(page.mediabox.width), 595.28, delta=1)
            self.assertAlmostEqual(float(page.mediabox.height), 841.89, delta=1)
            text = re.sub(r"\s+", " ", page.extract_text())
            self.assertNotRegex(page.extract_text(), r"Medicina {2,}Interna")
            self.assertIn("Signal™ S39/2026", text)
            for word in ("200 exames", "44", "53", "3,5%", "3,52", "35", "19,0%", "ESC TEA 100", "93,9%", "minicomputadores"):
                self.assertIn(word, text)
            self.assertIn("Página 1", text)
            font_blocks = []
            page.extract_text(visitor_text=lambda txt, cm, tm, font, size: font_blocks.append((txt, size)))
            body = [size for txt, size in font_blocks if "notificações" in txt or "Grupo Elfa" in txt]
            self.assertTrue(body)
            self.assertGreaterEqual(min(body), 9.0)
            notes = [size for txt, size in font_blocks if "minicomputadores" in txt]
            self.assertTrue(notes)
            self.assertGreaterEqual(min(notes), 7.5)

    def test_cada_resumo_cabe_no_card_sem_sobreposicao(self):
        pdf = module.SignalPDF()
        pdf.add_page()
        for fato in module.FATOS:
            pdf.draw_fact_card(fato, x=12, y=70, card_w=(pdf.w - 27) / 2, card_h=module.CARD_HEIGHT)
            self.assertLessEqual(pdf.get_y(), 70 + module.CARD_HEIGHT - 1, fato["titulo"])


if __name__ == "__main__":
    unittest.main()
