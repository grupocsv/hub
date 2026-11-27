import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("check_access_gate", ROOT / "scripts/cloudflare/check-access-gate.py")
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)

HOST = "hub-staging.grupocsv.com"
POLICY = json.loads((ROOT / "cloudflare/hub-access-policy.json").read_text())

PEOPLE = {"decision": "allow", "name": "pessoas", "include": [
    {"email": {"email": "guilherme@grupocsv.com"}},
    {"email_domain": {"domain": "grupocsv.com"}},
]}
TOKEN = {"decision": "non_identity", "name": "bateria", "include": [{"service_token": {"token_id": "abc"}}]}
BYPASS = {"decision": "bypass", "name": "publico", "include": [{"everyone": {}}]}


def app(domain, *policies, kind="self_hosted"):
    return {"type": kind, "name": domain, "domain": domain, "policies": list(policies)}


def run(*apps):
    return mod.evaluate(list(apps), HOST, POLICY)


class AccessGateTest(unittest.TestCase):
    def test_closed_door_passes(self):
        roots, problems = run(
            app(HOST, PEOPLE, TOKEN),
            app(HOST + "/compliance/*", BYPASS),
            app(HOST + "/_infra", {"decision": "allow", "include": [{"email": {"email": "guilherme@grupocsv.com"}}]}),
        )
        self.assertEqual(problems, [])
        self.assertEqual(roots, [HOST])

    def test_root_with_wildcard_counts(self):
        self.assertEqual(run(app(HOST + "/*", PEOPLE))[1], [])

    def test_missing_root_app_is_refused(self):
        _, problems = run(app(HOST + "/_infra", PEOPLE))
        self.assertTrue(any("raiz" in p for p in problems))

    def test_allow_everyone_is_refused(self):
        _, problems = run(app(HOST, {"decision": "allow", "include": [{"everyone": {}}]}))
        self.assertTrue(any("'everyone'" in p for p in problems))

    def test_public_email_domain_is_refused(self):
        _, problems = run(app(HOST, {"decision": "allow", "include": [{"email_domain": {"domain": "gmail.com"}}]}))
        self.assertTrue(any("gmail.com" in p for p in problems))

    def test_any_service_token_and_ip_and_group_are_refused(self):
        for rule in ({"any_valid_service_token": {}}, {"ip": {"ip": "0.0.0.0/0"}}, {"group": {"id": "g"}}):
            _, problems = run(app(HOST, {"decision": "allow", "include": [rule]}))
            self.assertTrue(problems, rule)

    def test_bypass_on_root_is_refused(self):
        _, problems = run(app(HOST, PEOPLE, BYPASS))
        self.assertTrue(any("passagem livre" in p for p in problems))

    def test_bypass_on_private_path_is_refused(self):
        _, problems = run(app(HOST, PEOPLE), app(HOST + "/_infra/*", BYPASS))
        self.assertTrue(any("/_infra" in p for p in problems))

    def test_bypass_on_public_subpath_passes(self):
        self.assertEqual(run(app(HOST, PEOPLE), app(HOST + "/compass/edicoes/*", BYPASS))[1], [])

    def test_unreadable_policies_are_refused(self):
        a = {"type": "self_hosted", "name": "x", "domain": HOST}
        _, problems = run(a)
        self.assertTrue(any("sem como conferir" in p for p in problems))

    def test_other_hosts_are_ignored(self):
        self.assertEqual(run(app(HOST, PEOPLE), app("central.gabi.care", {"decision": "allow", "include": [{"everyone": {}}]}))[1], [])

    def test_destinations_field_is_read(self):
        a = {"type": "self_hosted", "name": "d", "destinations": [{"type": "public", "uri": HOST}], "policies": [PEOPLE]}
        self.assertEqual(run(a)[1], [])


if __name__ == "__main__":
    unittest.main()
