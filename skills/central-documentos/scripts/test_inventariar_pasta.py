"""Verificações offline com arquivos sintéticos temporários."""

import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import inventariar_pasta as inventory_module
from inventariar_pasta import candidate_key, prepare_paths, run, stable_hash


class InventoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="central-inventory-test-")
        self.base = Path(self.temp.name)
        self.source = self.base / "source"
        self.source.mkdir()
        self.output = self.base / "inventory.json"

    def tearDown(self):
        self.temp.cleanup()

    def test_hashes_duplicates_and_versions_without_content(self):
        (self.source / "Manual v1.md").write_bytes(b"primeira versao")
        (self.source / "Manual v2.md").write_bytes(b"segunda versao")
        (self.source / "Copia.md").write_bytes(b"segunda versao")
        (self.source / "tabela.xlsx").write_bytes(b"formato-nao-suportado")
        before = {p.name: p.read_bytes() for p in self.source.iterdir()}
        result = run(self.source, self.output)
        self.assertEqual(result["file_count"], 4)
        self.assertEqual(result["total_bytes"], sum(len(v) for v in before.values()))
        self.assertTrue(result["scope_complete"])
        self.assertFalse(result["upload_performed"])
        self.assertFalse(result["central_compared"])
        self.assertEqual(len(result["duplicate_groups"]), 1)
        self.assertEqual(len(result["version_candidates"]), 1)
        by_path = {item["path"]: item for item in result["files"]}
        self.assertEqual(by_path["Manual v2.md"]["sha256"], hashlib.sha256(b"segunda versao").hexdigest())
        self.assertFalse(by_path["tabela.xlsx"]["extension_supported"])
        self.assertNotIn("segunda versao", self.output.read_text(encoding="utf-8"))
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.source.iterdir()})
        self.assertEqual(json.loads(self.output.read_text(encoding="utf-8"))["file_count"], 4)

    def test_nested_files_streamed_and_deterministically_sorted(self):
        subfolder = self.source / "sub"
        subfolder.mkdir()
        payload = b"x" * (3 * 1024 * 1024 + 7)
        (subfolder / "grande.PDF").write_bytes(payload)
        (self.source / "a.txt").write_text("a", encoding="utf-8")
        result = run(self.source, self.output)
        self.assertEqual([item["path"] for item in result["files"]], ["a.txt", "sub/grande.PDF"])
        self.assertEqual(result["files"][1]["sha256"], hashlib.sha256(payload).hexdigest())
        self.assertEqual(result["files"][1]["extension"], ".pdf")

    def test_reject_output_inside_source(self):
        with self.assertRaisesRegex(ValueError, "saida_dentro_da_origem"):
            prepare_paths(self.source, self.source / "out.json")

    def test_reject_existing_output(self):
        self.output.write_text("preservar", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "saida_ja_existe"):
            run(self.source, self.output)
        self.assertEqual(self.output.read_text(encoding="utf-8"), "preservar")

    def test_reject_output_in_git(self):
        repo = self.base / "repo"
        repo.mkdir()
        (repo / ".git").write_text("gitdir: outro", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "saida_dentro_de_repositorio_git"):
            prepare_paths(self.source, repo / "out.json")

    def test_skip_file_and_directory_symlinks(self):
        outside = self.base / "outside"
        outside.mkdir()
        secret = outside / "privado.txt"
        secret.write_text("nunca incluir", encoding="utf-8")
        try:
            (self.source / "atalho.txt").symlink_to(secret)
            (self.source / "pasta-atalho").symlink_to(outside, target_is_directory=True)
        except OSError:
            self.skipTest("Host não permite criação de links simbólicos de teste")
        result = run(self.source, self.output)
        self.assertFalse(result["scope_complete"])
        self.assertEqual(result["files"], [])
        self.assertEqual(len(result["issues"]), 2)
        self.assertNotIn("nunca incluir", self.output.read_text(encoding="utf-8"))

    def test_candidate_name_is_not_a_version_conclusion(self):
        self.assertEqual(candidate_key("sub/Manual versão 2.md"), candidate_key("sub/Manual v1.pdf"))
        self.assertNotEqual(candidate_key("sub/Manual v2.md"), candidate_key("outro/Manual v1.md"))
        (self.source / "Manual v1.md").write_bytes(b"igual")
        (self.source / "Manual v2.md").write_bytes(b"igual")
        result = run(self.source, self.output)
        self.assertEqual(len(result["duplicate_groups"]), 1)
        self.assertEqual(result["version_candidates"], [])

    def test_reject_source_and_output_under_symlink(self):
        linked = self.base / "linked"
        try:
            linked.symlink_to(self.source, target_is_directory=True)
        except OSError:
            self.skipTest("Host não permite criação de links simbólicos de teste")
        with self.assertRaisesRegex(ValueError, "caminho_com_link_ou_reparse"):
            prepare_paths(linked, self.output)
        with self.assertRaisesRegex(ValueError, "caminho_com_link_ou_reparse"):
            prepare_paths(self.source, linked / "out.json")

    def test_reject_file_modified_during_hashing(self):
        document = self.source / "manual.txt"
        document.write_bytes(b"antes")
        real_sha256 = hashlib.sha256

        class ModifyingHash:
            def __init__(self):
                self.inner = real_sha256()
                self.modified = False

            def update(self, block):
                self.inner.update(block)
                if not self.modified:
                    self.modified = True
                    document.write_bytes(b"alterado-durante-leitura")

            def hexdigest(self):
                return self.inner.hexdigest()

        with patch.object(inventory_module.hashlib, "sha256", ModifyingHash):
            with self.assertRaisesRegex(ValueError, "arquivo_alterado_durante_leitura"):
                stable_hash(document, self.source)


if __name__ == "__main__":
    unittest.main()
