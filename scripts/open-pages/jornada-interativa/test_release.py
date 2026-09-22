"""Contrato local do bloqueio anônimo exigido antes de publicar a Jornada."""
import io
import json
import unittest
from email.message import Message
from urllib.error import HTTPError
from unittest.mock import Mock
from release import Release, ACCOUNT, BUCKET, BUCKET_API, WORKER_SETTINGS, object_path

class PrivateOrigin(unittest.TestCase):
    def subject(self, enabled=False, domains=None, binding=BUCKET):
        subject=Release.__new__(Release)
        responses={
            BUCKET_API+'/domains/managed':{'enabled':enabled},
            BUCKET_API+'/domains/custom':{'domains':domains or []},
            WORKER_SETTINGS:{'bindings':[{'name':'TEA_CONTENT','type':'r2_bucket','bucket_name':binding}]},
        }
        subject.request=Mock(side_effect=lambda path:(json.dumps({'success':True,'result':responses[path]}).encode(),{}))
        return subject

    def test_private_bucket_and_binding_are_required(self):
        self.assertEqual(self.subject().check_private_origin()['bucket'],BUCKET)

    def test_enabled_managed_domain_is_refused(self):
        with self.assertRaisesRegex(ValueError,'R2_DEV_ENABLED'):
            self.subject(enabled=True).check_private_origin()

    def test_custom_domain_is_refused(self):
        with self.assertRaisesRegex(ValueError,'CUSTOM_DOMAINS_PRESENT'):
            self.subject(domains=[{'domain':'public.example'}]).check_private_origin()

    def test_wrong_worker_binding_is_refused(self):
        with self.assertRaisesRegex(ValueError,'BINDING_INVALID'):
            self.subject(binding='csv-open-pages').check_private_origin()

    def test_old_shared_bucket_is_never_a_target(self):
        subject=Release.__new__(Release)
        path=f'/accounts/{ACCOUNT}/r2/buckets/csv-open-pages/objects/jornada-tea%2Findex.html'
        for method in ('GET','PUT'):
            with self.subTest(method=method),self.assertRaisesRegex(ValueError,'API_PATH_REFUSED'):
                subject.request(path,method)

    def test_object_key_is_fully_encoded(self):
        self.assertTrue(object_path('jornada-tea/index.html').endswith('/jornada-tea%2Findex.html'))

    def test_other_prefix_is_refused(self):
        with self.assertRaisesRegex(ValueError,'OBJECT_PREFIX_REFUSED'):
            object_path('caminhos-brilhantes/index.html')

class GateContract(unittest.TestCase):
    def subject(self, status=401, extra=None, get_body=b'Acesso institucional', head_body=b''):
        headers=Message()
        for key,value in {'X-TEA-Access':'required','Cache-Control':'private, no-store',**(extra or {})}.items():
            headers[key]=value
        item=Release.__new__(Release)
        item.opener=Mock()
        def open_request(request,timeout):
            body=head_body if request.method=='HEAD' else get_body
            if status>=400:
                raise HTTPError(request.full_url,status,'test',headers,io.BytesIO(body))
            response=Mock();response.status=status;response.headers=headers;response.read.return_value=body
            response.__enter__=Mock(return_value=response);response.__exit__=Mock(return_value=False)
            return response
        item.opener.open.side_effect=open_request
        return item

    def test_protected_page_get_and_head(self):
        subject=self.subject()
        result=subject.check_access_required()
        self.assertEqual(result['anonymous_get'],401)
        self.assertEqual([call.args[0].method for call in subject.opener.open.call_args_list],['GET','HEAD'])

    def test_protected_file(self):
        self.assertEqual(self.subject().check_access_required('jornada-tea/mapa.png')['anonymous_head'],401)

    def test_public_200_is_refused(self):
        with self.assertRaisesRegex(ValueError,'ACCESS_NOT_REQUIRED'):
            self.subject(status=200).check_access_required()

    def test_provider_unavailable_is_not_success(self):
        with self.assertRaisesRegex(ValueError,'ACCESS_NOT_REQUIRED'):
            self.subject(status=503).check_access_required()

    def test_generic_401_without_contract_is_refused(self):
        with self.assertRaisesRegex(ValueError,'GATE_NOT_IDENTIFIED'):
            self.subject(extra={'X-TEA-Access':'other'}).check_access_required()

    def test_cacheable_denial_is_refused(self):
        with self.assertRaisesRegex(ValueError,'MAY_BE_CACHED'):
            self.subject(extra={'Cache-Control':'public,max-age=600'}).check_access_required()

    def test_content_in_error_is_refused(self):
        for body in (b'<svg>mapa</svg>',b'jornada-interactive-points',b'\x89PNG\r\n'):
            with self.subTest(body=body),self.assertRaisesRegex(ValueError,'CONTENT_EXPOSED'):
                self.subject(get_body=body).check_access_required()

    def test_head_must_not_include_body(self):
        with self.assertRaisesRegex(ValueError,'HEAD_HAS_BODY'):
            self.subject(head_body=b'Acesso institucional').check_access_required()

if __name__=='__main__':
    unittest.main()
