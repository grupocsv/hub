#!/usr/bin/env python3
"""Regressões do escopo editorial Unimed do Signal™."""
import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('signal_scope', ROOT / 'scripts/validate-signal-scope.py')
SCOPE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SCOPE)


class SignalScopeTests(unittest.TestCase):
    def validate(self, markdown, metadata='scope: unimed\n'):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            edition = root / '2026/S47'
            edition.mkdir(parents=True)
            (edition / 'signal.md').write_text(markdown, encoding='utf-8')
            (edition / 'metadata.yml').write_text(metadata, encoding='utf-8')
            output = io.StringIO()
            with patch.object(SCOPE, 'SIGNAL_ROOT', root), contextlib.redirect_stderr(output), contextlib.redirect_stdout(output):
                result = SCOPE.main()
            return result, output.getvalue()

    def synthetic_markdown(self, extra=''):
        return '## Fatos Estratégicos\n\n' + '\n\n'.join(
            f'{i}. **[GESTÃO] Referência Unimed {i}** Conteúdo sintético para validação. {extra if i == 5 else ""}'
            for i in range(1, 6)
        ) + '\n\n## PDF\n'

    def test_texto_aprovado_com_atencao_primaria_e_aceito(self):
        approved = json.loads((ROOT / 'tools/signal-pdf/s47-conteudo-aprovado.json').read_text(encoding='utf-8'))
        markdown = '## Fatos Estratégicos\n\n' + '\n\n'.join(
            f'{i}. **[{fact["tag"]}] {fact["titulo"]}** {fact["resumo"]}'
            for i, fact in enumerate(approved['facts'], 1)
        ) + '\n\n## PDF\n'
        result, output = self.validate(markdown)
        self.assertEqual(result, 0, output)

    def test_serpa_braz_permanece_proibido(self):
        result, output = self.validate(self.synthetic_markdown('Serpa Braz'))
        self.assertEqual(result, 1, output)
        self.assertIn('Serpa Braz', output)

    def test_todos_assuntos_internos_permanecem_bloqueados(self):
        examples = ('CMS-CSV', 'Compass', 'OpenClaw', 'Extensio', 'Agent Context Bridge', 'ACB', 'Cloudflare', 'GitHub', 'Worker', 'Workers', 'VPS', 'VPS-CSV', 'D1', 'R2', 'deploy', 'pull request')
        for topic in examples:
            with self.subTest(topic=topic):
                result, output = self.validate(self.synthetic_markdown(topic))
                self.assertEqual(result, 1, output)
                self.assertIn('assunto interno proibido', output)

    def test_swot_generica_nao_e_ancora_institucional(self):
        markdown = self.synthetic_markdown().replace('Referência Unimed 5', 'Análise Comparativa da SWOT 2027')
        result, output = self.validate(markdown)
        self.assertEqual(result, 1, output)
        self.assertIn('fato 5 não contém âncora', output)

    def test_metadata_sem_escopo_unimed_e_rejeitado(self):
        result, output = self.validate(self.synthetic_markdown(), metadata='scope: csv\n')
        self.assertEqual(result, 1, output)
        self.assertIn('scope: unimed', output)


if __name__ == '__main__':
    unittest.main()
