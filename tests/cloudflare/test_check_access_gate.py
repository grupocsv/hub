import importlib.util
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "check_access_gate", Path(__file__).resolve().parents[2] / "scripts/cloudflare/check-access-gate.py"
)
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)

HOST = "hub-staging.grupocsv.com"


def app(domain, decisions=("allow",), kind="self_hosted"):
    return {"type": kind, "domain": domain, "policies": [{"decision": d} for d in decisions]}


class AccessGateTest(unittest.TestCase):
    def test_root_app_with_allow_policy_covers(self):
        self.assertTrue(mod.covers_root(app(HOST), HOST))
        self.assertTrue(mod.covers_root(app(HOST + "/*"), HOST))

    def test_path_app_does_not_cover_root(self):
        self.assertFalse(mod.covers_root(app(HOST + "/_infra"), HOST))

    def test_bypass_only_app_does_not_cover(self):
        self.assertFalse(mod.covers_root(app(HOST, decisions=("bypass",)), HOST))

    def test_other_host_does_not_cover(self):
        self.assertFalse(mod.covers_root(app("hub.grupocsv.com"), HOST))

    def test_destinations_field_is_read(self):
        a = {"type": "self_hosted", "destinations": [{"type": "public", "uri": HOST}],
             "policies": [{"decision": "allow"}]}
        self.assertTrue(mod.covers_root(a, HOST))


if __name__ == "__main__":
    unittest.main()
