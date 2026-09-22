"""Contratos da transformação editorial, sem copiar a página privada para o Git."""
import unittest
from unittest.mock import patch
import editorial_esc_tea as editorial


class EditorialTests(unittest.TestCase):
    def setUp(self):
        # Documento sintético: sentinelas simulam cabeçalho, destinos e scripts.
        self.fixture = '<header>IDENTIDADE</header>\n' + '\n'.join(
            before for _, before, _ in editorial.REPLACEMENTS
        ) + '\n<script>const keep = "auth";</script><footer>DESTINOS</footer>'

    def apply_fixture(self, source=None):
        with patch.object(editorial, 'BASE_SHA256', editorial.sha(self.fixture)):
            return editorial.apply(self.fixture if source is None else source)

    def test_unknown_or_concurrently_edited_source_is_refused(self):
        with self.assertRaisesRegex(ValueError, 'SOURCE_CHANGED'):
            self.apply_fixture(self.fixture.replace('IDENTIDADE', 'EDITADO'))

    def test_second_application_is_refused(self):
        revised, _ = self.apply_fixture()
        with self.assertRaisesRegex(ValueError, 'SOURCE_CHANGED'):
            self.apply_fixture(revised)

    def test_missing_and_duplicated_anchors_are_refused_even_with_known_digest(self):
        anchor = editorial.REPLACEMENTS[0][1]
        for source in (self.fixture.replace(anchor, ''), self.fixture + anchor):
            with self.subTest(source=source[-30:]):
                with patch.object(editorial, 'BASE_SHA256', editorial.sha(source)):
                    with self.assertRaisesRegex(ValueError, 'MATCH_AMBIGUOUS'):
                        editorial.apply(source)

    def test_round_trip_preserves_unrelated_markup_and_scripts(self):
        revised, receipt = self.apply_fixture()
        self.assertTrue(receipt['reversible_byte_for_byte'])
        restored = revised
        for _, before, after in reversed(editorial.REPLACEMENTS):
            restored = restored.replace(after, before, 1)
        self.assertEqual(restored, self.fixture)
        self.assertTrue(revised.startswith('<header>IDENTIDADE</header>'))
        self.assertTrue(revised.endswith('<script>const keep = "auth";</script><footer>DESTINOS</footer>'))

    def test_no_clinical_threshold_or_support_level_equivalence_is_added(self):
        revised, _ = self.apply_fixture()
        for obsolete in ('TEA Nível', '31 a 36 pts', '48,25', 'Questionário aos Responsáveis · 20 Itens', 'É ela que separa'):
            self.assertNotIn(obsolete, revised)
        self.assertIn(editorial.METHODOLOGY_URL, revised)
        self.assertIn('O escore apoia essa decisão; não a substitui.', revised)
        self.assertIn('A Jornada mantém seu escopo infantil.', revised)


if __name__ == '__main__':
    unittest.main()
