#!/usr/bin/env python3
"""Aceitação editorial e estrutural do Signal™ S44/2026."""
import importlib.util
import json
import re
import tempfile
import unittest
from pathlib import Path
from pypdf import PdfReader

HERE = Path(__file__).parent
SCRIPT = HERE / 'signal-pdf-gen-s44.py'
if not SCRIPT.exists():
    SCRIPT = HERE / 'signal-pdf-gen-s42.py'
spec = importlib.util.spec_from_file_location('signal_s44', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
GOLDEN = HERE / 's44-conteudo-aprovado.json'
if not GOLDEN.exists():
    GOLDEN = Path.home() / 'work/s44-conteudo-aprovado.json'
APPROVED = json.loads(GOLDEN.read_text(encoding='utf-8'))


class SignalS44Tests(unittest.TestCase):
    def test_edicao(self):
        self.assertEqual(module.SEMANA, '44')
        self.assertEqual(module.PERIODO, APPROVED['period'])
        self.assertEqual(module.DATA_GERACAO, '31/10/2026')
        self.assertIn(('v4.23', 'Dicionário Oficial'), module.METRICAS)
        self.assertIn(('32', 'Movimentos no Dicionário'), module.METRICAS)
        self.assertEqual(len(module.FATOS), 6)
        self.assertEqual(len(module.OBSERVACOES), 2)

    def test_texto_aprovado_integral(self):
        self.assertEqual(module.FATOS, APPROVED['facts'])
        self.assertEqual(module.OBSERVACOES, [m['titulo'] + ': ' + m['resumo'] for m in APPROVED['movements']])

    def test_identidade(self):
        self.assertTrue(module.LOGO_PATH.endswith('grupo_csv_logo_negative.png'))
        self.assertTrue(Path(module.LOGO_PATH).is_file())
        self.assertEqual(module.CSV_BLUE, (25, 99, 150))
        self.assertEqual(module.CSV_GREEN, (45, 191, 127))

    def test_escopo_e_ressalvas(self):
        text = ' '.join(f['titulo'] + ' ' + f['resumo'] for f in module.FATOS) + ' '.join(module.OBSERVACOES)
        for required in ('Programa Cuidar', 'operação assistida', '40 pontos ou mais', 'no recorte avaliado', 'Núcleo de Acesso ao Cuidado', 'Central de Coordenação do Cuidado', 'assinaturas pendentes', 'grade incompleta', '88%', '36 de 41', 'julho a 25 de outubro', 'WeKnow', 'janeiro de 2024 a junho de 2026'):
            self.assertIn(required, text)
        self.assertNotRegex(text, re.compile(r'Serpa Braz|CMS-CSV|Compass|Cloudflare|OpenClaw|Extensio|GitHub|Manus|\ufffd', re.I))

    def test_a4_unico_conteudo_legivel(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'Signal_S44_2026.pdf'
            module.build_signal_pdf(str(output))
            reader = PdfReader(output)
            self.assertEqual(len(reader.pages), 1)
            page = reader.pages[0]
            self.assertAlmostEqual(float(page.mediabox.width), 595.28, delta=1)
            self.assertAlmostEqual(float(page.mediabox.height), 841.89, delta=1)
            text = re.sub(r'\s+', ' ', page.extract_text())
            for required in ('S44/2026', 'v4.23', '88%', '36 de 41', 'Página 1'):
                self.assertIn(required, text)
            for fact in APPROVED['facts']:
                self.assertIn(re.sub(r'\s+', ' ', fact['titulo']), text)
                self.assertIn(re.sub(r'\s+', ' ', fact['resumo']), text)
            for movement in APPROVED['movements']:
                self.assertIn(re.sub(r'\s+', ' ', movement['resumo']), text)
            blocks = []
            page.extract_text(visitor_text=lambda t, cm, tm, font, size: blocks.append((t, size)))
            body = [size for t, size in blocks if 'encerrou' in t or 'conferência' in t or 'pactuação' in t or 'assinaturas pendentes' in t]
            self.assertTrue(body)
            self.assertGreaterEqual(min(body), 9.0)
            fonts = page['/Resources']['/Font'].get_object()
            self.assertTrue(any('Inter' in str(font.get_object().get('/BaseFont', '')) for font in fonts.values()))

    def test_cards_sem_extravasamento(self):
        pdf = module.SignalPDF()
        pdf.add_page()
        for fact in APPROVED['facts']:
            pdf.draw_fact_card(fact, 12, 70, (pdf.w - 27) / 2, module.CARD_HEIGHT)
            self.assertLessEqual(pdf.get_y(), 70 + module.CARD_HEIGHT - 1)


if __name__ == '__main__':
    unittest.main()
