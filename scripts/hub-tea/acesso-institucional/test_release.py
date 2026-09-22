import unittest
from release import Release,WORKER,R2,ACCOUNT,upload_metadata,index_headers
class ReleaseScope(unittest.TestCase):
 def setUp(self):self.release=Release.__new__(Release)
 def test_other_worker_is_refused(self):
  with self.assertRaisesRegex(ValueError,'API_TARGET_REFUSED'):self.release.request(f'/accounts/{ACCOUNT}/workers/scripts/csv-auth','PUT',b'')
 def test_other_object_is_refused(self):
  with self.assertRaisesRegex(ValueError,'WRITE_TARGET_REFUSED'):self.release.request(R2+'/objects/tea%2Fpeca-jornada.webp','PUT',b'')
 def test_metadata_write_is_refused(self):
  with self.assertRaisesRegex(ValueError,'POST_TARGET_REFUSED'):self.release.request(WORKER+'/settings','POST',b'')
 def test_deletion_is_refused(self):
  with self.assertRaisesRegex(ValueError,'METHOD_REFUSED'):self.release.request(R2+'/objects/tea%2Findex.html','DELETE')
 def test_global_purge_is_not_in_commands(self):
  import inspect
  self.assertNotIn('purge_everything',inspect.getsource(Release.purge))
 def test_unknown_settings_abort(self):
  with self.assertRaisesRegex(ValueError,'UNKNOWN_SETTINGS'):upload_metadata({'new_field':True})
 def test_observability_limits_and_usage_survive_upload(self):
  settings={'bindings':[],'usage_model':'standard','observability':{'enabled':True},'limits':{'cpu_ms':30000},'annotations':{'workers/triggered_by':'version_upload'}}
  metadata=upload_metadata(settings)
  for key in ('observability','limits','usage_model'):self.assertEqual(metadata[key],settings[key])
  self.assertNotIn('annotations',metadata)
 def test_secret_binding_is_kept_by_type_without_value(self):
  settings={'bindings':[{'type':'secret_text','name':'TOKEN'}]}
  self.assertEqual(upload_metadata(settings)['keep_bindings'],['secret_text'])
  self.assertEqual(upload_metadata(settings)['bindings'],[])
 def test_html_metadata_preserves_original_content_type(self):
  self.assertEqual(index_headers({'http_metadata':{'contentType':'text/html'},'custom_metadata':{},'storage_class':'Standard'})['Content-Type'],'text/html')
 def test_custom_metadata_requires_review(self):
  with self.assertRaisesRegex(ValueError,'CUSTOM_METADATA'):index_headers({'http_metadata':{'contentType':'text/html'},'custom_metadata':{'new':'value'},'storage_class':'Standard'})
 def test_unexpected_http_metadata_requires_review(self):
  with self.assertRaisesRegex(ValueError,'HTTP_METADATA'):index_headers({'http_metadata':{'contentType':'text/html','cacheControl':'public'},'custom_metadata':{},'storage_class':'Standard'})
if __name__=='__main__':unittest.main()
