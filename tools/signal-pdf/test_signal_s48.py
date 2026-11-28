#!/usr/bin/env python3
"""Aceitação editorial e estrutural do Signal™ S48/2026."""
import hashlib
import importlib.util
import json
import re
import tempfile
import unittest
from pathlib import Path
from pypdf import PdfReader

HERE = Path(__file__).parent
SCRIPT = HERE / 'signal-pdf-gen-s48.py'
APPROVED = json.loads((HERE / 's48-conteudo-aprovado.json').read_text(encoding='utf-8'))


def load_generator():
    if not SCRIPT.is_file():
        raise AssertionError('Gerador S48 ausente; não usar uma edição anterior como fallback.')
    spec = importlib.util.spec_from_file_location('signal_s48', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SignalS48Tests(unittest.TestCase):
    def test_edicao(self):
        module = load_generator()
        self.assertEqual(module.SEMANA, '48')
        self.assertEqual(module.PERIODO, APPROVED['period'])
        self.assertEqual(module.DATA_GERACAO, '27/11/2026')
        self.assertIn(('v4.30', 'Dicionário Oficial'), module.METRICAS)
        self.assertIn(('30', 'Movimentos no Dicionário'), module.METRICAS)
        self.assertIn(('20–27/11', 'Período'), module.METRICAS)
        self.assertEqual(len(module.FATOS), 6)
        self.assertEqual(len(module.OBSERVACOES), 2)

    def test_texto_aprovado_integral(self):
        module = load_generator()
        self.assertEqual(module.FATOS, APPROVED['facts'])
        self.assertEqual(module.OBSERVACOES, [m['titulo'] + ': ' + m['resumo'] for m in APPROVED['movements']])
        self.assertEqual(APPROVED['approved_draft_sha256'], '0a807f71b09c92f9f17698d3adc60a8e3d960f24aea14430f02e6c7822fede0f')

    def test_identidade(self):
        module = load_generator()
        self.assertTrue(module.LOGO_PATH.endswith('grupo_csv_logo_negative.png'))
        self.assertTrue(Path(module.LOGO_PATH).is_file())
        self.assertEqual(module.CSV_BLUE, (25, 99, 150))
        self.assertEqual(module.CSV_GREEN, (45, 191, 127))

    def test_escopo_e_ressalvas(self):
        module = load_generator()
        text = ' '.join(f['titulo'] + ' ' + f['resumo'] for f in module.FATOS) + ' '.join(module.OBSERVACOES)
        for required in ('ainda sem retorno', 'preservar o cronograma', 'antes da consistência dos dados', 'em avaliação pela gestão', 'até o próximo reajuste da CMED'):
            self.assertIn(required.casefold(), text.casefold())
        self.assertNotRegex(text, re.compile(r'Serpa Braz|CMS-CSV|Compass|Cloudflare|OpenClaw|Extensio|GitHub|Manus|Inteligência Artificial|Rastreabilidade\s*—\s*Não Integra|\ufffd', re.I))

    def test_a4_unico_conteudo_legivel(self):
        module = load_generator()
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'Signal_S48_2026.pdf'
            module.build_signal_pdf(str(output))
            reader = PdfReader(output)
            self.assertEqual(len(reader.pages), 1)
            page = reader.pages[0]
            self.assertAlmostEqual(float(page.mediabox.width), 595.28, delta=1)
            self.assertAlmostEqual(float(page.mediabox.height), 841.89, delta=1)
            text = re.sub(r'\s+', ' ', page.extract_text())
            for required in ('S48/2026', 'v4.30', 'Página 1'):
                self.assertIn(required, text)
            for fact in APPROVED['facts']:
                self.assertIn(re.sub(r'\s+', ' ', fact['titulo']), text)
                self.assertIn(re.sub(r'\s+', ' ', fact['resumo']), text)
            for movement in APPROVED['movements']:
                self.assertIn(re.sub(r'\s+', ' ', movement['titulo']), text)
                self.assertIn(re.sub(r'\s+', ' ', movement['resumo']), text)
            blocks = []
            page.extract_text(visitor_text=lambda t, cm, tm, font, size: blocks.append((t, size)))
            body = [size for t, size in blocks if any(x in t for x in ('preço-fábrica', 'TISS/DIOPS', 'Diamante', 'Obrigação', 'cooperados', 'sensibilizados'))]
            self.assertTrue(body)
            self.assertGreaterEqual(min(body), 9.0)
            fonts = page['/Resources']['/Font'].get_object()
            embedded = []
            for font in fonts.values():
                for descendant in font.get_object().get('/DescendantFonts', []):
                    descriptor = descendant.get_object()['/FontDescriptor'].get_object()
                    self.assertIn('/FontFile2', descriptor)
                    embedded.append(str(descriptor['/FontName']))
            self.assertEqual(len(embedded), 3)
            self.assertTrue(all('Inter' in name for name in embedded))

    def test_cards_sem_extravasamento(self):
        module = load_generator()
        pdf = module.SignalPDF()
        pdf.add_page()
        for fact in APPROVED['facts']:
            pdf.draw_fact_card(fact, 12, 70, (pdf.w - 27) / 2, module.CARD_HEIGHT)
            self.assertLessEqual(pdf.get_y(), 70 + module.CARD_HEIGHT - 1)


if __name__ == '__main__':
    unittest.main()
